-- Add foreign key constraint between confirmation_tasks and appointments
ALTER TABLE public.confirmation_tasks 
ADD CONSTRAINT confirmation_tasks_appointment_id_fkey 
FOREIGN KEY (appointment_id) 
REFERENCES public.appointments(id) 
ON DELETE CASCADE;