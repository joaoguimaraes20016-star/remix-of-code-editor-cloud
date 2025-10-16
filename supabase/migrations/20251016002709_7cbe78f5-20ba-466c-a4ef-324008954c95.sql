-- Add offer_owner column to sales table
ALTER TABLE public.sales ADD COLUMN offer_owner text;

-- Make client_id nullable (in case there are existing records)
ALTER TABLE public.sales ALTER COLUMN client_id DROP NOT NULL;