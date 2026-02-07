-- ==============================
-- Migration: Enhance appointment triggers with full contact lookup
--
-- Problem: Appointment triggers only include denormalized lead data
-- (name, email, phone) but are missing lead.id, lead.tags,
-- lead.custom_fields, lead.source, lead.owner_user_id.
-- This prevents downstream actions like add_tag, update_contact from working.
--
-- Fix: Lookup full contact record by email (with phone fallback).
-- Also standardizes field naming to snake_case for consistency.
--
-- Affected triggers:
--   1. appointment_booked (trigger_automation_on_appointment_insert)
--   2. appointment_canceled (trigger_automation_on_appointment_canceled)
--   3. appointment_no_show (trigger_automation_on_appointment_no_show)
--   4. appointment_rescheduled (trigger_automation_on_appointment_rescheduled)
--   5. appointment_completed (trigger_automation_on_appointment_completed)
--   6. stage_changed (trigger_automation_on_stage_change)
--   7. deal_created (trigger_automation_on_deal_created)
--   8. deal_won (trigger_automation_on_deal_won)
--   9. deal_lost (trigger_automation_on_deal_lost)
-- ==============================


-- ==============================
-- 1. appointment_booked
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_appointment_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_contact JSONB;
BEGIN
  -- Lookup full contact record by email (primary) or phone (fallback)
  SELECT jsonb_build_object(
    'id', c.id,
    'name', COALESCE(c.name, c.first_name || ' ' || COALESCE(c.last_name, '')),
    'first_name', c.first_name,
    'last_name', c.last_name,
    'email', c.email,
    'phone', c.phone,
    'tags', COALESCE(to_jsonb(c.tags), '[]'::jsonb),
    'source', c.source,
    'custom_fields', COALESCE(c.custom_fields, '{}'::jsonb),
    'owner_user_id', c.owner_user_id
  ) INTO v_contact
  FROM contacts c
  WHERE c.team_id = NEW.team_id
    AND (c.email = NEW.lead_email OR (NEW.lead_phone IS NOT NULL AND c.phone = NEW.lead_phone))
  LIMIT 1;

  -- Fallback to denormalized data if contact not found
  IF v_contact IS NULL THEN
    v_contact := jsonb_build_object(
      'name', NEW.lead_name,
      'email', NEW.lead_email,
      'phone', NEW.lead_phone
    );
  END IF;

  PERFORM fire_automation_event(
    NEW.team_id,
    'appointment_booked',
    jsonb_build_object(
      'appointmentId', NEW.id,
      'lead', v_contact,
      'appointment', jsonb_build_object(
        'id', NEW.id,
        'start_at_utc', NEW.start_at_utc,
        'event_type_name', NEW.event_type_name,
        'status', NEW.status,
        'pipeline_stage', NEW.pipeline_stage,
        'closer_id', NEW.closer_id,
        'closer_name', NEW.closer_name,
        'setter_id', NEW.setter_id,
        'setter_name', NEW.setter_name,
        'meeting_link', NEW.meeting_link,
        'duration_minutes', NEW.duration_minutes
      )
    ),
    'appointment_booked:' || NEW.id
  );
  RETURN NEW;
END;
$function$;


