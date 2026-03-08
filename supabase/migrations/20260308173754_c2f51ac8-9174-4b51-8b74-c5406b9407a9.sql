
-- Create a server-side function to grade quizzes
CREATE OR REPLACE FUNCTION public.grade_quiz(
  _quiz_id uuid,
  _answers jsonb
)
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
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

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
      _results := _results || jsonb_build_object('question_id', _question.id, 'correct', true, 'correct_answer', _question.correct_answer);
    ELSE
      _results := _results || jsonb_build_object('question_id', _question.id, 'correct', false, 'correct_answer', _question.correct_answer);
    END IF;
  END LOOP;

  -- Insert the result
  INSERT INTO public.quiz_results (quiz_id, user_id, score, total_questions)
  VALUES (_quiz_id, _user_id, _score, _total);

  RETURN jsonb_build_object('score', _score, 'total', _total, 'results', _results);
END;
$$;
