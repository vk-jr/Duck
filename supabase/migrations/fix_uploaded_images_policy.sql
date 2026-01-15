-- Fix RLS policies for 'uploaded_images' bucket

-- 1. Drop existing policies for this bucket to avoid conflicts
DROP POLICY IF EXISTS "Public Access Uploaded Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Uploaded Images" ON storage.objects;
DROP POLICY IF EXISTS "Owner Maintain Uploaded Images" ON storage.objects;

-- 2. Create Policy: Allow Public Read Access
CREATE POLICY "Public Access Uploaded Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'uploaded_images' );

-- 3. Create Policy: Allow Authenticated Users to Upload (INSERT)
-- Using explicit WITH CHECK and only checking authentication and bucket
CREATE POLICY "Authenticated Upload Uploaded Images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'uploaded_images' AND auth.role() = 'authenticated' );

-- 4. Create Policy: Allow Users to Update/Delete their OWN files
-- Split from ALL to ensure INSERT isn't affected by owner check which might be race-condition prone
CREATE POLICY "Owner Update Uploaded Images"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'uploaded_images' AND auth.uid() = owner );

CREATE POLICY "Owner Delete Uploaded Images"
ON storage.objects FOR DELETE
USING ( bucket_id = 'uploaded_images' AND auth.uid() = owner );
