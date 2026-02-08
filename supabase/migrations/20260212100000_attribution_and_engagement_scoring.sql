-- =============================================================================
-- Attribution & Engagement Scoring Migration
-- =============================================================================
-- This migration fixes the attribution chain for high-ticket sales:
-- 1. Adds funnel_lead_id to appointments (revenue attribution)
-- 2. Creates engagement scoring triggers (auto lead scoring)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Add funnel_lead_id to appointments for revenue attribution
-- -----------------------------------------------------------------------------
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS funnel_lead_id uuid REFERENCES funnel_leads(id) ON DELETE SET NULL;

-- Index for revenue attribution queries (only index non-null values)
CREATE INDEX IF NOT EXISTS idx_appointments_funnel_lead_id
ON appointments(funnel_lead_id) WHERE funnel_lead_id IS NOT NULL;

-- Backfill existing appointments by email/phone match to most recent funnel_lead
-- This is a best-effort backfill - it links each appointment to the most recent
-- funnel_lead that shares an email or phone within the same team
UPDATE appointments a
SET funnel_lead_id = sub.fl_id
FROM (
  SELECT DISTINCT ON (a2.id) a2.id AS apt_id, fl.id AS fl_id
  FROM appointments a2
  JOIN funnel_leads fl ON fl.team_id = a2.team_id
    AND (
      (fl.email IS NOT NULL AND fl.email = a2.lead_email)
      OR (fl.phone IS NOT NULL AND fl.phone = a2.lead_phone)
    )
  WHERE a2.funnel_lead_id IS NULL
    AND (a2.lead_email IS NOT NULL OR a2.lead_phone IS NOT NULL)
  ORDER BY a2.id, fl.created_at DESC
) sub
WHERE a.id = sub.apt_id;

-- -----------------------------------------------------------------------------
-- 2. Engagement scoring: auto-update on email opens/clicks
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_engagement_score_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contact_id uuid;
  v_score_delta integer;
BEGIN
  -- Determine score based on delivery status change
  CASE NEW.delivery_status
    WHEN 'opened' THEN v_score_delta := 5;
    WHEN 'clicked' THEN v_score_delta := 10;
    ELSE RETURN NEW; -- No scoring for other statuses
  END CASE;

  -- Find contact by email address within the same team
  SELECT id INTO v_contact_id
  FROM contacts
  WHERE team_id = NEW.team_id
    AND email IS NOT NULL
    AND lower(email) = lower(NEW.to_address)
  LIMIT 1;

  -- Update engagement score and last_activity_at
  IF v_contact_id IS NOT NULL THEN
    UPDATE contacts
    SET engagement_score = COALESCE(engagement_score, 0) + v_score_delta,
        last_activity_at = NOW(),
        updated_at = NOW()
    WHERE id = v_contact_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: fires when message_logs delivery_status changes to opened or clicked
DROP TRIGGER IF EXISTS trigger_engagement_score_on_message ON message_logs;
CREATE TRIGGER trigger_engagement_score_on_message
  AFTER UPDATE ON message_logs
  FOR EACH ROW
  WHEN (
    OLD.delivery_status IS DISTINCT FROM NEW.delivery_status
    AND NEW.delivery_status IN ('opened', 'clicked')
  )
  EXECUTE FUNCTION update_engagement_score_on_message();

-- -----------------------------------------------------------------------------
-- 3. Engagement scoring: auto-update on appointment booking (+50)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_engagement_on_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update contact engagement score when an appointment is created
  -- Match by email (primary) or phone (fallback) within the same team
  UPDATE contacts
  SET engagement_score = COALESCE(engagement_score, 0) + 50,
      last_activity_at = NOW(),
      updated_at = NOW()
  WHERE team_id = NEW.team_id
    AND (
      (email IS NOT NULL AND NEW.lead_email IS NOT NULL AND lower(email) = lower(NEW.lead_email))
      OR (phone IS NOT NULL AND NEW.lead_phone IS NOT NULL AND phone = NEW.lead_phone)
    );

  RETURN NEW;
END;
$$;

-- Trigger: fires when a new appointment is created
DROP TRIGGER IF EXISTS trigger_engagement_on_appointment_insert ON appointments;
CREATE TRIGGER trigger_engagement_on_appointment_insert
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_engagement_on_booking();

-- -----------------------------------------------------------------------------
-- 4. Engagement scoring: auto-update on lead submission (+20)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_engagement_on_lead_submit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only score when a lead transitions to 'lead' status (explicit submit)
  IF NEW.status = 'lead' AND (OLD.status IS NULL OR OLD.status != 'lead') THEN
    UPDATE contacts
    SET engagement_score = COALESCE(engagement_score, 0) + 20,
        last_activity_at = NOW(),
        updated_at = NOW()
    WHERE team_id = NEW.team_id
      AND (
        (email IS NOT NULL AND NEW.email IS NOT NULL AND lower(email) = lower(NEW.email))
        OR (phone IS NOT NULL AND NEW.phone IS NOT NULL AND phone = NEW.phone)
      );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: fires when funnel_leads status changes to 'lead'
DROP TRIGGER IF EXISTS trigger_engagement_on_lead_submit ON funnel_leads;
CREATE TRIGGER trigger_engagement_on_lead_submit
  AFTER INSERT OR UPDATE ON funnel_leads
  FOR EACH ROW
  WHEN (NEW.status = 'lead')
  EXECUTE FUNCTION update_engagement_on_lead_submit();
