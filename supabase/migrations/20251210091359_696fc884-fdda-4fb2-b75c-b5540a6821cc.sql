-- Add last_step_index to track where users dropped off
ALTER TABLE public.funnel_leads ADD COLUMN IF NOT EXISTS last_step_index integer DEFAULT 0;