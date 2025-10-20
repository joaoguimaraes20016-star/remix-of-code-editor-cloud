-- Add commission percentage settings to teams table
ALTER TABLE public.teams 
ADD COLUMN setter_commission_percentage NUMERIC DEFAULT 5.0,
ADD COLUMN closer_commission_percentage NUMERIC DEFAULT 10.0;

-- Add constraint to ensure percentages are reasonable
ALTER TABLE public.teams
ADD CONSTRAINT setter_commission_percentage_check CHECK (setter_commission_percentage >= 0 AND setter_commission_percentage <= 100),
ADD CONSTRAINT closer_commission_percentage_check CHECK (closer_commission_percentage >= 0 AND closer_commission_percentage <= 100);