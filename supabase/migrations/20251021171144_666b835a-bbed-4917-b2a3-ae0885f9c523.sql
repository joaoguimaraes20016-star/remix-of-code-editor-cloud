-- Allow public access to client_assets by valid token
CREATE POLICY "Public can view client assets with valid token"
ON public.client_assets
FOR SELECT
USING (
  access_token IS NOT NULL 
  AND token_expires_at > now()
);

-- Allow public updates to client assets with valid token
CREATE POLICY "Public can update client assets with valid token"
ON public.client_assets
FOR UPDATE
USING (
  access_token IS NOT NULL 
  AND token_expires_at > now()
);

-- Allow public access to client_asset_fields via token
CREATE POLICY "Public can view fields with valid token"
ON public.client_asset_fields
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM client_assets ca
    WHERE ca.id = client_asset_fields.client_asset_id
    AND ca.access_token IS NOT NULL
    AND ca.token_expires_at > now()
  )
);

-- Allow public updates to client_asset_fields via token
CREATE POLICY "Public can update fields with valid token"
ON public.client_asset_fields
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM client_assets ca
    WHERE ca.id = client_asset_fields.client_asset_id
    AND ca.access_token IS NOT NULL
    AND ca.token_expires_at > now()
  )
);

-- Allow public file uploads via token
CREATE POLICY "Public can manage files with valid token"
ON public.client_asset_files
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM client_assets ca
    WHERE ca.id = client_asset_files.client_asset_id
    AND ca.access_token IS NOT NULL
    AND ca.token_expires_at > now()
  )
);

-- Allow public audit log creation
CREATE POLICY "Public can create audit logs with valid token"
ON public.client_asset_audit_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM client_assets ca
    WHERE ca.id = client_asset_audit_logs.client_asset_id
    AND ca.access_token IS NOT NULL
    AND ca.token_expires_at > now()
  )
);