-- Create a storage bucket for lesson media (videos and audio)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lesson-media', 'lesson-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users with teacher/admin role to upload lesson media
CREATE POLICY "Teachers and admins can upload lesson media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lesson-media' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
);

-- Allow authenticated users with teacher/admin role to update lesson media
CREATE POLICY "Teachers and admins can update lesson media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'lesson-media' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
);

-- Allow authenticated users with teacher/admin role to delete lesson media
CREATE POLICY "Teachers and admins can delete lesson media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'lesson-media' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
);

-- Allow public to read lesson media
CREATE POLICY "Public can read lesson media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lesson-media');