-- ==============================
-- 2. appointment_canceled
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_appointment_canceled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_contact JSONB;
BEGIN
  IF NEW.status = 'CANCELLED' AND (OLD.status IS DISTINCT FROM 'CANCELLED') THEN
    -- Lookup full contact
    SELECT jsonb_build_object(
      'id', c.id, 'name', COALESCE(c.name, c.first_name || ' ' || COALESCE(c.last_name, '')),
      'first_name', c.first_name, 'last_name', c.last_name,
      'email', c.email, 'phone', c.phone,
      'tags', COALESCE(to_jsonb(c.tags), '[]'::jsonb),
      'source', c.source, 'custom_fields', COALESCE(c.custom_fields, '{}'::jsonb),
      'owner_user_id', c.owner_user_id
    ) INTO v_contact
    FROM contacts c
    WHERE c.team_id = NEW.team_id
      AND (c.email = NEW.lead_email OR (NEW.lead_phone IS NOT NULL AND c.phone = NEW.lead_phone))
    LIMIT 1;

    IF v_contact IS NULL THEN
      v_contact := jsonb_build_object('name', NEW.lead_name, 'email', NEW.lead_email, 'phone', NEW.lead_phone);
    END IF;

    PERFORM fire_automation_event(
      NEW.team_id,
      'appointment_canceled',
      jsonb_build_object(
        'appointmentId', NEW.id,
        'previousStatus', OLD.status,
        'lead', v_contact,
        'appointment', jsonb_build_object(
          'id', NEW.id,
          'start_at_utc', NEW.start_at_utc,
          'event_type_name', NEW.event_type_name,
          'status', NEW.status,
          'pipeline_stage', NEW.pipeline_stage
        )
      ),
      'appointment_canceled:' || NEW.id || ':' || now()::text
    );
  END IF;
  RETURN NEW;
END;
$function$;


-- ==============================
-- 3. appointment_no_show
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_appointment_no_show()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_contact JSONB;
BEGIN
  IF NEW.status = 'NO_SHOW' AND (OLD.status IS DISTINCT FROM 'NO_SHOW') THEN
    SELECT jsonb_build_object(
      'id', c.id, 'name', COALESCE(c.name, c.first_name || ' ' || COALESCE(c.last_name, '')),
      'first_name', c.first_name, 'last_name', c.last_name,
      'email', c.email, 'phone', c.phone,
      'tags', COALESCE(to_jsonb(c.tags), '[]'::jsonb),
      'source', c.source, 'custom_fields', COALESCE(c.custom_fields, '{}'::jsonb),
      'owner_user_id', c.owner_user_id
    ) INTO v_contact
    FROM contacts c
    WHERE c.team_id = NEW.team_id
      AND (c.email = NEW.lead_email OR (NEW.lead_phone IS NOT NULL AND c.phone = NEW.lead_phone))
    LIMIT 1;

    IF v_contact IS NULL THEN
      v_contact := jsonb_build_object('name', NEW.lead_name, 'email', NEW.lead_email, 'phone', NEW.lead_phone);
    END IF;

    PERFORM fire_automation_event(
      NEW.team_id,
      'appointment_no_show',
      jsonb_build_object(
        'appointmentId', NEW.id,
        'previousStatus', OLD.status,
        'lead', v_contact,
        'appointment', jsonb_build_object(
          'id', NEW.id,
          'start_at_utc', NEW.start_at_utc,
          'event_type_name', NEW.event_type_name,
          'status', NEW.status,
          'pipeline_stage', NEW.pipeline_stage
        )
      ),
      'appointment_no_show:' || NEW.id || ':' || now()::text
    );
  END IF;
  RETURN NEW;
END;
$function$;


-- ==============================
-- 4. appointment_rescheduled
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_appointment_rescheduled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_contact JSONB;
BEGIN
  IF NEW.status = 'RESCHEDULED' AND (OLD.status IS DISTINCT FROM 'RESCHEDULED') THEN
    SELECT jsonb_build_object(
      'id', c.id, 'name', COALESCE(c.name, c.first_name || ' ' || COALESCE(c.last_name, '')),
      'first_name', c.first_name, 'last_name', c.last_name,
      'email', c.email, 'phone', c.phone,
      'tags', COALESCE(to_jsonb(c.tags), '[]'::jsonb),
      'source', c.source, 'custom_fields', COALESCE(c.custom_fields, '{}'::jsonb),
      'owner_user_id', c.owner_user_id
    ) INTO v_contact
    FROM contacts c
    WHERE c.team_id = NEW.team_id
      AND (c.email = NEW.lead_email OR (NEW.lead_phone IS NOT NULL AND c.phone = NEW.lead_phone))
    LIMIT 1;

    IF v_contact IS NULL THEN
      v_contact := jsonb_build_object('name', NEW.lead_name, 'email', NEW.lead_email, 'phone', NEW.lead_phone);
    END IF;

    PERFORM fire_automation_event(
      NEW.team_id,
      'appointment_rescheduled',
      jsonb_build_object(
        'appointmentId', NEW.id,
        'previousStatus', OLD.status,
        'lead', v_contact,
        'appointment', jsonb_build_object(
          'id', NEW.id,
          'start_at_utc', NEW.start_at_utc,
          'event_type_name', NEW.event_type_name,
          'status', NEW.status,
          'pipeline_stage', NEW.pipeline_stage,
          'rescheduled_to_appointment_id', NEW.rescheduled_to_appointment_id
        )
      ),
      'appointment_rescheduled:' || NEW.id || ':' || now()::text
    );
  END IF;
  RETURN NEW;
