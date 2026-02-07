-- ==============================
-- Migration: Add contact_dnd automation trigger
-- Fires when a contact's DND status changes (any channel)
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_contact_dnd()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM fire_automation_event(
    NEW.team_id,
    'contact_dnd',
    jsonb_build_object(
      'contactId', NEW.id,
      'lead', jsonb_build_object(
        'id', NEW.id,
        'name', COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''),
        'first_name', NEW.first_name,
        'last_name', NEW.last_name,
        'email', NEW.email,
        'phone', NEW.phone,
        'tags', COALESCE(NEW.tags, ARRAY[]::text[]),
        'team_id', NEW.team_id
      ),
      'meta', jsonb_build_object(
        'dnd_sms', NEW.dnd_sms,
        'dnd_email', NEW.dnd_email,
        'dnd_voice', NEW.dnd_voice,
        'previous_dnd_sms', OLD.dnd_sms,
        'previous_dnd_email', OLD.dnd_email,
        'previous_dnd_voice', OLD.dnd_voice
      )
    ),
    'contact_dnd:' || NEW.id || ':' || extract(epoch from now())::text
  );
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS on_contact_dnd_automation ON contacts;

-- Create the trigger (fires on UPDATE when any DND column changes)
CREATE TRIGGER on_contact_dnd_automation
  AFTER UPDATE ON contacts
  FOR EACH ROW
  WHEN (
    NEW.dnd_sms IS DISTINCT FROM OLD.dnd_sms OR
    NEW.dnd_email IS DISTINCT FROM OLD.dnd_email OR
    NEW.dnd_voice IS DISTINCT FROM OLD.dnd_voice
  )
  EXECUTE FUNCTION trigger_automation_on_contact_dnd();
