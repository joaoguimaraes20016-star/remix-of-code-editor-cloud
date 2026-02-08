-- Step-Level Idempotency Constraint
-- Prevents duplicate successful step executions from concurrent retries.
--
-- This allows:
--   - Multiple 'running' entries (retries in progress)
--   - Multiple 'error' entries (failed attempts)
--   - Only ONE 'success' entry per (run_id, step_id)
--
-- If two concurrent retries both succeed, the second INSERT will get a
-- 23505 unique constraint violation, which is handled gracefully in
-- the application code (step-logger.ts).

CREATE UNIQUE INDEX IF NOT EXISTS idx_step_logs_idempotency
ON public.automation_step_logs (run_id, step_id)
WHERE status = 'success';

COMMENT ON INDEX idx_step_logs_idempotency IS
  'Prevents duplicate successful step executions from concurrent retries';
