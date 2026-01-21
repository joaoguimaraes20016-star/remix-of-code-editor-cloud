-- ==============================
-- PHASE 1: Enable pg_net extension
-- ==============================
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ==============================
-- PHASE 2: Update fire_automation_event to use pg_net
-- ==============================
CREATE OR REPLACE FUNCTION public.fire_automation_event(
  p_team_id uuid, 
  p_trigger_type text, 
  p_event_payload jsonb, 
  p_event_id text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_supabase_url TEXT;
  v_service_key TEXT;
  v_request_id BIGINT;
  v_body JSONB;
BEGIN
  -- Get Supabase URL and service key from environment
  v_supabase_url := current_setting('supabase.url', true);
  v_service_key := current_setting('supabase.service_role_key', true);
  
  -- If settings not available, use hardcoded project URL (fallback)
  IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
    v_supabase_url := 'https://inbvluddkutyfhsxfqco.supabase.co';
  END IF;
  
  -- Build the request body
  v_body := jsonb_build_object(
    'triggerType', p_trigger_type,
    'teamId', p_team_id,
    'eventPayload', p_event_payload,
    'eventId', COALESCE(p_event_id, p_trigger_type || ':' || gen_random_uuid()::text)
  );
  
  -- Use pg_net to make async HTTP POST to automation-trigger
  SELECT net.http_post(
    url := v_supabase_url || '/functions/v1/automation-trigger',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(v_service_key, '')
    ),
    body := v_body
  ) INTO v_request_id;
  
  RETURN jsonb_build_object(
    'queued', true, 
    'trigger_type', p_trigger_type,
    'request_id', v_request_id
  );
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block the triggering operation
  RAISE WARNING 'fire_automation_event failed: %', SQLERRM;
  RETURN jsonb_build_object('queued', false, 'error', SQLERRM);
END;
$function$;

-- ==============================
-- PHASE 3: Create trigger functions for appointments
-- ==============================

-- Trigger function: On appointment INSERT (appointment_booked)
CREATE OR REPLACE FUNCTION public.trigger_automation_on_appointment_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM fire_automation_event(
    NEW.team_id,
    'appointment_booked',
    jsonb_build_object(
      'appointmentId', NEW.id,
      'lead', jsonb_build_object(
        'name', NEW.lead_name,
        'email', NEW.lead_email,
        'phone', NEW.lead_phone
      ),
      'appointment', jsonb_build_object(
        'id', NEW.id,
        'startAt', NEW.start_at_utc,
        'eventTypeName', NEW.event_type_name,
        'status', NEW.status,
        'closerId', NEW.closer_id,
        'closerName', NEW.closer_name,
        'setterId', NEW.setter_id,
        'setterName', NEW.setter_name
      )
    ),
    'appointment_booked:' || NEW.id
  );
  RETURN NEW;
END;
$function$;

