
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

  -- Delete previous result to allow retakes
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

  RETURN jsonb_build_object('score', _score, 'total', _total, 'results', _results);
END;
$$;
