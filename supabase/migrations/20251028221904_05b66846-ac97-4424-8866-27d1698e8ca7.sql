-- Assign existing unassigned tasks via round-robin
DO $$
DECLARE
  unassigned_task RECORD;
  active_setters UUID[];
  assigned_setter UUID;
  min_count INTEGER;
BEGIN
  -- Get unassigned tasks ordered by creation time
  FOR unassigned_task IN 
    SELECT ct.team_id, ct.id as task_id, ct.created_at
    FROM confirmation_tasks ct
    WHERE ct.assigned_to IS NULL 
      AND ct.status = 'pending'
    ORDER BY ct.created_at ASC
  LOOP
    -- Get active setters in rotation for this team
    SELECT ARRAY_AGG(tm.user_id) INTO active_setters
    FROM team_members tm
    LEFT JOIN setter_rotation_settings srs ON srs.setter_id = tm.user_id AND srs.team_id = tm.team_id
    WHERE tm.team_id = unassigned_task.team_id
      AND tm.role = 'setter'
      AND tm.is_active = true
      AND (srs.is_in_rotation IS NULL OR srs.is_in_rotation = true);

    -- Skip if no active setters
    IF active_setters IS NULL OR array_length(active_setters, 1) = 0 THEN
      CONTINUE;
    END IF;

    -- Find setter with fewest pending tasks
    SELECT assigned_to, COUNT(*) INTO assigned_setter, min_count
    FROM confirmation_tasks
    WHERE team_id = unassigned_task.team_id
      AND status = 'pending'
      AND assigned_to = ANY(active_setters)
    GROUP BY assigned_to
    ORDER BY COUNT(*) ASC
    LIMIT 1;

    -- Assign to setter with fewest tasks, or first active setter if none have tasks
    IF assigned_setter IS NULL THEN
      assigned_setter := active_setters[1];
    END IF;

    -- Update the task with assignment
    UPDATE confirmation_tasks
    SET 
      assigned_to = assigned_setter,
      assigned_at = now(),
      auto_return_at = now() + interval '2 hours'
    WHERE id = unassigned_task.task_id;

    -- Log activity
    INSERT INTO activity_logs (team_id, appointment_id, actor_name, action_type, note)
    SELECT 
      team_id,
      appointment_id,
      'System',
      'Auto-assigned',
      'Task assigned via round-robin'
    FROM confirmation_tasks
    WHERE id = unassigned_task.task_id;
  END LOOP;
END $$;