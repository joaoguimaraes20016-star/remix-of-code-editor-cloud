-- Migrate existing google_sheets integrations to unified google type with enabled_features
UPDATE team_integrations
SET 
  integration_type = 'google',
  config = config || jsonb_build_object(
    'granted_scopes', ARRAY[
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/spreadsheets'
    ]::text[],
    'enabled_features', jsonb_build_object(
      'sheets', true,
      'calendar', false,
      'drive', false
    )
  )
WHERE integration_type = 'google_sheets';