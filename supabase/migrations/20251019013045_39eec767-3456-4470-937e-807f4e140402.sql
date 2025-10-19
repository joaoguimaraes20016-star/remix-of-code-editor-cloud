-- Add event_type_uri and event_type_name columns to appointments table
ALTER TABLE public.appointments 
ADD COLUMN event_type_uri text,
ADD COLUMN event_type_name text;