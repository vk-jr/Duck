-- Add columns to store reference image and instructions in the brands table
ALTER TABLE brands 
ADD COLUMN IF NOT EXISTS reference_image_url TEXT,
ADD COLUMN IF NOT EXISTS guideline_instructions TEXT;
