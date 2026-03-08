-- Admins can view all enrollments
CREATE POLICY "Admins can view all enrollments"
ON public.enrollments
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Teachers can view enrollments for their assigned courses
CREATE POLICY "Teachers can view enrollments for assigned courses"
ON public.enrollments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_courses
    WHERE teacher_courses.teacher_id = auth.uid()
    AND teacher_courses.course_id = enrollments.course_id
  )
);

-- Admins can view all quiz results
CREATE POLICY "Admins can view all quiz results"
ON public.quiz_results
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Teachers can view quiz results for their assigned courses
CREATE POLICY "Teachers can view quiz results for assigned courses"
ON public.quiz_results
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes q
    JOIN public.modules m ON m.id = q.module_id
    JOIN public.teacher_courses tc ON tc.course_id = m.course_id
    WHERE q.id = quiz_results.quiz_id
    AND tc.teacher_id = auth.uid()
  )
);

-- Admins can view all lesson progress
CREATE POLICY "Admins can view all lesson progress"
ON public.lesson_progress
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Teachers can view lesson progress for their assigned courses
CREATE POLICY "Teachers can view lesson progress for assigned courses"
ON public.lesson_progress
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    JOIN public.teacher_courses tc ON tc.course_id = m.course_id
    WHERE l.id = lesson_progress.lesson_id
    AND tc.teacher_id = auth.uid()
  )
);