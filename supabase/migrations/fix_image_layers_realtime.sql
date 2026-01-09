-- ==============================================================================
-- FIX IMAGE LAYERS REALTIME & RLS
-- ==============================================================================

-- 1. Enable Row Level Security (Good security practice)
ALTER TABLE image_layers ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy: Allow Users to View Their Own Layers
-- This allows the realtime subscription to receive events for these rows.
DROP POLICY IF EXISTS "Users can view own image layers" ON image_layers;
CREATE POLICY "Users can view own image layers"
ON image_layers FOR SELECT
USING (auth.uid() = user_id);

-- 3. Create Policy: Allow Users to Insert Their Own Layers
DROP POLICY IF EXISTS "Users can insert own image layers" ON image_layers;
CREATE POLICY "Users can insert own image layers"
ON image_layers FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Enable Realtime for this table
-- This ensures that changes are broadcast to connected clients.
alter publication supabase_realtime add table image_layers;

-- 5. (Optional) Backfill user_id if missing (Self-healing)
-- If you have rows with NULL user_id created during testing, they won't be visible.
-- This command is a "best effort" to assign them to the current user if run in SQL Editor (careful).
-- UPDATE image_layers SET user_id = auth.uid() WHERE user_id IS NULL;
