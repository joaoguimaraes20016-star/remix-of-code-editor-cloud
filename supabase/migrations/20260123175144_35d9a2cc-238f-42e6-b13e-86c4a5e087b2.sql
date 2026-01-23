-- Create a secure view for team integrations that masks sensitive tokens
CREATE OR REPLACE VIEW public.team_integrations_public
WITH (security_invoker = on)
AS
SELECT
  ti.id,
  ti.team_id,
  ti.integration_type,
  ti.is_connected,
  ti.connected_at,
  ti.created_at,
  ti.updated_at,
  -- Build config_safe by extracting only non-sensitive fields
  jsonb_build_object(
    'email', ti.config->>'email',
    'name', ti.config->>'name',
    'connected_at', ti.config->>'connected_at',
    'workspace_name', ti.config->>'workspace_name',
    'team_name', ti.config->>'team_name',
    'channel_name', ti.config->>'channel_name',
    'scope', ti.config->>'scope'
  ) AS config_safe
FROM public.team_integrations ti;

-- Grant SELECT to authenticated users (RLS on base table will apply)
GRANT SELECT ON public.team_integrations_public TO authenticated;