-- ============================================
-- ILM Academy - Full Database Schema Export
-- Generated: 2026-03-09
-- ============================================

-- 1. ENUM TYPES
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'admin');

-- 2. TABLES

CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY,
  name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'student'::app_role,
  UNIQUE (user_id, role)
);

CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  category text,
  image_url text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.modules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  order_number integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  video_url text,
  audio_url text,
  duration text,
  type text DEFAULT 'video'::text,
  order_number integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, user_id)
);

CREATE TABLE public.lesson_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  UNIQUE (lesson_id, user_id)
);

CREATE TABLE public.quizzes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.quiz_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer text NOT NULL,
  order_number integer NOT NULL DEFAULT 0
);

CREATE TABLE public.quiz_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.live_classes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  meeting_url text,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  created_by uuid,
  reminder_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.study_resources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  file_url text,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.teacher_courses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, course_id)
);

CREATE TABLE public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. FUNCTIONS

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email);
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.grade_quiz(_quiz_id uuid, _answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
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
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT m.course_id INTO _course_id
  FROM public.quizzes q JOIN public.modules m ON m.id = q.module_id
  WHERE q.id = _quiz_id;

  IF _course_id IS NULL THEN RAISE EXCEPTION 'Quiz not found'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.enrollments WHERE user_id = _user_id AND course_id = _course_id
  ) THEN RAISE EXCEPTION 'Not enrolled in this course'; END IF;

  DELETE FROM public.quiz_results WHERE quiz_id = _quiz_id AND user_id = _user_id;

  FOR _question IN
    SELECT id, correct_answer FROM public.quiz_questions WHERE quiz_id = _quiz_id ORDER BY order_number
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

  RETURN jsonb_build_object('score', _score, 'total', _total, 'results', _results);
END;
$$;

CREATE OR REPLACE FUNCTION public.send_upcoming_live_class_reminders()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE r record; _request_id bigint;
BEGIN
  FOR r IN
    SELECT id, title, scheduled_at, course_id FROM public.live_classes
    WHERE reminder_sent = false AND scheduled_at <= now() + interval '10 minutes' AND scheduled_at > now()
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Replace the URL below with your own edge function URL
    SELECT net.http_post(
      url := '<YOUR_SUPABASE_URL>/functions/v1/send-push-notification',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer <YOUR_ANON_KEY>'),
      body := jsonb_build_object('title','Live Class Starting Soon','body','"' || r.title || '" starts at ' || to_char(r.scheduled_at at time zone 'UTC','Mon DD at HH24:MI') || ' UTC','course_id',r.course_id,'url','/courses')
    ) INTO _request_id;
    UPDATE public.live_classes SET reminder_sent = true WHERE id = r.id;
  END LOOP;
END;
$$;

-- 4. TRIGGERS

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. ENABLE RLS ON ALL TABLES

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES

-- profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- courses
CREATE POLICY "Courses viewable by everyone" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admins/teachers can create courses" ON public.courses FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));
CREATE POLICY "Admins/teachers can update courses" ON public.courses FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));

-- modules
CREATE POLICY "Modules viewable by everyone" ON public.modules FOR SELECT USING (true);
CREATE POLICY "Admins/teachers can manage modules" ON public.modules FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));

-- lessons
CREATE POLICY "Lessons viewable by everyone" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Admins/teachers can manage lessons" ON public.lessons FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));

-- enrollments
CREATE POLICY "Users can view own enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all enrollments" ON public.enrollments FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers can view enrollments for assigned courses" ON public.enrollments FOR SELECT USING (EXISTS (SELECT 1 FROM teacher_courses WHERE teacher_id = auth.uid() AND course_id = enrollments.course_id));
CREATE POLICY "Users can enroll themselves" ON public.enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unenroll themselves" ON public.enrollments FOR DELETE USING (auth.uid() = user_id);

-- lesson_progress
CREATE POLICY "Users can view own progress" ON public.lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all lesson progress" ON public.lesson_progress FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers can view lesson progress for assigned courses" ON public.lesson_progress FOR SELECT USING (EXISTS (SELECT 1 FROM lessons l JOIN modules m ON m.id = l.module_id JOIN teacher_courses tc ON tc.course_id = m.course_id WHERE l.id = lesson_progress.lesson_id AND tc.teacher_id = auth.uid()));
CREATE POLICY "Users can insert own progress" ON public.lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.lesson_progress FOR UPDATE USING (auth.uid() = user_id);

-- quizzes
CREATE POLICY "Quizzes viewable by everyone" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Admins/teachers can manage quizzes" ON public.quizzes FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));

-- quiz_questions
CREATE POLICY "Quiz questions viewable by everyone" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Admins/teachers can manage questions" ON public.quiz_questions FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));

-- quiz_results
CREATE POLICY "Users can view own quiz results" ON public.quiz_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all quiz results" ON public.quiz_results FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers can view quiz results for assigned courses" ON public.quiz_results FOR SELECT USING (EXISTS (SELECT 1 FROM quizzes q JOIN modules m ON m.id = q.module_id JOIN teacher_courses tc ON tc.course_id = m.course_id WHERE q.id = quiz_results.quiz_id AND tc.teacher_id = auth.uid()));
CREATE POLICY "Users can insert own quiz results" ON public.quiz_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quiz results" ON public.quiz_results FOR UPDATE USING (auth.uid() = user_id);

-- live_classes
CREATE POLICY "Live classes viewable by everyone" ON public.live_classes FOR SELECT USING (true);
CREATE POLICY "Admins/teachers can manage live classes" ON public.live_classes FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));

-- study_resources
CREATE POLICY "Resources viewable by everyone" ON public.study_resources FOR SELECT USING (true);
CREATE POLICY "Admins/teachers can manage resources" ON public.study_resources FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));

-- teacher_courses
CREATE POLICY "Teachers can view own assignments" ON public.teacher_courses FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can manage teacher_courses" ON public.teacher_courses FOR ALL USING (has_role(auth.uid(), 'admin'));

-- push_subscriptions
CREATE POLICY "Service role can read all subscriptions" ON public.push_subscriptions FOR SELECT USING (true);
CREATE POLICY "Users can view own subscriptions" ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own subscriptions" ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- 7. STORAGE BUCKETS (run via Supabase dashboard or API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-media', 'lesson-media', true);
