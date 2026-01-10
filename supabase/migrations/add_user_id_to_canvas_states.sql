-- Add user_id column to canvas_states table
ALTER TABLE canvas_states 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies to allow users to see their own states
ALTER TABLE canvas_states ENABLE ROW LEVEL SECURITY;

-- Policy for Select
CREATE POLICY "Users can view their own canvas states"
ON canvas_states FOR SELECT
USING (auth.uid() = user_id);

-- Policy for Insert (already handled by service role in actions, but good to have)
CREATE POLICY "Users can insert their own canvas states"
ON canvas_states FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy for Delete
CREATE POLICY "Users can delete their own canvas states"
ON canvas_states FOR DELETE
USING (auth.uid() = user_id);
