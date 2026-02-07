-- ==============================
-- Migration: Add Deal Lifecycle Triggers
-- Adds database triggers for:
--   1. deal_created (appointment INSERT)
--   2. deal_won (pipeline_stage changed to 'won' or status changed to 'CLOSED' with pipeline_stage 'won')
--   3. deal_lost (pipeline_stage changed to 'disqualified'/'lost' or status to 'CANCELLED')
--
-- Note: Deals share the appointments table in this system.
-- ==============================

-- ==============================
-- 1. Deal Created Trigger
-- Fires when a new appointment/deal is inserted
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_deal_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM fire_automation_event(
    NEW.team_id,
    'deal_created',
    jsonb_build_object(
      'appointmentId', NEW.id,
      'deal', jsonb_build_object(
        'id', NEW.id,
        'name', NEW.lead_name,
        'email', NEW.lead_email,
        'phone', NEW.lead_phone,
        'status', NEW.status,
        'pipeline_stage', NEW.pipeline_stage,
        'revenue', COALESCE(NEW.revenue, 0),
        'event_type_name', NEW.event_type_name,
        'start_at_utc', NEW.start_at_utc,
        'team_id', NEW.team_id
      ),
      'lead', jsonb_build_object(
        'name', NEW.lead_name,
        'email', NEW.lead_email,
        'phone', NEW.lead_phone
      )
    ),
    'deal_' || NEW.id::text || '_created'
  );
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS on_deal_created_automation ON appointments;

-- Create the trigger
CREATE TRIGGER on_deal_created_automation
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_automation_on_deal_created();


-- ==============================
-- 2. Deal Won Trigger
-- Fires when pipeline_stage changes to 'won' or 'closed_won'
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_deal_won()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM fire_automation_event(
    NEW.team_id,
    'deal_won',
    jsonb_build_object(
      'appointmentId', NEW.id,
      'deal', jsonb_build_object(
        'id', NEW.id,
        'name', NEW.lead_name,
        'email', NEW.lead_email,
        'phone', NEW.lead_phone,
        'status', NEW.status,
        'pipeline_stage', NEW.pipeline_stage,
        'revenue', COALESCE(NEW.revenue, 0),
        'cc_collected', COALESCE(NEW.cc_collected, 0),
        'mrr_amount', COALESCE(NEW.mrr_amount, 0),
        'mrr_months', COALESCE(NEW.mrr_months, 0),
        'product_name', NEW.product_name,
        'closer_name', NEW.closer_name,
        'team_id', NEW.team_id
      ),
      'lead', jsonb_build_object(
        'name', NEW.lead_name,
        'email', NEW.lead_email,
        'phone', NEW.lead_phone
      ),
      'previousStage', OLD.pipeline_stage,
      'previousStatus', OLD.status
    ),
    'deal_' || NEW.id::text || '_won'
  );
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS on_deal_won_automation ON appointments;

-- Create the trigger - fires when pipeline_stage changes to 'won' or 'closed_won'
CREATE TRIGGER on_deal_won_automation
  AFTER UPDATE ON appointments
  FOR EACH ROW
  WHEN (
    (NEW.pipeline_stage IN ('won', 'closed_won') AND OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage)
    OR
    (NEW.status = 'CLOSED' AND OLD.status IS DISTINCT FROM 'CLOSED' AND NEW.pipeline_stage IN ('won', 'closed_won'))
  )
  EXECUTE FUNCTION trigger_automation_on_deal_won();


-- ==============================
-- 3. Deal Lost Trigger
-- Fires when pipeline_stage changes to 'disqualified'/'lost'/'closed_lost'
-- or when status changes to 'CANCELLED'
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_deal_lost()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM fire_automation_event(
    NEW.team_id,
    'deal_lost',
    jsonb_build_object(
      'appointmentId', NEW.id,
      'deal', jsonb_build_object(
        'id', NEW.id,
        'name', NEW.lead_name,
        'email', NEW.lead_email,
        'phone', NEW.lead_phone,
        'status', NEW.status,
        'pipeline_stage', NEW.pipeline_stage,
        'revenue', COALESCE(NEW.revenue, 0),
        'closer_notes', NEW.closer_notes,
        'team_id', NEW.team_id
      ),
      'lead', jsonb_build_object(
        'name', NEW.lead_name,
        'email', NEW.lead_email,
        'phone', NEW.lead_phone
      ),
      'previousStage', OLD.pipeline_stage,
      'previousStatus', OLD.status,
      'lostReason', COALESCE(NEW.closer_notes, 'No reason provided')
    ),
    'deal_' || NEW.id::text || '_lost'
  );
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS on_deal_lost_automation ON appointments;

-- Create the trigger - fires when pipeline_stage changes to lost/disqualified or status to CANCELLED
CREATE TRIGGER on_deal_lost_automation
  AFTER UPDATE ON appointments
  FOR EACH ROW
  WHEN (
    (NEW.pipeline_stage IN ('lost', 'disqualified', 'closed_lost') AND OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage)
    OR
    (NEW.status = 'CANCELLED' AND OLD.status IS DISTINCT FROM 'CANCELLED' AND COALESCE(OLD.pipeline_stage, '') NOT IN ('won', 'closed_won'))
  )
  EXECUTE FUNCTION trigger_automation_on_deal_lost();
