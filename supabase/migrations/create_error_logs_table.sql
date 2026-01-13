create table if not exists public.error_logs (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  source text not null,
  error_message text not null,
  error_details jsonb null,
  user_id uuid null,
  brand_id uuid null,
  related_entity_id uuid null,
  related_entity_table text null,
  constraint error_logs_pkey primary key (id)
);

-- Enable RLS
alter table public.error_logs enable row level security;

-- Policy: Allow admins/service role to do everything. 
-- Allow users to view their own logs? Maybe not needed for now, but harmless.
-- For now, we will use service role to insert, so simple policy or no policy (if service role) is fine.
-- But standard practice:
create policy "Allow Service Role full access" on public.error_logs
  as permissive for all
  to service_role
  using (true)
  with check (true);

-- Optional: Allow users to view their own error logs
create policy "Users can view their own error logs" on public.error_logs
  as permissive for select
  to authenticated
  using ((auth.uid() = user_id));
