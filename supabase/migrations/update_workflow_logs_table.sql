-- Add execution_status column to workflow_logs if it doesn't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'workflow_logs' and column_name = 'execution_status') then
        alter table public.workflow_logs
        add column execution_status text default 'PENDING';
    end if;
end $$;
