-- Create the storage bucket 'uploaded_images'
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploaded_images', 'uploaded_images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public viewing of uploaded_images
CREATE POLICY "Public Access Uploaded Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'uploaded_images' );

-- Policy to allow authenticated users to upload to uploaded_images
CREATE POLICY "Authenticated Upload Uploaded Images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'uploaded_images' AND auth.role() = 'authenticated' );

-- Policy to allow users to update/delete their own images in uploaded_images
CREATE POLICY "Owner Maintain Uploaded Images"
ON storage.objects FOR ALL
USING ( bucket_id = 'uploaded_images' AND auth.uid() = owner );
