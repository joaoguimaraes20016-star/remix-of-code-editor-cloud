-- ==============================
-- Migration: Add booking reminder cron job + reschedule automation trigger
-- ==============================

-- ==============================
-- PART 1: pg_cron job for send-booking-reminder
-- Runs every 5 minutes, calls the Edge Function to process pending reminders
-- ==============================

-- Ensure extensions are available
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Remove existing job if it exists (idempotent)
SELECT cron.unschedule('send-booking-reminders')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-booking-reminders'
);

-- Schedule the reminder processing job every 5 minutes
SELECT cron.schedule(
  'send-booking-reminders',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://inbvluddkutyfhsxfqco.supabase.co/functions/v1/send-booking-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := '{}'::jsonb
  )
  $$
);

-- ==============================
-- PART 2: Database trigger for appointment_rescheduled automation
-- Fires when an appointment's status changes to RESCHEDULED
-- ==============================

-- Create the trigger function following the same pattern as existing automation triggers
CREATE OR REPLACE FUNCTION public.trigger_automation_on_appointment_rescheduled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only fire when status changes TO RESCHEDULED
  IF NEW.status = 'RESCHEDULED' AND (OLD.status IS DISTINCT FROM 'RESCHEDULED') THEN
    PERFORM fire_automation_event(
      NEW.team_id,
      'appointment_rescheduled',
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
          'startAt', NEW.start_at_utc,
          'eventTypeName', NEW.event_type_name,
          'status', NEW.status
        )
      ),
      'appointment_rescheduled:' || NEW.id || ':' || now()::text
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS on_appointment_status_rescheduled_automation ON appointments;

-- Create the trigger
CREATE TRIGGER on_appointment_status_rescheduled_automation
  AFTER UPDATE OF status ON appointments
  FOR EACH ROW
  WHEN (NEW.status = 'RESCHEDULED' AND OLD.status IS DISTINCT FROM 'RESCHEDULED')
  EXECUTE FUNCTION trigger_automation_on_appointment_rescheduled();
