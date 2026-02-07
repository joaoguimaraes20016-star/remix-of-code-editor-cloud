-- ==============================
-- Migration: Add Re-Enrollment Settings to Automations
-- Adds GHL-compatible re-enrollment control
-- 
-- CRITICAL FIX: Replaces the absolute unique constraint on
-- (automation_id, contact_id) with a partial unique index that
-- only enforces uniqueness for ACTIVE enrollments. Without this,
-- re-enrollment is impossible because completed/exited records
-- block new INSERTs with a 23505 duplicate key error.
-- ==============================

-- Add re-enrollment columns to automations table
ALTER TABLE automations
  ADD COLUMN IF NOT EXISTS allow_reenrollment BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reenrollment_condition TEXT DEFAULT 'never'
    CHECK (reenrollment_condition IN ('never', 'after_exit', 'after_complete', 'always')),
  ADD COLUMN IF NOT EXISTS reenrollment_wait_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_active_contacts INTEGER DEFAULT NULL;

-- Add reenrollment_count column to enrollments if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'automation_enrollments' AND column_name = 'reenrollment_count'
  ) THEN
    ALTER TABLE automation_enrollments ADD COLUMN reenrollment_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- ==============================
-- CRITICAL: Replace absolute unique constraint with partial unique index
-- The old constraint prevents ANY duplicate (automation_id, contact_id) rows,
-- which means once a contact completes/exits an automation, they can never
-- be re-enrolled because the old row still exists.
-- The new partial index only prevents duplicate ACTIVE enrollments.
-- ==============================
ALTER TABLE automation_enrollments
  DROP CONSTRAINT IF EXISTS unique_active_enrollment;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_enrollment
  ON automation_enrollments (automation_id, contact_id)
  WHERE status = 'active';

-- Also create a partial index for appointment-based enrollments
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_enrollment_appointment
  ON automation_enrollments (automation_id, appointment_id)
  WHERE status = 'active' AND appointment_id IS NOT NULL;

-- Index for re-enrollment queries (lookup past enrollments efficiently)
CREATE INDEX IF NOT EXISTS idx_enrollment_reenrollment
  ON automation_enrollments (automation_id, contact_id, status, completed_at);

-- Add comment for documentation
COMMENT ON COLUMN automations.reenrollment_condition IS 'When re-enrollment is allowed: never, after_exit, after_complete, always';
COMMENT ON COLUMN automations.reenrollment_wait_days IS 'Minimum days to wait before allowing re-enrollment';
COMMENT ON COLUMN automations.max_active_contacts IS 'Maximum number of contacts that can be actively enrolled at once (null = unlimited)';
