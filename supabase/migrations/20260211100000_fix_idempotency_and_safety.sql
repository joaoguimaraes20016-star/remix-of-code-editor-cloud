-- Migration: Fix idempotency race condition and safety improvements
-- Phase: Beta Launch Readiness Audit
-- Date: 2026-02-11

-- =========================================================================
-- FIX 1: Idempotency Race Condition
-- =========================================================================
-- Problem: hasAutomationAlreadyRunForEvent and createAutomationRun are separate
-- operations with no atomicity guarantee. Two concurrent requests can both pass
-- the check before either inserts, causing duplicate automation runs.
--
-- Solution: Add a unique partial index on the composite idempotency key stored
-- in context_snapshot. This makes the INSERT fail with a conflict if a duplicate
-- exists, which we handle with ON CONFLICT DO NOTHING in the application code.
--
-- IMPORTANT: The index only applies to status = 'success' runs. This ensures:
--   1. Crashed/orphaned 'running' records do NOT permanently block retries
--   2. Failed 'error' runs can be retried
--   3. Only truly completed runs enforce the unique constraint
-- =========================================================================

-- Drop the old index if it exists (may have been created with status != 'error')
DROP INDEX IF EXISTS idx_automation_runs_idempotency;

-- Create a unique partial index on the idempotency fields within context_snapshot.
-- Only applies to successful runs — 'running' and 'error' records are excluded
-- so that crashed runs don't permanently block retries.
CREATE UNIQUE INDEX IF NOT EXISTS idx_automation_runs_idempotency
ON public.automation_runs (
  team_id,
  trigger_type,
  ((context_snapshot->>'automationKey')),
  ((context_snapshot->>'eventId'))
)
WHERE status = 'success'
  AND context_snapshot->>'eventId' IS NOT NULL
  AND context_snapshot->>'automationKey' IS NOT NULL;

-- Also add an index to speed up the idempotency lookups that currently do
-- full table scans with JSON field filters
CREATE INDEX IF NOT EXISTS idx_automation_runs_event_lookup
ON public.automation_runs (team_id, trigger_type)
WHERE status != 'error';

-- =========================================================================
-- FIX 2: Cleanup orphaned 'running' records
-- =========================================================================
-- Edge function timeouts or crashes can leave automation_runs in 'running'
-- status permanently. This marks any run that has been 'running' for more
-- than 1 hour as 'error' so it doesn't block future runs.
-- =========================================================================
UPDATE public.automation_runs
SET status = 'error',
    error_message = 'Timeout - marked as error by cleanup migration'
WHERE status = 'running'
  AND created_at < NOW() - INTERVAL '1 hour';
