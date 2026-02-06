-- Add event_type_id foreign key to appointments table
-- This links appointments to their event types for better querying and analytics

-- Add the column if it doesn't exist
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS event_type_id uuid REFERENCES public.event_types(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_appointments_event_type_id 
ON public.appointments (event_type_id) 
WHERE event_type_id IS NOT NULL;

-- Update existing appointments that have appointment_type_id matching event_types
-- This backfills the relationship for existing data
-- Cast both sides to UUID to ensure type compatibility
UPDATE public.appointments a
SET event_type_id = et.id
FROM public.event_types et
WHERE a.appointment_type_id::uuid = et.id
  AND a.event_type_id IS NULL;
