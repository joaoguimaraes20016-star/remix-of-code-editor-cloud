-- Add booking_code field to appointments to track which specific setter link was used
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS booking_code TEXT;

COMMENT ON COLUMN appointments.booking_code IS 'The booking code from the setter link (e.g., jeniffer_v) if appointment came from a personal booking link';

-- Add index for querying by booking code
CREATE INDEX IF NOT EXISTS idx_appointments_booking_code ON appointments(booking_code) WHERE booking_code IS NOT NULL;