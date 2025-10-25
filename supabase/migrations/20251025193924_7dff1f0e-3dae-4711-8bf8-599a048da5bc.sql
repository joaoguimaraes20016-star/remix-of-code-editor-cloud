-- Enable REPLICA IDENTITY FULL for all key tables to ensure realtime captures full row data
-- This ensures UPDATE events include the full row data, not just the changed columns
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER TABLE public.confirmation_tasks REPLICA IDENTITY FULL;
ALTER TABLE public.sales REPLICA IDENTITY FULL;
ALTER TABLE public.team_members REPLICA IDENTITY FULL;
ALTER TABLE public.activity_logs REPLICA IDENTITY FULL;
ALTER TABLE public.mrr_schedules REPLICA IDENTITY FULL;
ALTER TABLE public.mrr_follow_up_tasks REPLICA IDENTITY FULL;
ALTER TABLE public.team_pipeline_stages REPLICA IDENTITY FULL;