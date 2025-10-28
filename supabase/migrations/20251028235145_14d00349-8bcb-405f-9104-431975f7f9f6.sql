
-- Function to auto-assign all unassigned pending tasks
CREATE OR REPLACE FUNCTION auto_assign_unassigned_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_record RECORD;
  active_setter_id uuid;
  min_task_count integer;
BEGIN
  -- Loop through all unassigned pending tasks
  FOR task_record IN
    SELECT ct.id, ct.team_id, ct.appointment_id
    FROM confirmation_tasks ct
    WHERE ct.assigned_to IS NULL
      AND ct.status = 'pending'
    ORDER BY ct.created_at ASC
  LOOP
    -- Find the setter with the fewest pending tasks for this team
    SELECT tm.user_id INTO active_setter_id
    FROM team_members tm
    WHERE tm.team_id = task_record.team_id
      AND tm.role = 'setter'
      AND tm.is_active = true
    ORDER BY (
      SELECT COUNT(*)
      FROM confirmation_tasks ct2
      WHERE ct2.team_id = task_record.team_id
        AND ct2.assigned_to = tm.user_id
        AND ct2.status = 'pending'
    ) ASC
    LIMIT 1;

    -- If we found a setter, assign the task
    IF active_setter_id IS NOT NULL THEN
      UPDATE confirmation_tasks
      SET 
        assigned_to = active_setter_id,
        assigned_at = now(),
        auto_return_at = now() + interval '2 hours'
      WHERE id = task_record.id;

      -- Log the assignment
      INSERT INTO activity_logs (
        team_id,
        appointment_id,
        actor_name,
        action_type,
        note
      ) VALUES (
        task_record.team_id,
        task_record.appointment_id,
        'System',
        'Assigned',
        'Task auto-assigned via round-robin'
      );
    END IF;
  END LOOP;
END;
$$;

-- Run the function immediately to assign existing unassigned tasks
SELECT auto_assign_unassigned_tasks();
