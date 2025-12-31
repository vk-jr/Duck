-- FIX: Reset Storage Policies for 'images' bucket

-- 1. Enable RLS on objects (standard Supabase setup)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts (clean slate)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Owner Maintain" ON storage.objects;
DROP POLICY IF EXISTS "Give me access" ON storage.objects; -- Just in case

-- 3. Create Policy: Allow Public Read Access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'images' );

-- 4. Create Policy: Allow Authenticated Users to Upload (INSERT)
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'images' AND auth.role() = 'authenticated' );

-- 5. Create Policy: Allow Users to Update/Delete their OWN files
CREATE POLICY "Owner Maintain"
ON storage.objects FOR ALL
USING ( bucket_id = 'images' AND auth.uid() = owner );
