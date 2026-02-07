-- ==============================
-- Migration: Add note_added automation trigger
-- Fires when a new note is inserted into activity_logs
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_note_added()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM fire_automation_event(
    NEW.team_id,
    'note_added',
    jsonb_build_object(
      'activityLogId', NEW.id,
      'appointmentId', NEW.appointment_id,
      'note', NEW.note,
      'actionType', NEW.action_type,
      'actorName', NEW.actor_name,
      'lead', jsonb_build_object(
        'id', (SELECT contact_id FROM appointments WHERE id = NEW.appointment_id LIMIT 1)
      )
    ),
    'note_added:' || NEW.id || ':' || extract(epoch from now())::text
  );
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS on_note_added_automation ON activity_logs;

-- Create the trigger (fires on INSERT when note is not null)
CREATE TRIGGER on_note_added_automation
  AFTER INSERT ON activity_logs
  FOR EACH ROW
  WHEN (NEW.note IS NOT NULL AND NEW.note <> '')
  EXECUTE FUNCTION trigger_automation_on_note_added();
