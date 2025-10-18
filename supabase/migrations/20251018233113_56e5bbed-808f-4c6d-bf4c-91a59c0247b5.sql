-- Create a table to store valid creator codes (if not exists)
CREATE TABLE IF NOT EXISTS public.creator_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  uses_count integer DEFAULT 0
);

-- Enable RLS if not already enabled
DO $$ BEGIN
  ALTER TABLE public.creator_codes ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop and recreate the policy
DROP POLICY IF EXISTS "Super admins can manage creator codes" ON public.creator_codes;
CREATE POLICY "Super admins can manage creator codes"
ON public.creator_codes
FOR ALL
USING (has_global_role(auth.uid(), 'super_admin'::global_role));

-- Insert a default creator code
INSERT INTO public.creator_codes (code, is_active)
VALUES ('CREATOR2025', true)
ON CONFLICT (code) DO NOTHING;