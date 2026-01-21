-- Team sending domains for managed email
CREATE TABLE team_sending_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  domain TEXT NOT NULL,
  subdomain TEXT,
  full_domain TEXT GENERATED ALWAYS AS (
    CASE WHEN subdomain IS NOT NULL AND subdomain != '' 
    THEN subdomain || '.' || domain 
    ELSE domain END
  ) STORED,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verifying', 'verified', 'failed')),
  provider TEXT DEFAULT 'mailgun' CHECK (provider IN ('mailgun', 'resend')),
  provider_domain_id TEXT,
  dns_records JSONB DEFAULT '[]',
  verification_error TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, domain, subdomain)
);

-- Enable RLS
ALTER TABLE team_sending_domains ENABLE ROW LEVEL SECURITY;

-- Team members can view their sending domains
CREATE POLICY "Team members can view sending domains"
ON team_sending_domains FOR SELECT
USING (is_team_member(auth.uid(), team_id));

-- Team admins can manage sending domains
CREATE POLICY "Team admins can insert sending domains"
ON team_sending_domains FOR INSERT
WITH CHECK (has_team_role(auth.uid(), team_id, 'admin'));

CREATE POLICY "Team admins can update sending domains"
ON team_sending_domains FOR UPDATE
USING (has_team_role(auth.uid(), team_id, 'admin'));

CREATE POLICY "Team admins can delete sending domains"
ON team_sending_domains FOR DELETE
USING (has_team_role(auth.uid(), team_id, 'admin'));

-- Add email settings to teams table
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS default_from_name TEXT,
ADD COLUMN IF NOT EXISTS default_reply_to TEXT,
ADD COLUMN IF NOT EXISTS stackit_email_enabled BOOLEAN DEFAULT true;

-- Indexes for performance
CREATE INDEX idx_team_sending_domains_team_id ON team_sending_domains(team_id);
CREATE INDEX idx_team_sending_domains_status ON team_sending_domains(status);
CREATE INDEX idx_team_sending_domains_full_domain ON team_sending_domains(full_domain);

-- Updated at trigger
CREATE TRIGGER update_team_sending_domains_updated_at
BEFORE UPDATE ON team_sending_domains
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();