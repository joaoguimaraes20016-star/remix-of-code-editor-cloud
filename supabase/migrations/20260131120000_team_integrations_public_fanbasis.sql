-- Extend team_integrations_public config_safe to include Fanbasis-safe fields (creator_id, creator_name)
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
  jsonb_build_object(
    'email', ti.config->>'email',
    'name', ti.config->>'name',
    'connected_at', ti.config->>'connected_at',
    'workspace_name', ti.config->>'workspace_name',
    'team_name', ti.config->>'team_name',
    'channel_name', ti.config->>'channel_name',
    'scope', ti.config->>'scope',
    'creator_id', ti.config->>'creator_id',
    'creator_name', ti.config->>'creator_name'
  ) AS config_safe
FROM public.team_integrations ti;
