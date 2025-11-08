-- Phase 1: Fix Data Integrity

-- 1. Assign closer to existing appointment
UPDATE appointments
SET closer_id = 'b04c36b0-1eb2-4bf0-a9cf-d532ae38f910',
    closer_name = 'Jaxon'
WHERE id = 'a1e3ee56-f991-4d23-a4e0-0e5399ca26ab'
  AND closer_id IS NULL;

-- 2. Ensure default pipeline stages exist for the team
INSERT INTO team_pipeline_stages (team_id, stage_id, stage_label, stage_color, order_index, is_default)
VALUES
  ('5cf316b0-a6f1-4b14-825c-e6c596f85ff2', 'booked', 'Appointment Booked', '#3b82f6', 0, true),
  ('5cf316b0-a6f1-4b14-825c-e6c596f85ff2', 'showed', 'Showed', '#10b981', 1, true),
  ('5cf316b0-a6f1-4b14-825c-e6c596f85ff2', 'no_show', 'No-Show', '#f97316', 2, true),
  ('5cf316b0-a6f1-4b14-825c-e6c596f85ff2', 'canceled', 'Canceled', '#6b7280', 3, true),
  ('5cf316b0-a6f1-4b14-825c-e6c596f85ff2', 'rescheduled', 'Rescheduled', '#eab308', 4, true),
  ('5cf316b0-a6f1-4b14-825c-e6c596f85ff2', 'deposit', 'Deposit Collected', '#14b8a6', 5, true),
  ('5cf316b0-a6f1-4b14-825c-e6c596f85ff2', 'won', 'Closed', '#22c55e', 6, true),
  ('5cf316b0-a6f1-4b14-825c-e6c596f85ff2', 'disqualified', 'Disqualified', '#ef4444', 7, true)
ON CONFLICT (team_id, stage_id) DO NOTHING;

-- 3. Create missing RPC function: cleanup_appointment_tasks
CREATE OR REPLACE FUNCTION public.cleanup_appointment_tasks(appt_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM confirmation_tasks WHERE appointment_id = appt_id;
END;
$$;

-- 4. Create missing RPC function: check_active_triggers
CREATE OR REPLACE FUNCTION public.check_active_triggers()
RETURNS TABLE(trigger_name TEXT, event TEXT, table_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tgname::TEXT, 
    CASE t.tgtype::INTEGER & 66
      WHEN 2 THEN 'BEFORE'
      WHEN 64 THEN 'INSTEAD OF'
      ELSE 'AFTER'
    END as event,
    c.relname::TEXT
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relnamespace = 'public'::regnamespace
    AND NOT t.tgisinternal;
END;
$$;

-- Phase 6: Add Validation Trigger
CREATE OR REPLACE FUNCTION public.validate_appointment_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Warn if no closer assigned for appointments moving to deposit/won
  IF NEW.pipeline_stage IN ('deposit', 'won') AND NEW.closer_id IS NULL THEN
    RAISE WARNING 'Appointment % moving to % without closer assigned', NEW.id, NEW.pipeline_stage;
  END IF;
  
  -- Warn if no setter assigned at all
  IF NEW.setter_id IS NULL THEN
    RAISE WARNING 'Appointment % created/updated without setter', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_appointment_assignments
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment_assignment();