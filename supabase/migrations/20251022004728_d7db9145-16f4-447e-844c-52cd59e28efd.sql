-- Migrate all 'owner' roles to 'admin' in team_members
UPDATE team_members 
SET role = 'admin' 
WHERE role = 'owner';

-- Update RLS policies to replace 'owner' with 'admin'

-- Drop old policies that reference 'owner'
DROP POLICY IF EXISTS "Owners and admins can create team assets" ON team_assets;
DROP POLICY IF EXISTS "Owners and admins can delete team assets" ON team_assets;
DROP POLICY IF EXISTS "Owners and admins can update team assets" ON team_assets;
DROP POLICY IF EXISTS "Owners, offer owners and admins can create team assets" ON team_assets;
DROP POLICY IF EXISTS "Owners, offer owners and admins can delete team assets" ON team_assets;
DROP POLICY IF EXISTS "Owners, offer owners and admins can update team assets" ON team_assets;
DROP POLICY IF EXISTS "Owners and admins can assign appointments" ON appointments;
DROP POLICY IF EXISTS "Owners and admins can delete appointments" ON appointments;
DROP POLICY IF EXISTS "Team owners and offer owners can update teams" ON teams;
DROP POLICY IF EXISTS "Team owners can delete their teams" ON teams;
DROP POLICY IF EXISTS "Team owners can create invitations" ON team_invitations;
DROP POLICY IF EXISTS "Team owners can delete invitations" ON team_invitations;
DROP POLICY IF EXISTS "Team owners can delete members" ON team_members;
DROP POLICY IF EXISTS "Team owners can update members" ON team_members;
DROP POLICY IF EXISTS "Users can add themselves or owners can add members" ON team_members;
DROP POLICY IF EXISTS "Offer owners can manage templates" ON asset_field_templates;
DROP POLICY IF EXISTS "Offer owners and admins can create client assets" ON client_assets;
DROP POLICY IF EXISTS "Offer owners and admins can delete client assets" ON client_assets;
DROP POLICY IF EXISTS "Offer owners and admins can update client assets" ON client_assets;
DROP POLICY IF EXISTS "Offer owners and admins can view client assets" ON client_assets;
DROP POLICY IF EXISTS "Team owners and admins can view audit logs" ON webhook_audit_logs;

-- Recreate policies with 'admin' instead of 'owner'

-- team_assets policies
CREATE POLICY "Admins and offer owners can create team assets"
ON team_assets FOR INSERT
WITH CHECK (
  is_team_member(auth.uid(), team_id) AND 
  (has_team_role(auth.uid(), team_id, 'admin'::text) OR 
   has_team_role(auth.uid(), team_id, 'offer_owner'::text))
);

CREATE POLICY "Admins and offer owners can update team assets"
ON team_assets FOR UPDATE
USING (
  is_team_member(auth.uid(), team_id) AND 
  (has_team_role(auth.uid(), team_id, 'admin'::text) OR 
   has_team_role(auth.uid(), team_id, 'offer_owner'::text))
);

CREATE POLICY "Admins and offer owners can delete team assets"
ON team_assets FOR DELETE
USING (
  is_team_member(auth.uid(), team_id) AND 
  (has_team_role(auth.uid(), team_id, 'admin'::text) OR 
   has_team_role(auth.uid(), team_id, 'offer_owner'::text))
);

-- appointments policies
CREATE POLICY "Admins can assign appointments"
ON appointments FOR UPDATE
USING (
  is_team_member(auth.uid(), team_id) AND 
  has_team_role(auth.uid(), team_id, 'admin'::text)
)
WITH CHECK (
  is_team_member(auth.uid(), team_id) AND 
  has_team_role(auth.uid(), team_id, 'admin'::text)
);

CREATE POLICY "Admins can delete appointments"
ON appointments FOR DELETE
USING (
  is_team_member(auth.uid(), team_id) AND 
  has_team_role(auth.uid(), team_id, 'admin'::text)
);

