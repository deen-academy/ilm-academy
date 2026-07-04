-- ============================================================================
-- SECURE THE QUIZ TRUST BOUNDARY (forward-only)
--
-- Verified vulnerabilities being fixed:
--   1. quiz_questions SELECT policy is USING (true) and the table grants full
--      column SELECT, so any client (including anon) can read correct_answer
--      directly, defeating server-side grading via grade_quiz.
--   2. "Users can insert own quiz results" / "Users can update own quiz results"
--      RLS policies let learners forge authoritative quiz_results rows,
--      bypassing grade_quiz entirely.
--
-- Architecture chosen: column-level privilege revocation for the answer key
-- (zero frontend changes needed — no client code selects correct_answer;
-- teachers only INSERT/UPDATE it, which remains fully granted), plus removal
-- of learner write paths to quiz_results (grade_quiz is SECURITY DEFINER and
-- runs as the table owner, so trusted grading keeps working).
-- ============================================================================

-- 1) Hide the answer key from all API roles at the column level.
--    Row visibility (which questions exist) is unchanged; only the
--    correct_answer column becomes unreadable through the API.
REVOKE SELECT ON public.quiz_questions FROM anon, authenticated;
GRANT SELECT (id, quiz_id, question, option_a, option_b, option_c, option_d, order_number)
  ON public.quiz_questions TO anon, authenticated;

-- Teachers/admins still create and edit questions (including correct_answer)
-- through the existing "Admins/teachers can manage questions" RLS policy;
-- INSERT/UPDATE/DELETE privileges are intentionally left as-is.

-- 2) Remove learner write paths to authoritative quiz results.
DROP POLICY IF EXISTS "Users can insert own quiz results" ON public.quiz_results;
DROP POLICY IF EXISTS "Users can update own quiz results" ON public.quiz_results;

-- Defense in depth: even if a permissive write policy is ever re-added,
-- the API roles have no write privilege on the table. grade_quiz
-- (SECURITY DEFINER, owned by the table owner) is the only write path.
REVOKE INSERT, UPDATE, DELETE ON public.quiz_results FROM anon, authenticated;

-- SELECT policies ("Users can view own quiz results", admin, teacher) are
-- intentionally preserved so legitimate result retrieval keeps working.