END;
$function$;


-- ==============================
-- 5. appointment_completed
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_appointment_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_contact JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', c.id, 'name', COALESCE(c.name, c.first_name || ' ' || COALESCE(c.last_name, '')),
    'first_name', c.first_name, 'last_name', c.last_name,
    'email', c.email, 'phone', c.phone,
    'tags', COALESCE(to_jsonb(c.tags), '[]'::jsonb),
    'source', c.source, 'custom_fields', COALESCE(c.custom_fields, '{}'::jsonb),
    'owner_user_id', c.owner_user_id
  ) INTO v_contact
  FROM contacts c
  WHERE c.team_id = NEW.team_id
    AND (c.email = NEW.lead_email OR (NEW.lead_phone IS NOT NULL AND c.phone = NEW.lead_phone))
  LIMIT 1;

  IF v_contact IS NULL THEN
    v_contact := jsonb_build_object('name', NEW.lead_name, 'email', NEW.lead_email, 'phone', NEW.lead_phone);
  END IF;

  PERFORM fire_automation_event(
    NEW.team_id,
    'appointment_completed',
    jsonb_build_object(
      'appointmentId', NEW.id,
      'previousStatus', OLD.status,
      'lead', v_contact,
      'appointment', jsonb_build_object(
        'id', NEW.id,
        'status', NEW.status,
        'start_at_utc', NEW.start_at_utc,
        'event_type_name', NEW.event_type_name,
        'duration_minutes', NEW.duration_minutes,
        'appointment_notes', NEW.appointment_notes,
        'meeting_link', NEW.meeting_link,
        'pipeline_stage', NEW.pipeline_stage
      )
    ),
    'appointment_' || NEW.id::text || '_completed'
  );
  RETURN NEW;
END;
$function$;


-- ==============================
-- 6. stage_changed
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_contact JSONB;
BEGIN
  IF NEW.pipeline_stage IS DISTINCT FROM OLD.pipeline_stage THEN
    SELECT jsonb_build_object(
      'id', c.id, 'name', COALESCE(c.name, c.first_name || ' ' || COALESCE(c.last_name, '')),
      'first_name', c.first_name, 'last_name', c.last_name,
      'email', c.email, 'phone', c.phone,
      'tags', COALESCE(to_jsonb(c.tags), '[]'::jsonb),
      'source', c.source, 'custom_fields', COALESCE(c.custom_fields, '{}'::jsonb),
      'owner_user_id', c.owner_user_id
    ) INTO v_contact
    FROM contacts c
    WHERE c.team_id = NEW.team_id
      AND (c.email = NEW.lead_email OR (NEW.lead_phone IS NOT NULL AND c.phone = NEW.lead_phone))
    LIMIT 1;

    IF v_contact IS NULL THEN
      v_contact := jsonb_build_object('name', NEW.lead_name, 'email', NEW.lead_email, 'phone', NEW.lead_phone);
    END IF;

    PERFORM fire_automation_event(
      NEW.team_id,
      'stage_changed',
      jsonb_build_object(
        'appointmentId', NEW.id,
        'previousStage', OLD.pipeline_stage,
        'newStage', NEW.pipeline_stage,
        'meta', jsonb_build_object(
          'fromStage', OLD.pipeline_stage,
          'toStage', NEW.pipeline_stage,
          'from_stage', OLD.pipeline_stage,
          'to_stage', NEW.pipeline_stage
        ),
        'lead', v_contact,
        'appointment', jsonb_build_object(
          'id', NEW.id,
          'start_at_utc', NEW.start_at_utc,
          'status', NEW.status,
          'pipeline_stage', NEW.pipeline_stage
        )
      ),
      'stage_changed:' || NEW.id || ':' || NEW.pipeline_stage
    );
  END IF;
  RETURN NEW;
