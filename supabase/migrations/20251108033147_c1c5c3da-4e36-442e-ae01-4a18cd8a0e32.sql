-- Create function to auto-generate follow-up tasks for specific pipeline stages
CREATE OR REPLACE FUNCTION public.auto_create_follow_up_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  follow_up_reason_text text;
  follow_up_days integer;
BEGIN
  -- Only proceed if pipeline_stage actually changed
  IF OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage THEN
    
    -- Determine if this stage needs a follow-up task
    IF NEW.pipeline_stage = 'no_show' THEN
      follow_up_reason_text := 'No-Show - Needs Follow-Up';
      follow_up_days := 1; -- Follow up next day
    ELSIF NEW.pipeline_stage = 'canceled' THEN
      follow_up_reason_text := 'Cancelled - Check if we can reschedule';
      follow_up_days := 2; -- Follow up in 2 days
    ELSIF NEW.pipeline_stage = 'disqualified' THEN
      follow_up_reason_text := 'Disqualified - Re-engagement attempt';
      follow_up_days := 7; -- Follow up in a week
    ELSE
      -- No follow-up needed for this stage
      RETURN NEW;
    END IF;

    -- Check if a pending follow-up task already exists
    IF NOT EXISTS (
      SELECT 1 FROM confirmation_tasks
      WHERE appointment_id = NEW.id
        AND task_type = 'follow_up'
        AND status IN ('pending', 'in_progress')
    ) THEN
      -- Create the follow-up task
      PERFORM create_task_with_assignment(
        p_team_id := NEW.team_id,
        p_appointment_id := NEW.id,
        p_task_type := 'follow_up'::task_type,
        p_follow_up_date := (CURRENT_DATE + (follow_up_days || ' days')::interval)::date,
        p_follow_up_reason := follow_up_reason_text
      );

      -- Log the activity
      INSERT INTO activity_logs (
        team_id,
        appointment_id,
        actor_name,
        action_type,
        note
      ) VALUES (
        NEW.team_id,
        NEW.id,
        'System',
        'Follow-Up Task Created',
        'Auto-created follow-up task: ' || follow_up_reason_text
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger for auto-creating follow-up tasks
DROP TRIGGER IF EXISTS auto_create_follow_up_tasks_trigger ON appointments;
CREATE TRIGGER auto_create_follow_up_tasks_trigger
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_follow_up_tasks();