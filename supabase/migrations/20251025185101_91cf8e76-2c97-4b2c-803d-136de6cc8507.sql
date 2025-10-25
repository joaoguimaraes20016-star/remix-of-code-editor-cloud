-- Add foreign key relationship
ALTER TABLE public.mrr_follow_up_tasks
ADD CONSTRAINT fk_mrr_schedule
FOREIGN KEY (mrr_schedule_id)
REFERENCES public.mrr_schedules(id)
ON DELETE CASCADE;