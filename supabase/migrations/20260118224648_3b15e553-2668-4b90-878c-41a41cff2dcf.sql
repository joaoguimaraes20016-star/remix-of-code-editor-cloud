-- Phase 4: Version History for Funnels
-- Add version_history column to store publish snapshots

ALTER TABLE public.funnels
ADD COLUMN IF NOT EXISTS version_history jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.funnels.version_history IS 'Array of previous published versions: [{snapshot, timestamp, name?}]';