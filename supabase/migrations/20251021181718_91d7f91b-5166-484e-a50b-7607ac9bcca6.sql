-- Update RLS policy to allow creating client assets without a team
DROP POLICY IF EXISTS "Offer owners and admins can create client assets" ON client_assets;

CREATE POLICY "Offer owners and admins can create client assets"
ON client_assets
FOR INSERT
WITH CHECK (
  -- Allow creation without team (will be assigned during onboarding)
  team_id IS NULL
  OR
  -- Or require team membership with appropriate role
  (is_team_member(auth.uid(), team_id) 
   AND (has_team_role(auth.uid(), team_id, 'offer_owner') 
        OR has_team_role(auth.uid(), team_id, 'admin') 
        OR has_team_role(auth.uid(), team_id, 'owner')))
);