-- Add processing_code and error_message columns to quality_checks
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'quality_checks' and column_name = 'processing_code') then
        alter table public.quality_checks
        add column processing_code int,
        add column error_message text;
    end if;
end $$;

-- Add to generated_images if it exists
do $$
begin
    if exists (select 1 from information_schema.tables where table_name = 'generated_images') then
        if not exists (select 1 from information_schema.columns where table_name = 'generated_images' and column_name = 'processing_code') then
            alter table public.generated_images
            add column processing_code int,
            add column error_message text;
        end if;
    end if;
end $$;

-- Add to image_layers if it exists
do $$
begin
    if exists (select 1 from information_schema.tables where table_name = 'image_layers') then
        if not exists (select 1 from information_schema.columns where table_name = 'image_layers' and column_name = 'processing_code') then
            alter table public.image_layers
            add column processing_code int,
            add column error_message text;
        end if;
    end if;
end $$;