-- teams policies
CREATE POLICY "Admins and offer owners can update teams"
ON teams FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = teams.id
    AND team_members.user_id = auth.uid()
    AND team_members.role IN ('admin', 'offer_owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = teams.id
    AND team_members.user_id = auth.uid()
    AND team_members.role IN ('admin', 'offer_owner')
  )
);

CREATE POLICY "Admins can delete their teams"
ON teams FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = teams.id
    AND team_members.user_id = auth.uid()
    AND team_members.role = 'admin'
  ) OR created_by = auth.uid()
);

-- team_invitations policies
CREATE POLICY "Admins can create invitations"
ON team_invitations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = team_invitations.team_id
    AND team_members.user_id = auth.uid()
    AND team_members.role = 'admin'
  )
);

CREATE POLICY "Admins can delete invitations"
ON team_invitations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = team_invitations.team_id
    AND team_members.user_id = auth.uid()
    AND team_members.role = 'admin'
  )
);

-- team_members policies
CREATE POLICY "Admins can delete members"
ON team_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = team_members.team_id
    AND tm.user_id = auth.uid()
    AND tm.role = 'admin'
  )
);

CREATE POLICY "Admins can update members"
ON team_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = team_members.team_id
    AND tm.user_id = auth.uid()
    AND tm.role = 'admin'
  )
);

CREATE POLICY "Users can add themselves or admins can add members"
ON team_members FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = team_members.team_id
    AND tm.user_id = auth.uid()
    AND tm.role = 'admin'
  ) OR
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_members.team_id
    AND teams.created_by = auth.uid()
  )
);

-- asset_field_templates policies
CREATE POLICY "Offer owners and admins can manage templates"
ON asset_field_templates FOR ALL
USING (
  team_id IS NULL OR (
    is_team_member(auth.uid(), team_id) AND 
    (has_team_role(auth.uid(), team_id, 'offer_owner'::text) OR 
     has_team_role(auth.uid(), team_id, 'admin'::text))
  )
);

-- client_assets policies
CREATE POLICY "Offer owners and admins can create client assets"
ON client_assets FOR INSERT
WITH CHECK (
  team_id IS NULL OR (
    is_team_member(auth.uid(), team_id) AND 
    (has_team_role(auth.uid(), team_id, 'offer_owner'::text) OR 
     has_team_role(auth.uid(), team_id, 'admin'::text))
  )
);

CREATE POLICY "Offer owners and admins can update client assets"
ON client_assets FOR UPDATE
USING (
  is_team_member(auth.uid(), team_id) AND 
  (has_team_role(auth.uid(), team_id, 'offer_owner'::text) OR 
   has_team_role(auth.uid(), team_id, 'admin'::text))
);

CREATE POLICY "Offer owners and admins can delete client assets"
ON client_assets FOR DELETE
USING (
  created_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.user_id = auth.uid()
    AND team_members.role IN ('offer_owner', 'admin')
  )
);

CREATE POLICY "Offer owners and admins can view client assets"
ON client_assets FOR SELECT
USING (
  is_team_member(auth.uid(), team_id) AND 
  (has_team_role(auth.uid(), team_id, 'offer_owner'::text) OR 
   has_team_role(auth.uid(), team_id, 'admin'::text))
);

-- client_asset_fields policies (update existing ones that reference owner)
DROP POLICY IF EXISTS "Authorized users can delete fields" ON client_asset_fields;
DROP POLICY IF EXISTS "Authorized users can modify fields" ON client_asset_fields;
DROP POLICY IF EXISTS "Authorized users can view fields" ON client_asset_fields;
DROP POLICY IF EXISTS "Users can create fields for new client assets" ON client_asset_fields;

