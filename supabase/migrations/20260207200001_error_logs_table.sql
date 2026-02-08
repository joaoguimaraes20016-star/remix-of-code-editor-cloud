-- Error Logs Table
-- Provides fallback logging when primary step logging fails.
-- Also used for capturing SQL trigger failures and other system errors
-- that would otherwise be silently lost.

CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type text NOT NULL,
  error_message text,
  context jsonb,
  created_at timestamptz DEFAULT now()
);

-- Index for querying by error type
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON public.error_logs(error_type);

-- Index for time-based queries (most recent first)
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);

-- Enable RLS (restrict to service role only)
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.error_logs IS
  'Fallback error logging for step log failures, SQL trigger errors, and system-level issues';
