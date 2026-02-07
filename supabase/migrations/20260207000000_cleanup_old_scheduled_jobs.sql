-- ==============================
-- Migration: Add cleanup cron job for old scheduled automation jobs
-- ==============================

-- Ensure extensions are available
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Remove existing cleanup job if it exists (idempotent)
SELECT cron.unschedule('cleanup-old-scheduled-jobs')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-old-scheduled-jobs'
);

-- Schedule cleanup job to run daily at 2 AM UTC
-- Deletes completed/failed scheduled_automation_jobs older than 30 days
SELECT cron.schedule(
  'cleanup-old-scheduled-jobs',
  '0 2 * * *', -- Daily at 2 AM UTC
  $$
  DELETE FROM scheduled_automation_jobs
  WHERE status IN ('completed', 'failed')
    AND updated_at < NOW() - INTERVAL '30 days';
  $$
);
