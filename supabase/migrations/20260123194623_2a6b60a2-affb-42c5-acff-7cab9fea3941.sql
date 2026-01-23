ALTER TABLE public.team_integrations 
ADD COLUMN IF NOT EXISTS oauth_state TEXT,
ADD COLUMN IF NOT EXISTS redirect_uri TEXT;