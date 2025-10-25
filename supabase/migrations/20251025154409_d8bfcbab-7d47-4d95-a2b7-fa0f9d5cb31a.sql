-- Add pipeline_stage field to appointments table for deal tracking
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS pipeline_stage text;

COMMENT ON COLUMN public.appointments.pipeline_stage IS 'Pipeline stage for deal tracking: new, contacted, qualified, proposal, negotiation, won, lost';