-- Trigger function: On appointment status change to CANCELLED
CREATE OR REPLACE FUNCTION public.trigger_automation_on_appointment_canceled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only fire when status changes TO CANCELLED
  IF NEW.status = 'CANCELLED' AND (OLD.status IS DISTINCT FROM 'CANCELLED') THEN
    PERFORM fire_automation_event(
      NEW.team_id,
      'appointment_canceled',
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
      'appointment_canceled:' || NEW.id || ':' || now()::text
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Trigger function: On appointment status change to NO_SHOW
CREATE OR REPLACE FUNCTION public.trigger_automation_on_appointment_no_show()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only fire when status changes TO NO_SHOW
  IF NEW.status = 'NO_SHOW' AND (OLD.status IS DISTINCT FROM 'NO_SHOW') THEN
    PERFORM fire_automation_event(
      NEW.team_id,
      'appointment_no_show',
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
      'appointment_no_show:' || NEW.id || ':' || now()::text
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Trigger function: On pipeline_stage change
CREATE OR REPLACE FUNCTION public.trigger_automation_on_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only fire when pipeline_stage actually changes
  IF NEW.pipeline_stage IS DISTINCT FROM OLD.pipeline_stage THEN
    PERFORM fire_automation_event(
      NEW.team_id,
      'stage_changed',
      jsonb_build_object(
        'appointmentId', NEW.id,
        'previousStage', OLD.pipeline_stage,
        'newStage', NEW.pipeline_stage,
        'lead', jsonb_build_object(
          'name', NEW.lead_name,
          'email', NEW.lead_email,
          'phone', NEW.lead_phone
        ),
        'appointment', jsonb_build_object(
          'id', NEW.id,
          'startAt', NEW.start_at_utc,
          'status', NEW.status,
          'pipelineStage', NEW.pipeline_stage
        )
      ),
      'stage_changed:' || NEW.id || ':' || NEW.pipeline_stage
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Trigger function: On contact tag update
CREATE OR REPLACE FUNCTION public.trigger_automation_on_contact_tag_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_added_tags TEXT[];
  v_removed_tags TEXT[];
BEGIN
  -- Calculate added and removed tags
  v_added_tags := ARRAY(SELECT unnest(COALESCE(NEW.tags, '{}')) EXCEPT SELECT unnest(COALESCE(OLD.tags, '{}')));
  v_removed_tags := ARRAY(SELECT unnest(COALESCE(OLD.tags, '{}')) EXCEPT SELECT unnest(COALESCE(NEW.tags, '{}')));
  
  -- Fire tag_added event for each new tag
  IF array_length(v_added_tags, 1) > 0 THEN
    PERFORM fire_automation_event(
      NEW.team_id,
      'tag_added',
      jsonb_build_object(
        'contactId', NEW.id,
        'addedTags', to_jsonb(v_added_tags),
        'allTags', to_jsonb(NEW.tags),
        'lead', jsonb_build_object(
          'id', NEW.id,
          'name', NEW.name,
          'email', NEW.email,
          'phone', NEW.phone,
          'tags', to_jsonb(NEW.tags)
        )
      ),
      'tag_added:' || NEW.id || ':' || array_to_string(v_added_tags, ',')
    );
  END IF;
  
  -- Fire tag_removed event for each removed tag
  IF array_length(v_removed_tags, 1) > 0 THEN
    PERFORM fire_automation_event(
      NEW.team_id,
      'tag_removed',
      jsonb_build_object(
        'contactId', NEW.id,
        'removedTags', to_jsonb(v_removed_tags),
        'allTags', to_jsonb(NEW.tags),
        'lead', jsonb_build_object(
          'id', NEW.id,
          'name', NEW.name,
          'email', NEW.email,
          'phone', NEW.phone,
          'tags', to_jsonb(NEW.tags)
        )
      ),
      'tag_removed:' || NEW.id || ':' || array_to_string(v_removed_tags, ',')
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- ==============================
-- PHASE 4: Create the actual triggers
-- ==============================

-- Drop existing triggers if they exist (to prevent duplicates)
DROP TRIGGER IF EXISTS on_appointment_insert_automation ON appointments;
DROP TRIGGER IF EXISTS on_appointment_status_canceled_automation ON appointments;
DROP TRIGGER IF EXISTS on_appointment_status_no_show_automation ON appointments;
DROP TRIGGER IF EXISTS on_appointment_stage_change_automation ON appointments;
DROP TRIGGER IF EXISTS on_contact_tag_change_automation ON contacts;

-- Create triggers on appointments table
CREATE TRIGGER on_appointment_insert_automation
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_automation_on_appointment_insert();

CREATE TRIGGER on_appointment_status_canceled_automation
  AFTER UPDATE OF status ON appointments
  FOR EACH ROW
  WHEN (NEW.status = 'CANCELLED' AND OLD.status IS DISTINCT FROM 'CANCELLED')
  EXECUTE FUNCTION trigger_automation_on_appointment_canceled();

CREATE TRIGGER on_appointment_status_no_show_automation
  AFTER UPDATE OF status ON appointments
  FOR EACH ROW
  WHEN (NEW.status = 'NO_SHOW' AND OLD.status IS DISTINCT FROM 'NO_SHOW')
  EXECUTE FUNCTION trigger_automation_on_appointment_no_show();

CREATE TRIGGER on_appointment_stage_change_automation
  AFTER UPDATE OF pipeline_stage ON appointments
  FOR EACH ROW
  WHEN (NEW.pipeline_stage IS DISTINCT FROM OLD.pipeline_stage)
  EXECUTE FUNCTION trigger_automation_on_stage_change();

-- Create trigger on contacts table for tag changes
CREATE TRIGGER on_contact_tag_change_automation
  AFTER UPDATE OF tags ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_automation_on_contact_tag_change();

-- ==============================
-- PHASE 5: Set up cron job for scheduled automation jobs
-- ==============================

-- Enable pg_cron extension if available
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Note: The cron job creation uses the supabase cron schema
-- Process scheduled jobs every minute
SELECT cron.schedule(
  'process-scheduled-automation-jobs',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://inbvluddkutyfhsxfqco.supabase.co/functions/v1/process-scheduled-jobs',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  )
  $$
);

-- ==============================
-- PHASE 6: Add index for enrollment lookups
-- ==============================
CREATE INDEX IF NOT EXISTS idx_automation_enrollments_lookup 
ON automation_enrollments (automation_id, contact_id, status);

CREATE INDEX IF NOT EXISTS idx_automation_goals_automation 
ON automation_goals (automation_id, is_active);

-- Add unique constraint to prevent duplicate active enrollments
ALTER TABLE automation_enrollments 
ADD CONSTRAINT unique_active_enrollment 
UNIQUE (automation_id, contact_id) 
DEFERRABLE INITIALLY DEFERRED;