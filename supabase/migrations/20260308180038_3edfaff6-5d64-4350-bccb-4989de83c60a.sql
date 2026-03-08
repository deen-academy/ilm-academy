
-- teacher_courses junction table
CREATE TABLE public.teacher_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, course_id)
);
ALTER TABLE public.teacher_courses ENABLE ROW LEVEL SECURITY;

-- study_resources table
CREATE TABLE public.study_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_url text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.study_resources ENABLE ROW LEVEL SECURITY;

-- live_classes table
CREATE TABLE public.live_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  meeting_url text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;

-- Storage bucket for resources
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', true);

-- RLS: teacher_courses
CREATE POLICY "Admins can manage teacher_courses" ON public.teacher_courses FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers can view own assignments" ON public.teacher_courses FOR SELECT TO authenticated USING (auth.uid() = teacher_id);

-- RLS: study_resources
CREATE POLICY "Admins/teachers can manage resources" ON public.study_resources FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));
CREATE POLICY "Resources viewable by everyone" ON public.study_resources FOR SELECT TO authenticated USING (true);

-- RLS: live_classes
CREATE POLICY "Admins/teachers can manage live classes" ON public.live_classes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));
CREATE POLICY "Live classes viewable by everyone" ON public.live_classes FOR SELECT TO authenticated USING (true);

-- Storage RLS
CREATE POLICY "Admins/teachers can upload resources" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'resources' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher')));
CREATE POLICY "Anyone can view resources" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'resources');
CREATE POLICY "Admins/teachers can delete resources" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'resources' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher')));
