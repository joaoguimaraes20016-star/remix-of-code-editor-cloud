-- ==============================
-- Migration: Add Missing Automation Triggers
-- Adds database triggers for:
--   1. lead_created (contact INSERT)
--   2. appointment_completed (status change to COMPLETED)
--   3. contact_changed (field updates excluding tags)
-- ==============================

-- ==============================
-- 1. Contact Created Trigger (lead_created)
-- Fires when a new contact is inserted
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_contact_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM fire_automation_event(
    NEW.team_id,
    'lead_created',
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
        'source', NEW.source,
        'team_id', NEW.team_id
      )
    ),
    'contact_' || NEW.id::text || '_created'
  );
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS on_contact_insert_automation ON contacts;

-- Create the trigger
CREATE TRIGGER on_contact_insert_automation
  AFTER INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_automation_on_contact_insert();


-- ==============================
-- 2. Appointment Completed Trigger
-- Fires when appointment status changes to COMPLETED
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_appointment_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Condition already checked by WHEN clause, no need to check again
  PERFORM fire_automation_event(
    NEW.team_id,
    'appointment_completed',
    jsonb_build_object(
      'appointmentId', NEW.id,
      'previousStatus', OLD.status,
      'lead', jsonb_build_object(
        'name', NEW.lead_name,
        'email', NEW.lead_email,
        'phone', NEW.lead_phone
      ),
      'appointment', jsonb_build_object(
        'id', NEW.id,
        'status', NEW.status,
        'start_at_utc', NEW.start_at_utc,
        'duration_minutes', NEW.duration_minutes,
        'notes', NEW.appointment_notes,
        'meeting_link', NEW.meeting_link
      )
    ),
    'appointment_' || NEW.id::text || '_completed'
  );
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS on_appointment_status_completed_automation ON appointments;

-- Create the trigger
CREATE TRIGGER on_appointment_status_completed_automation
  AFTER UPDATE OF status ON appointments
  FOR EACH ROW
  WHEN (NEW.status = 'COMPLETED' AND OLD.status IS DISTINCT FROM 'COMPLETED')
  EXECUTE FUNCTION trigger_automation_on_appointment_completed();


-- ==============================
-- 3. Contact Changed Trigger (field updates)
-- Fires when contact fields change (excluding tags, which have their own trigger)
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_contact_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Conditions already checked by WHEN clause, no need to check again
  PERFORM fire_automation_event(
    NEW.team_id,
    'contact_changed',
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
        'source', NEW.source,
        'team_id', NEW.team_id
      ),
      'changedFields', jsonb_build_object(
        'first_name_changed', NEW.first_name IS DISTINCT FROM OLD.first_name,
        'last_name_changed', NEW.last_name IS DISTINCT FROM OLD.last_name,
        'email_changed', NEW.email IS DISTINCT FROM OLD.email,
        'phone_changed', NEW.phone IS DISTINCT FROM OLD.phone,
        'source_changed', NEW.source IS DISTINCT FROM OLD.source,
        'custom_fields_changed', NEW.custom_fields IS DISTINCT FROM OLD.custom_fields
      ),
      'previousValues', jsonb_build_object(
        'first_name', OLD.first_name,
        'last_name', OLD.last_name,
        'email', OLD.email,
        'phone', OLD.phone,
        'source', OLD.source
      )
    ),
    'contact_' || NEW.id::text || '_changed_' || extract(epoch from now())::text
  );
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS on_contact_changed_automation ON contacts;

-- Create the trigger (fires on UPDATE, excluding tag-only changes)
CREATE TRIGGER on_contact_changed_automation
  AFTER UPDATE ON contacts
  FOR EACH ROW
  WHEN (
    NEW.first_name IS DISTINCT FROM OLD.first_name OR
    NEW.last_name IS DISTINCT FROM OLD.last_name OR
    NEW.email IS DISTINCT FROM OLD.email OR
    NEW.phone IS DISTINCT FROM OLD.phone OR
    NEW.source IS DISTINCT FROM OLD.source OR
    NEW.custom_fields IS DISTINCT FROM OLD.custom_fields
  )
  EXECUTE FUNCTION trigger_automation_on_contact_changed();
