-- Add custom_labels column to teams table for customizable terminology
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS custom_labels jsonb DEFAULT '{
  "role_1": "Setter",
  "role_2": "Closer",
  "role_1_plural": "Setters",
  "role_2_plural": "Closers",
  "role_1_short": "S",
  "role_2_short": "C"
}'::jsonb;

COMMENT ON COLUMN public.teams.custom_labels IS 'Customizable terminology for roles and CRM elements';