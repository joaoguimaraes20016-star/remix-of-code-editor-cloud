-- Add notification tracking to appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS original_closer_notified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create closer reassignment history table
CREATE TABLE IF NOT EXISTS public.closer_reassignment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  original_closer_id UUID,
  original_closer_name TEXT NOT NULL,
  new_closer_id UUID,
  new_closer_name TEXT NOT NULL,
  reason TEXT,
  reassigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.closer_reassignment_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Team members can view reassignment history"
ON public.closer_reassignment_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = closer_reassignment_history.team_id
    AND team_members.user_id = auth.uid()
  )
);

CREATE POLICY "Team admins can insert reassignment history"
ON public.closer_reassignment_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = closer_reassignment_history.team_id
    AND team_members.user_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_closer_reassignment_history_appointment_id 
ON public.closer_reassignment_history(appointment_id);

CREATE INDEX IF NOT EXISTS idx_closer_reassignment_history_team_id 
ON public.closer_reassignment_history(team_id);