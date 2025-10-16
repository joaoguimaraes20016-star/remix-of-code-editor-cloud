-- Add CLOSED and RESCHEDULED to appointment_status enum
ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'CLOSED';
ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'RESCHEDULED';