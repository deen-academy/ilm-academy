-- ============================================================================
-- GAMIFICATION FOUNDATION (forward-only)
--
-- Server-authoritative XP ledger + aggregate + timezone-aware streaks,
-- integrated with the two existing authoritative learning events:
--   LESSON_COMPLETED : lesson_progress row transitions to completed = true
--   QUIZ_GRADED      : grade_quiz() trusted RPC
--
-- Clients can only SELECT their own gamification state. All mutations go
-- through SECURITY DEFINER functions that derive identity from auth.uid()
-- or trusted triggers. Duplicate rewards are prevented by a database UNIQUE
-- constraint on the ledger (idempotency identity: user + event type + source).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0) Prerequisite: learner-local timezone for streak day boundaries.
--    Backward compatible: defaults to UTC for all existing rows.
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'UTC';

-- ---------------------------------------------------------------------------
-- 1) XP ledger (append-oriented, auditable)
-- ---------------------------------------------------------------------------
CREATE TABLE public.xp_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount > 0 AND amount <= 1000),
  event_type text NOT NULL CHECK (event_type IN ('lesson_completed', 'quiz_completed', 'quiz_passed')),
  source_type text NOT NULL CHECK (source_type IN ('lesson', 'quiz')),
  source_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Database-enforced idempotency: one reward per (user, event type, source).
  CONSTRAINT xp_events_idempotency_key UNIQUE (user_id, event_type, source_id)
);

CREATE INDEX idx_xp_events_user_created ON public.xp_events (user_id, created_at DESC);

ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own xp events"
  ON public.xp_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all xp events"
  ON public.xp_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- No INSERT/UPDATE/DELETE policies for clients, and no write privileges either.
REVOKE INSERT, UPDATE, DELETE ON public.xp_events FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2) Maintained aggregate: XP total + streak state (one row per learner)
-- ---------------------------------------------------------------------------
CREATE TABLE public.user_gamification (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp integer NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  current_streak integer NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak integer NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gamification"
  ON public.user_gamification FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all gamification"
  ON public.user_gamification FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

REVOKE INSERT, UPDATE, DELETE ON public.user_gamification FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3) Deterministic level curve: level n starts at 100 * (n-1)^2 XP
--    (L1: 0, L2: 100, L3: 400, L4: 900, ...)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_level(_xp integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT GREATEST(1, floor(sqrt(GREATEST(COALESCE(_xp, 0), 0)::numeric / 100))::integer + 1);
$$;

-- ---------------------------------------------------------------------------
-- 4) Streak recording (internal; timezone-aware, idempotent, concurrency-safe
--    via a single atomic upsert). Not callable by API roles.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_learning_activity(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _tz text;
  _today date;
BEGIN
  IF _user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(timezone, 'UTC') INTO _tz FROM public.profiles WHERE id = _user_id;
  IF _tz IS NULL THEN
    _tz := 'UTC';
  END IF;

  -- Guard against invalid user-supplied timezone strings.
  BEGIN
    _today := (now() AT TIME ZONE _tz)::date;
  EXCEPTION WHEN OTHERS THEN
    _today := (now() AT TIME ZONE 'UTC')::date;
  END;

  INSERT INTO public.user_gamification (user_id, current_streak, longest_streak, last_activity_date, updated_at)
  VALUES (_user_id, 1, 1, _today, now())
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = CASE
      WHEN user_gamification.last_activity_date = _today THEN user_gamification.current_streak
      WHEN user_gamification.last_activity_date = _today - 1 THEN user_gamification.current_streak + 1
      ELSE 1
    END,
    longest_streak = GREATEST(
      user_gamification.longest_streak,
      CASE
        WHEN user_gamification.last_activity_date = _today THEN user_gamification.current_streak
        WHEN user_gamification.last_activity_date = _today - 1 THEN user_gamification.current_streak + 1
        ELSE 1
      END
    ),
    last_activity_date = _today,
    updated_at = now();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_learning_activity(uuid) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5) XP award (internal). Ledger insert + aggregate update + streak touch.
--    Idempotent: the ledger UNIQUE constraint makes replays no-ops.
--    Not callable by API roles.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.award_xp(
  _user_id uuid,
  _amount integer,
  _event_type text,
  _source_type text,
  _source_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _inserted boolean := false;
BEGIN
  IF _user_id IS NULL OR _source_id IS NULL OR COALESCE(_amount, 0) <= 0 THEN
    RETURN false;
  END IF;

  INSERT INTO public.xp_events (user_id, amount, event_type, source_type, source_id)
  VALUES (_user_id, _amount, _event_type, _source_type, _source_id)
  ON CONFLICT ON CONSTRAINT xp_events_idempotency_key DO NOTHING;

  IF FOUND THEN
    _inserted := true;
    INSERT INTO public.user_gamification (user_id, total_xp, updated_at)
    VALUES (_user_id, _amount, now())
    ON CONFLICT (user_id) DO UPDATE SET
      total_xp = user_gamification.total_xp + _amount,
      updated_at = now();
  END IF;

  -- Streak credit for the learning activity itself (even on replays the
  -- streak upsert is idempotent for the same local day).
  PERFORM public.record_learning_activity(_user_id);

  RETURN _inserted;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, integer, text, text, uuid) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6) Lesson integration: reward on the authoritative lesson-completion event.
