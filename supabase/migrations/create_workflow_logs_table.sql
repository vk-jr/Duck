create table if not exists public.workflow_logs (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  workflow_name text not null,
  status_code int not null,
  status_category text not null, -- 'SUCCESS', 'API_ERROR', 'DB_ERROR', 'CLIENT_ERROR'
  message text null,
  details jsonb null,
  user_id uuid null,
  brand_id uuid null,
  metadata jsonb null,
  constraint workflow_logs_pkey primary key (id)
);

-- Enable RLS
alter table public.workflow_logs enable row level security;

-- Policy: Allow Service Role full access
create policy "Allow Service Role full access" on public.workflow_logs
  as permissive for all
  to service_role
  using (true)
  with check (true);

-- Policy: Allow users to view their own logs
create policy "Users can view their own logs" on public.workflow_logs
  as permissive for select
  to authenticated
  using (auth.uid() = user_id);