END;
$function$;


-- ==============================
-- 7. deal_created
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_deal_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_contact JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', c.id, 'name', COALESCE(c.name, c.first_name || ' ' || COALESCE(c.last_name, '')),
    'first_name', c.first_name, 'last_name', c.last_name,
    'email', c.email, 'phone', c.phone,
    'tags', COALESCE(to_jsonb(c.tags), '[]'::jsonb),
    'source', c.source, 'custom_fields', COALESCE(c.custom_fields, '{}'::jsonb),
    'owner_user_id', c.owner_user_id
  ) INTO v_contact
  FROM contacts c
  WHERE c.team_id = NEW.team_id
    AND (c.email = NEW.lead_email OR (NEW.lead_phone IS NOT NULL AND c.phone = NEW.lead_phone))
  LIMIT 1;

  IF v_contact IS NULL THEN
    v_contact := jsonb_build_object('name', NEW.lead_name, 'email', NEW.lead_email, 'phone', NEW.lead_phone);
  END IF;

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
      'lead', v_contact
    ),
    'deal_created:' || NEW.id
  );
  RETURN NEW;
END;
$function$;


-- ==============================
-- 8. deal_won
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_deal_won()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_contact JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', c.id, 'name', COALESCE(c.name, c.first_name || ' ' || COALESCE(c.last_name, '')),
    'first_name', c.first_name, 'last_name', c.last_name,
    'email', c.email, 'phone', c.phone,
    'tags', COALESCE(to_jsonb(c.tags), '[]'::jsonb),
    'source', c.source, 'custom_fields', COALESCE(c.custom_fields, '{}'::jsonb),
    'owner_user_id', c.owner_user_id
  ) INTO v_contact
  FROM contacts c
  WHERE c.team_id = NEW.team_id
    AND (c.email = NEW.lead_email OR (NEW.lead_phone IS NOT NULL AND c.phone = NEW.lead_phone))
  LIMIT 1;

  IF v_contact IS NULL THEN
    v_contact := jsonb_build_object('name', NEW.lead_name, 'email', NEW.lead_email, 'phone', NEW.lead_phone);
  END IF;

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
      'lead', v_contact,
      'previousStage', OLD.pipeline_stage,
      'newStage', NEW.pipeline_stage
    ),
    'deal_won:' || NEW.id || ':' || NEW.pipeline_stage
  );
  RETURN NEW;
END;
$function$;


-- ==============================
-- 9. deal_lost
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_deal_lost()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_contact JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', c.id, 'name', COALESCE(c.name, c.first_name || ' ' || COALESCE(c.last_name, '')),
    'first_name', c.first_name, 'last_name', c.last_name,
    'email', c.email, 'phone', c.phone,
    'tags', COALESCE(to_jsonb(c.tags), '[]'::jsonb),
    'source', c.source, 'custom_fields', COALESCE(c.custom_fields, '{}'::jsonb),
    'owner_user_id', c.owner_user_id
  ) INTO v_contact
  FROM contacts c
  WHERE c.team_id = NEW.team_id
    AND (c.email = NEW.lead_email OR (NEW.lead_phone IS NOT NULL AND c.phone = NEW.lead_phone))
  LIMIT 1;

  IF v_contact IS NULL THEN
    v_contact := jsonb_build_object('name', NEW.lead_name, 'email', NEW.lead_email, 'phone', NEW.lead_phone);
  END IF;

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
        'team_id', NEW.team_id
      ),
      'lead', v_contact,
      'previousStage', OLD.pipeline_stage,
      'newStage', NEW.pipeline_stage
    ),
    'deal_lost:' || NEW.id || ':' || NEW.pipeline_stage
  );
  RETURN NEW;
END;
$function$;
