-- Enable pgcrypto for password encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Client assets main table
CREATE TABLE client_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'complete', 'needs_update')),
  completion_percentage NUMERIC DEFAULT 0,
  access_token TEXT UNIQUE NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  last_updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Field templates for customization
CREATE TABLE asset_field_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  field_category TEXT NOT NULL CHECK (field_category IN ('instagram', 'domain', 'manychat', 'media', 'custom')),
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'password', 'url', 'file')),
  is_required BOOLEAN DEFAULT false,
  placeholder_text TEXT,
  help_text TEXT,
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Client asset fields (encrypted passwords)
CREATE TABLE client_asset_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_asset_id UUID NOT NULL REFERENCES client_assets(id) ON DELETE CASCADE,
  field_category TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_value TEXT,
  field_type TEXT NOT NULL,
  is_required BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- File storage tracking
CREATE TABLE client_asset_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_asset_id UUID NOT NULL REFERENCES client_assets(id) ON DELETE CASCADE,
  file_category TEXT NOT NULL CHECK (file_category IN ('photos', 'backup_codes', 'documents')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Audit logging for security
CREATE TABLE client_asset_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_asset_id UUID NOT NULL REFERENCES client_assets(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'viewed', 'updated', 'deleted', 'accessed', 'file_uploaded', 'file_downloaded')),
  user_id UUID REFERENCES auth.users(id),
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_client_assets_team_id ON client_assets(team_id);
CREATE INDEX idx_client_assets_status ON client_assets(status);
CREATE INDEX idx_client_assets_token ON client_assets(access_token);
CREATE INDEX idx_client_asset_fields_client_id ON client_asset_fields(client_asset_id);
CREATE INDEX idx_client_asset_files_client_id ON client_asset_files(client_asset_id);
CREATE INDEX idx_audit_logs_client_id ON client_asset_audit_logs(client_asset_id);

-- Updated_at triggers
CREATE TRIGGER update_client_assets_updated_at
  BEFORE UPDATE ON client_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_asset_fields_updated_at
  BEFORE UPDATE ON client_asset_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Calculate completion percentage function
CREATE OR REPLACE FUNCTION calculate_completion_percentage(asset_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_required INTEGER;
  completed_fields INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_required
  FROM client_asset_fields
  WHERE client_asset_id = asset_id AND is_required = true;
  
  SELECT COUNT(*) INTO completed_fields
  FROM client_asset_fields
  WHERE client_asset_id = asset_id 
    AND is_required = true 
    AND field_value IS NOT NULL 
    AND field_value != '';
  
  IF total_required = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (completed_fields::NUMERIC / total_required::NUMERIC) * 100;
END;
$$;

-- Auto-update completion percentage trigger
CREATE OR REPLACE FUNCTION update_completion_percentage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE client_assets
  SET completion_percentage = calculate_completion_percentage(NEW.client_asset_id),
      updated_at = now()
  WHERE id = NEW.client_asset_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_completion_on_field_change
  AFTER INSERT OR UPDATE ON client_asset_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_completion_percentage();

-- Enable RLS on all tables
ALTER TABLE client_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_field_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_asset_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_asset_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_asset_audit_logs ENABLE ROW LEVEL SECURITY;

-- client_assets policies
CREATE POLICY "Offer owners and admins can view client assets"
  ON client_assets FOR SELECT
  TO authenticated
  USING (
    is_team_member(auth.uid(), team_id) 
    AND (
      has_team_role(auth.uid(), team_id, 'offer_owner') 
      OR has_team_role(auth.uid(), team_id, 'admin')
      OR has_team_role(auth.uid(), team_id, 'owner')
    )
  );

CREATE POLICY "Offer owners and admins can create client assets"
  ON client_assets FOR INSERT
  TO authenticated
  WITH CHECK (
    is_team_member(auth.uid(), team_id) 
    AND (
      has_team_role(auth.uid(), team_id, 'offer_owner') 
      OR has_team_role(auth.uid(), team_id, 'admin')
      OR has_team_role(auth.uid(), team_id, 'owner')
    )
  );

CREATE POLICY "Offer owners and admins can update client assets"
  ON client_assets FOR UPDATE
  TO authenticated
  USING (
    is_team_member(auth.uid(), team_id) 
    AND (
      has_team_role(auth.uid(), team_id, 'offer_owner') 
      OR has_team_role(auth.uid(), team_id, 'admin')
      OR has_team_role(auth.uid(), team_id, 'owner')
    )
  );

CREATE POLICY "Offer owners and admins can delete client assets"
  ON client_assets FOR DELETE
  TO authenticated
  USING (
    is_team_member(auth.uid(), team_id) 
    AND (
      has_team_role(auth.uid(), team_id, 'offer_owner') 
      OR has_team_role(auth.uid(), team_id, 'admin')
      OR has_team_role(auth.uid(), team_id, 'owner')
    )
  );

-- asset_field_templates policies
CREATE POLICY "Team members can view templates"
  ON asset_field_templates FOR SELECT
  TO authenticated
  USING (team_id IS NULL OR is_team_member(auth.uid(), team_id));

CREATE POLICY "Offer owners can manage templates"
  ON asset_field_templates FOR ALL
  TO authenticated
  USING (
    team_id IS NULL 
    OR (
      is_team_member(auth.uid(), team_id) 
      AND (has_team_role(auth.uid(), team_id, 'offer_owner') OR has_team_role(auth.uid(), team_id, 'owner'))
    )
  );

-- client_asset_fields policies
CREATE POLICY "Authorized users can view fields"
  ON client_asset_fields FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_assets ca
      WHERE ca.id = client_asset_id
        AND is_team_member(auth.uid(), ca.team_id) 
        AND (
          has_team_role(auth.uid(), ca.team_id, 'offer_owner') 
          OR has_team_role(auth.uid(), ca.team_id, 'admin')
          OR has_team_role(auth.uid(), ca.team_id, 'owner')
        )
    )
  );

