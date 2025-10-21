-- Allow users to view their own client assets by email
CREATE POLICY "Users can view their own client assets by email"
ON client_assets
FOR SELECT
USING (
  client_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);