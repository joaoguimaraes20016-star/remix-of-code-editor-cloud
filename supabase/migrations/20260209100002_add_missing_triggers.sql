-- ==============================
-- Migration: Add Missing Automation Triggers
-- Adds database triggers for:
--   1. note_changed (activity_logs UPDATE)
--   2. task_completed (confirmation_tasks status change to 'completed')
--   3. call_status (appointments status change for call logs)
-- ==============================

-- ==============================
-- 1. Note Changed Trigger
-- Fires when a note in activity_logs is updated
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_note_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only fire when note content actually changes
  IF NEW.note IS DISTINCT FROM OLD.note THEN
    PERFORM fire_automation_event(
      NEW.team_id,
      'note_changed',
      jsonb_build_object(
        'activityLogId', NEW.id,
        'appointmentId', NEW.appointment_id,
        'previousNote', OLD.note,
        'newNote', NEW.note,
        'actionType', NEW.action_type,
        'actorName', NEW.actor_name,
        'lead', jsonb_build_object(
          'id', (SELECT contact_id FROM appointments WHERE id = NEW.appointment_id LIMIT 1)
        )
      ),
      'note_changed:' || NEW.id || ':' || extract(epoch from now())::text
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS on_note_changed_automation ON activity_logs;

-- Create the trigger
CREATE TRIGGER on_note_changed_automation
  AFTER UPDATE OF note ON activity_logs
  FOR EACH ROW
  WHEN (NEW.note IS DISTINCT FROM OLD.note)
  EXECUTE FUNCTION trigger_automation_on_note_changed();


-- ==============================
-- 2. Task Completed Trigger
-- Fires when confirmation_tasks status changes to 'completed'
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_task_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Condition already checked by WHEN clause
  PERFORM fire_automation_event(
    NEW.team_id,
    'task_completed',
    jsonb_build_object(
      'taskId', NEW.id,
      'appointmentId', NEW.appointment_id,
      'previousStatus', OLD.status,
      'taskType', NEW.task_type,
      'assignedTo', NEW.assigned_to,
      'completedAt', NEW.completed_at,
      'lead', jsonb_build_object(
        'id', (SELECT contact_id FROM appointments WHERE id = NEW.appointment_id LIMIT 1)
      )
    ),
    'task_completed:' || NEW.id
  );
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS on_task_completed_automation ON confirmation_tasks;

-- Create the trigger
CREATE TRIGGER on_task_completed_automation
  AFTER UPDATE OF status ON confirmation_tasks
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
  EXECUTE FUNCTION trigger_automation_on_task_completed();


-- ==============================
-- 3. Call Status Trigger
-- Fires when appointment status changes (for call logs)
-- Note: This is a more general trigger that fires for all appointment status changes
-- but can be filtered by checking if it's a call log (e.g., appointment_notes contains '[Call Log]')
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_call_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only fire for call logs (appointments with call-related notes or specific call statuses)
  -- Check if this is a call log by looking at appointment_notes or status patterns
  IF (
    NEW.appointment_notes LIKE '%[Call Log]%' OR
    NEW.appointment_notes LIKE '%Call Log%' OR
    NEW.status IN ('COMPLETED', 'NO_SHOW', 'CANCELLED') AND NEW.duration_minutes IS NOT NULL
  ) THEN
    -- Extract call outcome from notes if available
    DECLARE
      call_outcome TEXT := NULL;
      call_direction TEXT := NULL;
    BEGIN
      -- Try to parse call outcome from notes
      IF NEW.appointment_notes LIKE '%Outcome:%' THEN
        call_outcome := substring(NEW.appointment_notes FROM 'Outcome: ([^|]+)');
      END IF;
      
      IF NEW.appointment_notes LIKE '%Direction:%' THEN
        call_direction := substring(NEW.appointment_notes FROM 'Direction: ([^|]+)');
      END IF;
      
      PERFORM fire_automation_event(
        NEW.team_id,
        'call_status',
        jsonb_build_object(
          'appointmentId', NEW.id,
          'callStatus', NEW.status,
          'previousStatus', OLD.status,
          'callOutcome', COALESCE(call_outcome, 'unknown'),
          'callDirection', COALESCE(call_direction, 'unknown'),
          'durationMinutes', NEW.duration_minutes,
          'lead', jsonb_build_object(
            'name', NEW.lead_name,
            'email', NEW.lead_email,
            'phone', NEW.lead_phone
          ),
          'appointment', jsonb_build_object(
            'id', NEW.id,
            'status', NEW.status,
            'startAt', NEW.start_at_utc,
            'notes', NEW.appointment_notes
          )
        ),
        'call_status:' || NEW.id || ':' || NEW.status
      );
    END;
  END IF;
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS on_call_status_automation ON appointments;

-- Create the trigger - fires on status changes for call logs
CREATE TRIGGER on_call_status_automation
  AFTER UPDATE OF status ON appointments
  FOR EACH ROW
  WHEN (
    NEW.status IS DISTINCT FROM OLD.status AND
    (
      NEW.appointment_notes LIKE '%[Call Log]%' OR
      NEW.appointment_notes LIKE '%Call Log%' OR
      (NEW.duration_minutes IS NOT NULL AND NEW.duration_minutes > 0)
    )
  )
  EXECUTE FUNCTION trigger_automation_on_call_status();
