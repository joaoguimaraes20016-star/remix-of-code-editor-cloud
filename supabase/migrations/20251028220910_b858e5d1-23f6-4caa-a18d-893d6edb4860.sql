-- Fix the create_task_with_assignment function - it's using wrong column name
CREATE OR REPLACE FUNCTION public.create_task_with_assignment(
  p_team_id uuid,
  p_appointment_id uuid,
  p_task_type task_type,
  p_follow_up_date date DEFAULT NULL,
  p_follow_up_reason text DEFAULT NULL,
  p_reschedule_date date DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  active_setters UUID[];
  assigned_setter UUID;
  min_count INTEGER;
  new_task_id UUID;
  existing_setter UUID;
BEGIN
  -- First check if appointment already has a setter assigned
  SELECT setter_id INTO existing_setter
  FROM appointments
  WHERE id = p_appointment_id;

  -- If appointment has an existing setter, assign task directly to them
  IF existing_setter IS NOT NULL THEN
    INSERT INTO confirmation_tasks (
      team_id,
      appointment_id,
      assigned_to,
      assigned_at,
      auto_return_at,
      status,
      task_type,
      follow_up_date,
      follow_up_reason,
      reschedule_date
    ) VALUES (
      p_team_id,
      p_appointment_id,
      existing_setter,
      now(),
      now() + interval '2 hours',
      'pending',
      p_task_type,
      p_follow_up_date,
      p_follow_up_reason,
      p_reschedule_date
    ) RETURNING id INTO new_task_id;
    
    RETURN new_task_id;
  END IF;

  -- If no existing setter, use round-robin logic
  -- Get active setters for this team
  SELECT ARRAY_AGG(user_id) INTO active_setters
  FROM team_members
  WHERE team_id = p_team_id
    AND role = 'setter'
    AND is_active = true;

  -- If no active setters, create unassigned task
  IF active_setters IS NULL OR array_length(active_setters, 1) = 0 THEN
    INSERT INTO confirmation_tasks (
      team_id,
      appointment_id,
      status,
      task_type,
      follow_up_date,
      follow_up_reason,
      reschedule_date
    ) VALUES (
      p_team_id,
      p_appointment_id,
      'pending',
      p_task_type,
      p_follow_up_date,
      p_follow_up_reason,
      p_reschedule_date
    ) RETURNING id INTO new_task_id;
    
    RETURN new_task_id;
  END IF;

  -- Find setter with fewest pending tasks (FIXED: use assigned_to instead of user_id)
  SELECT assigned_to, COUNT(*) INTO assigned_setter, min_count
  FROM confirmation_tasks
  WHERE team_id = p_team_id
    AND status = 'pending'
    AND assigned_to = ANY(active_setters)
  GROUP BY assigned_to
  ORDER BY COUNT(*) ASC
  LIMIT 1;

  -- Assign to setter with fewest tasks, or first active setter if none have tasks
  IF assigned_setter IS NULL THEN
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
    task_type,
    follow_up_date,
    follow_up_reason,
    reschedule_date
  ) VALUES (
    p_team_id,
    p_appointment_id,
    assigned_setter,
    now(),
    now() + interval '2 hours',
    'pending',
    p_task_type,
    p_follow_up_date,
    p_follow_up_reason,
    p_reschedule_date
  ) RETURNING id INTO new_task_id;

  RETURN new_task_id;
END;
$$;