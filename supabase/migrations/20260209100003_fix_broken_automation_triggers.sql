-- ==============================
-- Migration: Fix broken automation triggers
-- 
-- Root Cause: 4 trigger functions incorrectly assumed contact_id FK exists
-- on the appointments and confirmation_tasks tables. This system uses
-- intentional denormalization — appointments store lead_email/lead_phone
-- directly and are matched to contacts at query time.
--
-- Fixes:
--   1. trigger_automation_on_note_added    — used appointments.contact_id (doesn't exist)
--   2. trigger_automation_on_task_added    — used confirmation_tasks.contact_id, title, description, due_date (don't exist)
--   3. trigger_automation_on_note_changed  — used appointments.contact_id (doesn't exist)
--   4. trigger_automation_on_task_completed — used appointments.contact_id (doesn't exist)
--
-- Fix pattern: lookup contact via contacts.email = appointments.lead_email
-- ==============================


-- ==============================
-- 1. Fix note_added trigger
-- Was: (SELECT contact_id FROM appointments WHERE id = NEW.appointment_id LIMIT 1)
-- Fix: lookup contact via appointment's lead_email
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_note_added()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_lead_email TEXT;
  v_lead_phone TEXT;
  v_lead_name TEXT;
  v_contact_id UUID;
BEGIN
  -- Get lead info from the linked appointment
  SELECT lead_email, lead_phone, lead_name
  INTO v_lead_email, v_lead_phone, v_lead_name
  FROM appointments
  WHERE id = NEW.appointment_id
  LIMIT 1;

  -- Lookup contact by email (primary) or phone (fallback)
  IF v_lead_email IS NOT NULL THEN
    SELECT id INTO v_contact_id
    FROM contacts
    WHERE team_id = NEW.team_id AND email = v_lead_email
    LIMIT 1;
  END IF;

  IF v_contact_id IS NULL AND v_lead_phone IS NOT NULL THEN
    SELECT id INTO v_contact_id
    FROM contacts
    WHERE team_id = NEW.team_id AND phone = v_lead_phone
    LIMIT 1;
  END IF;

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
        'id', v_contact_id,
        'email', v_lead_email,
        'phone', v_lead_phone,
        'name', v_lead_name
      )
    ),
    'note_added:' || NEW.id || ':' || extract(epoch from now())::text
  );
  RETURN NEW;
END;
$function$;


-- ==============================
-- 2. Fix task_added trigger
-- Was: NEW.contact_id (doesn't exist on confirmation_tasks)
-- Was: NEW.title, NEW.description, NEW.due_date (don't exist on confirmation_tasks)
-- Fix: lookup contact via appointment's lead_email
-- Fix: use actual columns: notes, task_type, due_at
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_task_added()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_lead_email TEXT;
  v_lead_phone TEXT;
  v_lead_name TEXT;
  v_contact_id UUID;
BEGIN
  -- Get lead info from the linked appointment
  IF NEW.appointment_id IS NOT NULL THEN
    SELECT lead_email, lead_phone, lead_name
    INTO v_lead_email, v_lead_phone, v_lead_name
    FROM appointments
    WHERE id = NEW.appointment_id
    LIMIT 1;

    -- Lookup contact by email (primary) or phone (fallback)
    IF v_lead_email IS NOT NULL THEN
      SELECT id INTO v_contact_id
      FROM contacts
      WHERE team_id = NEW.team_id AND email = v_lead_email
      LIMIT 1;
    END IF;

    IF v_contact_id IS NULL AND v_lead_phone IS NOT NULL THEN
      SELECT id INTO v_contact_id
      FROM contacts
      WHERE team_id = NEW.team_id AND phone = v_lead_phone
      LIMIT 1;
    END IF;
  END IF;

  PERFORM fire_automation_event(
    NEW.team_id,
    'task_added',
    jsonb_build_object(
      'meta', jsonb_build_object(
        'taskId', NEW.id,
        'title', COALESCE(NEW.notes, NEW.task_type::text),
        'taskType', NEW.task_type,
        'dueAt', NEW.due_at,
        'status', NEW.status
      ),
      'lead', jsonb_build_object(
        'id', v_contact_id,
        'email', v_lead_email,
        'phone', v_lead_phone,
        'name', v_lead_name
      ),
      'appointment', CASE
        WHEN NEW.appointment_id IS NOT NULL THEN
          jsonb_build_object('id', NEW.appointment_id)
        ELSE NULL
      END
    ),
    'task_added:' || NEW.id || ':' || now()::text
  );
  RETURN NEW;
END;
$function$;


-- ==============================
-- 3. Fix note_changed trigger
-- Was: (SELECT contact_id FROM appointments WHERE id = NEW.appointment_id LIMIT 1)
-- Fix: lookup contact via appointment's lead_email
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_note_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_lead_email TEXT;
  v_lead_phone TEXT;
  v_lead_name TEXT;
  v_contact_id UUID;
BEGIN
  -- Only fire when note content actually changes
  IF NEW.note IS DISTINCT FROM OLD.note THEN
    -- Get lead info from the linked appointment
    SELECT lead_email, lead_phone, lead_name
    INTO v_lead_email, v_lead_phone, v_lead_name
    FROM appointments
    WHERE id = NEW.appointment_id
    LIMIT 1;

    -- Lookup contact by email (primary) or phone (fallback)
    IF v_lead_email IS NOT NULL THEN
      SELECT id INTO v_contact_id
      FROM contacts
      WHERE team_id = NEW.team_id AND email = v_lead_email
      LIMIT 1;
    END IF;

    IF v_contact_id IS NULL AND v_lead_phone IS NOT NULL THEN
      SELECT id INTO v_contact_id
      FROM contacts
      WHERE team_id = NEW.team_id AND phone = v_lead_phone
      LIMIT 1;
    END IF;

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
          'id', v_contact_id,
          'email', v_lead_email,
          'phone', v_lead_phone,
          'name', v_lead_name
        )
      ),
      'note_changed:' || NEW.id || ':' || extract(epoch from now())::text
    );
  END IF;
  RETURN NEW;
END;
$function$;


-- ==============================
-- 4. Fix task_completed trigger
-- Was: (SELECT contact_id FROM appointments WHERE id = NEW.appointment_id LIMIT 1)
-- Fix: lookup contact via appointment's lead_email
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_task_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_lead_email TEXT;
  v_lead_phone TEXT;
  v_lead_name TEXT;
  v_contact_id UUID;
BEGIN
  -- Get lead info from the linked appointment
  SELECT lead_email, lead_phone, lead_name
  INTO v_lead_email, v_lead_phone, v_lead_name
  FROM appointments
  WHERE id = NEW.appointment_id
  LIMIT 1;

  -- Lookup contact by email (primary) or phone (fallback)
  IF v_lead_email IS NOT NULL THEN
    SELECT id INTO v_contact_id
    FROM contacts
    WHERE team_id = NEW.team_id AND email = v_lead_email
    LIMIT 1;
  END IF;

  IF v_contact_id IS NULL AND v_lead_phone IS NOT NULL THEN
    SELECT id INTO v_contact_id
    FROM contacts
    WHERE team_id = NEW.team_id AND phone = v_lead_phone
    LIMIT 1;
  END IF;

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
        'id', v_contact_id,
        'email', v_lead_email,
        'phone', v_lead_phone,
        'name', v_lead_name
      )
    ),
    'task_completed:' || NEW.id
  );
  RETURN NEW;
END;
$function$;
