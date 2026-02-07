-- ==============================
-- Migration: Drop Old Enrollment Unique Index
-- Fixes re-enrollment by removing the index that blocks all re-enrollment attempts.
-- The old index enforces uniqueness on (automation_id, contact_id) regardless of
-- enrollment status, which prevents contacts from re-enrolling even when their
-- previous enrollment is completed or exited.
-- ==============================

-- Drop the old unique index that prevents re-enrollment
DROP INDEX IF EXISTS idx_enrollment_unique_contact;

-- Verify the new partial index exists (should already be created by previous migration).
-- This index only enforces uniqueness for active enrollments, allowing re-enrollment
-- when a previous enrollment has status 'completed' or 'exited'.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_enrollment
  ON automation_enrollments (automation_id, contact_id)
  WHERE status = 'active';
