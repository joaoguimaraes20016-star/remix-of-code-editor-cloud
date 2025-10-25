-- Create table to track which setters are in round robin rotation
CREATE TABLE IF NOT EXISTS public.setter_rotation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  setter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_in_rotation BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, setter_id)
);

-- Enable RLS
ALTER TABLE public.setter_rotation_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins and offer owners can manage rotation settings"
ON public.setter_rotation_settings
FOR ALL
USING (
  is_team_member(auth.uid(), team_id) AND 
  (has_team_role(auth.uid(), team_id, 'admin') OR has_team_role(auth.uid(), team_id, 'offer_owner'))
);

CREATE POLICY "Team members can view rotation settings"
ON public.setter_rotation_settings
FOR SELECT
USING (is_team_member(auth.uid(), team_id));

-- Update auto_create_confirmation_task to use rotation settings
CREATE OR REPLACE FUNCTION public.auto_create_confirmation_task()
RETURNS TRIGGER AS $$
DECLARE
  active_setters UUID[];
  task_counts RECORD;
  assigned_setter UUID;
  min_count INTEGER;
BEGIN
  -- Only create call confirmation tasks for NEW appointments
  IF NEW.status != 'NEW' THEN
    RETURN NEW;
  END IF;

  -- Get active setters that are in rotation
  SELECT ARRAY_AGG(tm.user_id) INTO active_setters
  FROM team_members tm
  WHERE tm.team_id = NEW.team_id
    AND tm.role = 'setter'
    AND tm.is_active = true
    AND (
      -- Include if not in settings table (default to in rotation)
      NOT EXISTS (
        SELECT 1 FROM setter_rotation_settings srs 
        WHERE srs.team_id = NEW.team_id 
        AND srs.setter_id = tm.user_id
      )
      OR
      -- Include if explicitly set to in rotation
      EXISTS (
        SELECT 1 FROM setter_rotation_settings srs 
        WHERE srs.team_id = NEW.team_id 
        AND srs.setter_id = tm.user_id 
        AND srs.is_in_rotation = true
      )
    );

  -- If no active setters in rotation, create unassigned task
  IF active_setters IS NULL OR array_length(active_setters, 1) = 0 THEN
    INSERT INTO confirmation_tasks (team_id, appointment_id, status, task_type)
    VALUES (NEW.team_id, NEW.id, 'pending', 'call_confirmation');
    
    INSERT INTO activity_logs (team_id, appointment_id, actor_name, action_type, note)
    VALUES (NEW.team_id, NEW.id, 'System', 'Created', 'Call confirmation task created in queue');
    
    RETURN NEW;
  END IF;

  -- Count tasks per active setter in rotation
  SELECT user_id, COUNT(*) as count INTO task_counts
  FROM confirmation_tasks
  WHERE team_id = NEW.team_id
    AND status = 'pending'
    AND assigned_to = ANY(active_setters)
  GROUP BY user_id
  ORDER BY count ASC
  LIMIT 1;

  -- Assign to setter with fewest tasks, or first active setter if none have tasks
  IF FOUND THEN
    assigned_setter := task_counts.user_id;
  ELSE
    assigned_setter := active_setters[1];
  END IF;

  -- Create the task
  INSERT INTO confirmation_tasks (
    team_id,
    appointment_id,
    assigned_to,
    assigned_at,
    auto_return_at,
    status,
    task_type
  ) VALUES (
    NEW.team_id,
    NEW.id,
    assigned_setter,
    now(),
    now() + interval '2 hours',
    'pending',
    'call_confirmation'
  );

  -- Log activity
  INSERT INTO activity_logs (team_id, appointment_id, actor_name, action_type, note)
  VALUES (NEW.team_id, NEW.id, 'System', 'Created', 'Call confirmation task auto-assigned via round-robin');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;