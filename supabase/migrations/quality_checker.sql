-- Create quality_checks table
CREATE TABLE IF NOT EXISTS quality_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    brand_id UUID REFERENCES brands(id), -- Assuming a brands table exists, if not this might need adjustment
    image_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies for security (assuming RLS is enabled on other tables)
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to insert their own checks
CREATE POLICY "Users can insert their own quality checks"
    ON quality_checks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to view their own checks
CREATE POLICY "Users can view their own quality checks"
    ON quality_checks FOR SELECT
    USING (auth.uid() = user_id);

-- If brands table doesn't exist, we might want to create a simple one or ensure it exists
-- Checking if brands table exists (this part is observational, but good for completeness)
-- CREATE TABLE IF NOT EXISTS brands (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     user_id UUID REFERENCES auth.users(id),
--     name TEXT NOT NULL,
--     guidelines TEXT,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
-- );
