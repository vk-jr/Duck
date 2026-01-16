-- Make brand_id optional in generated_images to support uploads without brands
ALTER TABLE generated_images ALTER COLUMN brand_id DROP NOT NULL;

-- Re-applying for image_layers to ensure consistency (in case it wasn't run)
ALTER TABLE image_layers ALTER COLUMN brand_id DROP NOT NULL;

-- Optional: Drop the foreign key constraint if strict referential integrity is causing issues, 
-- though simply making it nullable should be enough if we pass NULL.
-- ALTER TABLE generated_images DROP CONSTRAINT IF EXISTS generated_images_brand_id_fkey;
