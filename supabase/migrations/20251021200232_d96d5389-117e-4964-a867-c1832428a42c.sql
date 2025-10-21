-- Update client_assets deletion policy to allow creators and growth operators to delete
DROP POLICY IF EXISTS "Offer owners and admins can delete client assets" ON client_assets;

CREATE POLICY "Offer owners and admins can delete client assets"
ON client_assets
FOR DELETE
USING (
  -- Allow if user created the asset
  (created_by = auth.uid())
  OR
  -- Allow if user is an offer_owner, admin, or owner in ANY team
  (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND role IN ('offer_owner', 'admin', 'owner')
    )
  )
);