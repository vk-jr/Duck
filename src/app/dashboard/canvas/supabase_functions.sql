-- ==============================================================================
-- 1. ADD COLUMN MIGRATION
-- Run this command first to add the 'status' column to your table.
-- ==============================================================================

ALTER TABLE image_layers 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'generating';

-- ==============================================================================
-- 2. BACKEND UPDATE QUERY
-- Use this SQL query in your backend or N8N workflow to update the layer 
-- when the image generation is complete.
-- ==============================================================================

-- Arguments:
--   :layer_id      -> The UUID of the layer (provided by the frontend alert/log)
--   :new_image_url -> The URL of the generated image

/*
UPDATE image_layers
SET 
    layer_url = 'https://example.com/new-image.png',
    status = 'generated'
WHERE id = 'YOUR_LAYER_ID_HERE';
*/

-- ==============================================================================
-- 3. FETCH QUERY (OPTIONAL)
-- To see the status of layers for a generic image
-- ==============================================================================

-- SELECT * FROM image_layers WHERE generated_image_id = 'SOME_IMAGE_ID';