CREATE POLICY "Authorized users can modify fields"
  ON client_asset_fields FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_assets ca
      WHERE ca.id = client_asset_id
        AND is_team_member(auth.uid(), ca.team_id) 
        AND (
          has_team_role(auth.uid(), ca.team_id, 'offer_owner') 
          OR has_team_role(auth.uid(), ca.team_id, 'admin')
          OR has_team_role(auth.uid(), ca.team_id, 'owner')
        )
    )
  );

-- client_asset_files policies
CREATE POLICY "Authorized users can manage files"
  ON client_asset_files FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_assets ca
      WHERE ca.id = client_asset_id
        AND is_team_member(auth.uid(), ca.team_id) 
        AND (
          has_team_role(auth.uid(), ca.team_id, 'offer_owner') 
          OR has_team_role(auth.uid(), ca.team_id, 'admin')
          OR has_team_role(auth.uid(), ca.team_id, 'owner')
        )
    )
  );

-- Audit log policies
CREATE POLICY "Admins can view audit logs"
  ON client_asset_audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_assets ca
      WHERE ca.id = client_asset_id
        AND is_team_member(auth.uid(), ca.team_id) 
        AND (
          has_team_role(auth.uid(), ca.team_id, 'offer_owner') 
          OR has_team_role(auth.uid(), ca.team_id, 'admin')
          OR has_team_role(auth.uid(), ca.team_id, 'owner')
        )
    )
  );

CREATE POLICY "System can insert audit logs"
  ON client_asset_audit_logs FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Create private storage bucket for client asset files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-assets',
  'client-assets',
  false,
  10485760,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/zip'
  ]
);

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'client-assets');

CREATE POLICY "Authenticated users can view files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'client-assets');

CREATE POLICY "Authenticated users can delete files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'client-assets');

-- Insert default field templates
INSERT INTO asset_field_templates (field_category, field_name, field_type, is_required, placeholder_text, help_text, order_index) VALUES
('instagram', 'Instagram Username', 'text', true, '@username', 'Your Instagram handle without @', 1),
('instagram', 'Instagram Password', 'password', true, '', 'Your Instagram login password', 2),
('instagram', 'Instagram Backup Codes', 'file', true, '', 'Screenshot of your Instagram backup codes', 3),
('domain', 'Domain Provider/Contact', 'text', true, 'GoDaddy, Namecheap, etc.', 'Your domain hosting provider or contact person', 4),
('domain', 'Domain Login', 'text', false, 'username or email', 'Login email or username for domain host', 5),
('domain', 'Domain Password', 'password', false, '', 'Password for domain hosting account', 6),
('manychat', 'ManyChat Username', 'text', false, '', 'Optional: Your ManyChat username', 7),
('manychat', 'ManyChat Password', 'password', false, '', 'Optional: Your ManyChat password', 8),
('media', 'Google Drive Link', 'url', true, 'https://drive.google.com/...', 'Link to folder with 30 photos + voice memo', 9);