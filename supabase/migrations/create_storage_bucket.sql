-- Create the storage bucket 'images'
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public viewing of images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'images' );

-- Policy to allow authenticated users to upload images
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'images' AND auth.role() = 'authenticated' );

-- Policy to allow users to update/delete their own images (Optional but good practice)
CREATE POLICY "Owner Maintain"
ON storage.objects FOR ALL
USING ( bucket_id = 'images' AND auth.uid() = owner );
