create table if not exists public.segmentations (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  user_id uuid not null default auth.uid(),
  input_image_url text not null,
  segment_count int not null,
  status text not null default 'generating',
  output_images jsonb null, -- Array of image URLs
  constraint segmentations_pkey primary key (id),
  constraint segmentations_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
);

-- Enable RLS
alter table public.segmentations enable row level security;

-- Policy: Allow Service Role full access
create policy "Allow Service Role full access" on public.segmentations
  as permissive for all
  to service_role
  using (true)
  with check (true);

-- Policy: Allow users to select their own segmentations
create policy "Users can view their own segmentations" on public.segmentations
  as permissive for select
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Allow users to insert their own segmentations
create policy "Users can create their own segmentations" on public.segmentations
  as permissive for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Allow users to update their own segmentations (if needed, e.g. cancelling?)
-- Usually backend updates it, but good to have if we change status client-side (unlikely but safe)
create policy "Users can update their own segmentations" on public.segmentations
  as permissive for update
  to authenticated
  using (auth.uid() = user_id);
