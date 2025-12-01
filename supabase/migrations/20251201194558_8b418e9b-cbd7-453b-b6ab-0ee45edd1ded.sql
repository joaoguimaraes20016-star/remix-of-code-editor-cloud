-- Add no_answer_retry_minutes setting to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS no_answer_retry_minutes integer DEFAULT 30;

COMMENT ON COLUMN teams.no_answer_retry_minutes IS 'Minutes to wait before retrying a call after No Answer';