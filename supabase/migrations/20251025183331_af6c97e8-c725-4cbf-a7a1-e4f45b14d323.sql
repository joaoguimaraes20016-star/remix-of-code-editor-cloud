-- Create confirmation tasks table
CREATE TABLE public.confirmation_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL,
  appointment_id UUID NOT NULL,
  assigned_to UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  auto_return_at TIMESTAMP WITH TIME ZONE,
  claimed_manually BOOLEAN DEFAULT false
);

-- Create activity logs table
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL,
  appointment_id UUID NOT NULL,
  actor_id UUID,
  actor_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add active status to team_members for round-robin
ALTER TABLE public.team_members 
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Enable RLS
ALTER TABLE public.confirmation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for confirmation_tasks
CREATE POLICY "Team members can view tasks"
  ON public.confirmation_tasks
  FOR SELECT
  USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Team members can create tasks"
  ON public.confirmation_tasks
  FOR INSERT
  WITH CHECK (is_team_member(auth.uid(), team_id));

CREATE POLICY "Setters and admins can update tasks"
  ON public.confirmation_tasks
  FOR UPDATE
  USING (is_team_member(auth.uid(), team_id) AND (
    has_team_role(auth.uid(), team_id, 'setter') OR 
    has_team_role(auth.uid(), team_id, 'admin') OR
    has_team_role(auth.uid(), team_id, 'offer_owner')
  ));

-- RLS policies for activity_logs
CREATE POLICY "Team members can view activity logs"
  ON public.activity_logs
  FOR SELECT
  USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Team members can create activity logs"
  ON public.activity_logs
  FOR INSERT
  WITH CHECK (is_team_member(auth.uid(), team_id));

-- Create indexes for performance
CREATE INDEX idx_confirmation_tasks_team_id ON public.confirmation_tasks(team_id);
CREATE INDEX idx_confirmation_tasks_assigned_to ON public.confirmation_tasks(assigned_to);
CREATE INDEX idx_confirmation_tasks_status ON public.confirmation_tasks(status);
CREATE INDEX idx_activity_logs_team_id ON public.activity_logs(team_id);
CREATE INDEX idx_activity_logs_appointment_id ON public.activity_logs(appointment_id);