--    Trigger fires only on the false->true completion transition; replayed
--    completions cannot double-award because of the ledger constraint.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_lesson_completion_reward()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.completed = true AND (TG_OP = 'INSERT' OR COALESCE(OLD.completed, false) = false) THEN
    PERFORM public.award_xp(NEW.user_id, 10, 'lesson_completed', 'lesson', NEW.lesson_id);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_lesson_completion_reward() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_lesson_completion_reward ON public.lesson_progress;
CREATE TRIGGER trg_lesson_completion_reward
  AFTER INSERT OR UPDATE ON public.lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_lesson_completion_reward();

-- ---------------------------------------------------------------------------
-- 7) Quiz integration: extend the trusted grading path with rewards.
--    Retry reward policy (anti-farming, database-enforced):
--      * quiz_completed (15 XP): once per learner per quiz, on the first
--        graded attempt — retakes never re-award it.
--      * quiz_passed (25 XP): once per learner per quiz, the first time the
--        score reaches >= 80% — a later successful retry CAN still earn it
--        (mastery is rewarded whenever first achieved), but never twice.
--    Unlimited retakes therefore cap out at 40 XP per quiz, total.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.grade_quiz(_quiz_id uuid, _answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid;
  _score integer := 0;
  _total integer := 0;
  _question record;
  _results jsonb := '[]'::jsonb;
  _user_answer text;
  _course_id uuid;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT m.course_id INTO _course_id
  FROM public.quizzes q
  JOIN public.modules m ON m.id = q.module_id
  WHERE q.id = _quiz_id;

  IF _course_id IS NULL THEN
    RAISE EXCEPTION 'Quiz not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE user_id = _user_id AND course_id = _course_id
  ) THEN
    RAISE EXCEPTION 'Not enrolled in this course';
  END IF;

  -- Delete previous result to allow retakes (preserved existing behavior)
  DELETE FROM public.quiz_results
  WHERE quiz_id = _quiz_id AND user_id = _user_id;

  FOR _question IN
    SELECT id, correct_answer
    FROM public.quiz_questions
    WHERE quiz_id = _quiz_id
    ORDER BY order_number
  LOOP
    _total := _total + 1;
    _user_answer := _answers ->> _question.id::text;

    IF _user_answer = _question.correct_answer THEN
      _score := _score + 1;
      _results := _results || jsonb_build_object('question_id', _question.id, 'correct', true);
    ELSE
      _results := _results || jsonb_build_object('question_id', _question.id, 'correct', false);
    END IF;
  END LOOP;

  INSERT INTO public.quiz_results (quiz_id, user_id, score, total_questions)
  VALUES (_quiz_id, _user_id, _score, _total);

  -- Gamification (idempotent; safe under retakes)
  IF _total > 0 THEN
    PERFORM public.award_xp(_user_id, 15, 'quiz_completed', 'quiz', _quiz_id);
    IF (_score * 100) >= (_total * 80) THEN
      PERFORM public.award_xp(_user_id, 25, 'quiz_passed', 'quiz', _quiz_id);
    END IF;
    PERFORM public.record_learning_activity(_user_id);
  END IF;

  RETURN jsonb_build_object('score', _score, 'total', _total, 'results', _results);
END;
$$;

-- ---------------------------------------------------------------------------
-- 8) Read model: single learner-facing RPC returning server-computed
--    XP / level / streak state. The client performs no authoritative math.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_gamification()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid;
  _row public.user_gamification%ROWTYPE;
  _level integer;
  _tz text;
  _today date;
  _effective_streak integer;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO _row FROM public.user_gamification WHERE user_id = _uid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'total_xp', 0, 'level', 1,
      'level_start_xp', 0, 'next_level_xp', 100,
      'current_streak', 0, 'longest_streak', 0,
      'last_activity_date', NULL
    );
  END IF;

  _level := public.calculate_level(_row.total_xp);

  SELECT COALESCE(timezone, 'UTC') INTO _tz FROM public.profiles WHERE id = _uid;
  BEGIN
    _today := (now() AT TIME ZONE COALESCE(_tz, 'UTC'))::date;
  EXCEPTION WHEN OTHERS THEN
    _today := (now() AT TIME ZONE 'UTC')::date;
  END;

  -- A streak is only "current" if the last activity was today or yesterday.
  IF _row.last_activity_date IS NOT NULL AND _row.last_activity_date >= _today - 1 THEN
    _effective_streak := _row.current_streak;
  ELSE
    _effective_streak := 0;
  END IF;

  RETURN jsonb_build_object(
    'total_xp', _row.total_xp,
    'level', _level,
    'level_start_xp', 100 * (_level - 1) * (_level - 1),
    'next_level_xp', 100 * _level * _level,
    'current_streak', _effective_streak,
    'longest_streak', _row.longest_streak,
    'last_activity_date', _row.last_activity_date
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_gamification() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_gamification() TO authenticated;
