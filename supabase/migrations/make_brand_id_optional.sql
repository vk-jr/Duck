-- Make brand_id optional in image_layers table
ALTER TABLE image_layers ALTER COLUMN brand_id DROP NOT NULL;

-- If necessary, also make it optional in workflow_logs if that is causing issues
ALTER TABLE workflow_logs ALTER COLUMN brand_id DROP NOT NULL;
