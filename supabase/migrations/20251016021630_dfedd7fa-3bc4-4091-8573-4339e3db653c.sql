-- Add CC and MRR tracking fields to appointments
ALTER TABLE public.appointments
ADD COLUMN cc_collected numeric DEFAULT 0,
ADD COLUMN mrr_amount numeric DEFAULT 0,
ADD COLUMN mrr_months integer DEFAULT 0;

-- Create a table to track MRR commissions for future months
CREATE TABLE public.mrr_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  team_member_id uuid NOT NULL,
  team_member_name text NOT NULL,
  role text NOT NULL, -- 'closer' or 'setter'
  prospect_name text NOT NULL,
  prospect_email text NOT NULL,
  month_date date NOT NULL,
  mrr_amount numeric NOT NULL,
  commission_amount numeric NOT NULL,
  commission_percentage numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(appointment_id, team_member_id, month_date)
);

-- Enable RLS
ALTER TABLE public.mrr_commissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for mrr_commissions
CREATE POLICY "Team members can view MRR commissions"
ON public.mrr_commissions
FOR SELECT
USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Team members can create MRR commissions"
ON public.mrr_commissions
FOR INSERT
WITH CHECK (is_team_member(auth.uid(), team_id));

CREATE POLICY "Team members can update MRR commissions"
ON public.mrr_commissions
FOR UPDATE
USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Team members can delete MRR commissions"
ON public.mrr_commissions
FOR DELETE
USING (is_team_member(auth.uid(), team_id));