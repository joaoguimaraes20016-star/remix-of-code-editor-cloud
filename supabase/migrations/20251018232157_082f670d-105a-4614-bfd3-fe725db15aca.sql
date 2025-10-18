-- Add product_name column to appointments table
ALTER TABLE public.appointments ADD COLUMN product_name TEXT;

-- Add product_name column to sales table
ALTER TABLE public.sales ADD COLUMN product_name TEXT;