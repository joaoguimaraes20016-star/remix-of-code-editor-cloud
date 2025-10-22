-- Allow all team members to upload to team-assets bucket
CREATE POLICY "Team members can upload team assets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'team-assets' AND
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.team_id::text = (storage.foldername(name))[1]
  )
);

-- Allow all team members to view team assets
CREATE POLICY "Team members can view team assets"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'team-assets' AND
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.team_id::text = (storage.foldername(name))[1]
  )
);

-- Allow team members to delete their own uploads or admins/owners to delete any
CREATE POLICY "Team members can delete team assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'team-assets' AND
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.team_id::text = (storage.foldername(name))[1]
    AND (
      auth.uid() = owner OR
      tm.role IN ('owner', 'admin', 'offer_owner')
    )
  )
);