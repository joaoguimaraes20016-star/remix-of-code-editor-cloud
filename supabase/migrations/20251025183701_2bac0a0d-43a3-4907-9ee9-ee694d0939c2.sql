-- Create function to auto-create confirmation tasks
CREATE OR REPLACE FUNCTION public.auto_create_confirmation_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_setters UUID[];
  task_counts RECORD;
  assigned_setter UUID;
  min_count INTEGER;
BEGIN
  -- Get active setters for this team
  SELECT ARRAY_AGG(user_id) INTO active_setters
  FROM team_members
  WHERE team_id = NEW.team_id
    AND role = 'setter'
    AND is_active = true;

  -- If no active setters, create unassigned task
  IF active_setters IS NULL OR array_length(active_setters, 1) = 0 THEN
    INSERT INTO confirmation_tasks (team_id, appointment_id, status)
    VALUES (NEW.team_id, NEW.id, 'pending');
    
    INSERT INTO activity_logs (team_id, appointment_id, actor_name, action_type, note)
    VALUES (NEW.team_id, NEW.id, 'System', 'Created', 'Task created in queue');
    
    RETURN NEW;
  END IF;

  -- Count tasks per active setter
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
    status
  ) VALUES (
    NEW.team_id,
    NEW.id,
    assigned_setter,
    now(),
    now() + interval '2 hours',
    'pending'
  );

  -- Log activity
  INSERT INTO activity_logs (team_id, appointment_id, actor_name, action_type, note)
  VALUES (NEW.team_id, NEW.id, 'System', 'Created', 'Task auto-assigned via round-robin');

  RETURN NEW;
END;
$$;

-- Create trigger on appointments table
CREATE TRIGGER auto_create_task_on_appointment
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_confirmation_task();

-- Create function to handle auto-return of expired tasks
CREATE OR REPLACE FUNCTION public.auto_return_expired_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return expired tasks to queue
  UPDATE confirmation_tasks
  SET 
    assigned_to = NULL,
    assigned_at = NULL,
    auto_return_at = NULL
  WHERE status = 'pending'
    AND auto_return_at IS NOT NULL
    AND auto_return_at < now();

  -- Log activity for returned tasks
  INSERT INTO activity_logs (team_id, appointment_id, actor_name, action_type, note)
  SELECT 
    ct.team_id,
    ct.appointment_id,
    'System',
    'Returned to Queue',
    'Task auto-returned after 2 hours'
  FROM confirmation_tasks ct
  WHERE ct.status = 'pending'
    AND ct.auto_return_at IS NOT NULL
    AND ct.auto_return_at < now();
END;
$$;