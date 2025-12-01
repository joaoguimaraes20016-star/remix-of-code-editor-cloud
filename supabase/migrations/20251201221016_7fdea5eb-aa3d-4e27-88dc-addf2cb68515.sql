-- Add columns to store original closer info when rescheduling
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS original_closer_id uuid,
ADD COLUMN IF NOT EXISTS original_closer_name text;

-- Backfill existing rescheduled appointments with original closer info
UPDATE appointments a
SET 
  original_closer_id = orig.closer_id,
  original_closer_name = orig.closer_name
FROM appointments orig
WHERE a.original_appointment_id = orig.id
  AND a.original_closer_id IS NULL
  AND orig.closer_id IS NOT NULL;