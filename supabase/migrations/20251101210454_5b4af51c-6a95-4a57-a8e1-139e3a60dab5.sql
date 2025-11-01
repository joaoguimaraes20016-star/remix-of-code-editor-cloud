-- Add reschedule tracking columns to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS original_appointment_id uuid REFERENCES appointments(id),
ADD COLUMN IF NOT EXISTS rescheduled_to_appointment_id uuid REFERENCES appointments(id),
ADD COLUMN IF NOT EXISTS reschedule_count integer DEFAULT 0;

-- Create index for better query performance on reschedule chains
CREATE INDEX IF NOT EXISTS idx_appointments_original ON appointments(original_appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointments_rescheduled_to ON appointments(rescheduled_to_appointment_id);

-- Add comment for documentation
COMMENT ON COLUMN appointments.original_appointment_id IS 'References the original appointment if this is a rescheduled version';
COMMENT ON COLUMN appointments.rescheduled_to_appointment_id IS 'References the new appointment if this one was rescheduled';
COMMENT ON COLUMN appointments.reschedule_count IS 'Tracks how many times this appointment has been rescheduled in the chain';