CREATE POLICY "Authorized users can view fields"
ON client_asset_fields FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM client_assets ca
    WHERE ca.id = client_asset_fields.client_asset_id
    AND is_team_member(auth.uid(), ca.team_id)
    AND (has_team_role(auth.uid(), ca.team_id, 'offer_owner'::text) OR 
         has_team_role(auth.uid(), ca.team_id, 'admin'::text))
  )
);

CREATE POLICY "Authorized users can modify fields"
ON client_asset_fields FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM client_assets ca
    WHERE ca.id = client_asset_fields.client_asset_id
    AND is_team_member(auth.uid(), ca.team_id)
    AND (has_team_role(auth.uid(), ca.team_id, 'offer_owner'::text) OR 
         has_team_role(auth.uid(), ca.team_id, 'admin'::text))
  )
);

CREATE POLICY "Authorized users can delete fields"
ON client_asset_fields FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM client_assets ca
    WHERE ca.id = client_asset_fields.client_asset_id
    AND is_team_member(auth.uid(), ca.team_id)
    AND (has_team_role(auth.uid(), ca.team_id, 'offer_owner'::text) OR 
         has_team_role(auth.uid(), ca.team_id, 'admin'::text))
  )
);

CREATE POLICY "Users can create fields for new client assets"
ON client_asset_fields FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM client_assets ca
    WHERE ca.id = client_asset_fields.client_asset_id
    AND ca.team_id IS NULL
  ) OR EXISTS (
    SELECT 1 FROM client_assets ca
    WHERE ca.id = client_asset_fields.client_asset_id
    AND is_team_member(auth.uid(), ca.team_id)
    AND (has_team_role(auth.uid(), ca.team_id, 'offer_owner'::text) OR 
         has_team_role(auth.uid(), ca.team_id, 'admin'::text))
  )
);

-- client_asset_audit_logs policies
DROP POLICY IF EXISTS "Admins can view audit logs" ON client_asset_audit_logs;

CREATE POLICY "Admins and offer owners can view audit logs"
ON client_asset_audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM client_assets ca
    WHERE ca.id = client_asset_audit_logs.client_asset_id
    AND is_team_member(auth.uid(), ca.team_id)
    AND (has_team_role(auth.uid(), ca.team_id, 'offer_owner'::text) OR 
         has_team_role(auth.uid(), ca.team_id, 'admin'::text))
  )
);

-- client_asset_files policies
DROP POLICY IF EXISTS "Authorized users can delete asset files" ON client_asset_files;
DROP POLICY IF EXISTS "Authorized users can manage files" ON client_asset_files;

CREATE POLICY "Authorized users can manage files"
ON client_asset_files FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM client_assets ca
    WHERE ca.id = client_asset_files.client_asset_id
    AND is_team_member(auth.uid(), ca.team_id)
    AND (has_team_role(auth.uid(), ca.team_id, 'offer_owner'::text) OR 
         has_team_role(auth.uid(), ca.team_id, 'admin'::text))
  )
);

CREATE POLICY "Authorized users can delete asset files"
ON client_asset_files FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM client_assets ca
    WHERE ca.id = client_asset_files.client_asset_id
    AND is_team_member(auth.uid(), ca.team_id)
    AND (has_team_role(auth.uid(), ca.team_id, 'offer_owner'::text) OR 
         has_team_role(auth.uid(), ca.team_id, 'admin'::text))
  )
);

-- webhook_audit_logs policies
CREATE POLICY "Admins can view audit logs"
ON webhook_audit_logs FOR SELECT
USING (
  is_team_member(auth.uid(), team_id) AND 
  has_team_role(auth.uid(), team_id, 'admin'::text)
);

-- Update is_team_owner function to check for admin instead
DROP FUNCTION IF EXISTS is_team_owner(uuid, uuid);
CREATE OR REPLACE FUNCTION public.is_team_admin(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_members.team_id = _team_id
      AND team_members.user_id = _user_id
      AND team_members.role = 'admin'
  )
$$;