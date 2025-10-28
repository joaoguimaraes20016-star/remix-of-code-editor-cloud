-- Fix the auto_create_confirmation_task trigger to handle bulk inserts without auth context
CREATE OR REPLACE FUNCTION public.auto_create_confirmation_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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

  -- If appointment already has a setter assigned, assign task directly to them
  IF NEW.setter_id IS NOT NULL THEN
    INSERT INTO confirmation_tasks (
      team_id, appointment_id, assigned_to, assigned_at, auto_return_at, status, task_type
    ) VALUES (
      NEW.team_id, NEW.id, NEW.setter_id, now(), now() + interval '2 hours', 'pending', 'call_confirmation'
    );
    RETURN NEW;
  END IF;

  -- Create unassigned task for bulk imports (no setter rotation during import)
  INSERT INTO confirmation_tasks (team_id, appointment_id, status, task_type)
  VALUES (NEW.team_id, NEW.id, 'pending', 'call_confirmation');
  
  RETURN NEW;
END;
$$;