-- Check if the three account/subaccount migrations are already applied
SELECT 
  version,
  name,
  inserted_at
FROM supabase_migrations.schema_migrations
WHERE version IN (
  '20260204211735_da8614f0-8ef4-426c-9917-7e2c1fd0d4b2',
  '20260204211736_b18e49a9-4105-4143-8958-fc660e2d93f5',
  '20260204211737_92e7d6b3-3d2e-491d-9ea8-f8a41cd5339b'
)
ORDER BY inserted_at;

-- Also check if parent_account_id column exists (confirms migration 1 was applied)
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'teams' 
  AND column_name = 'parent_account_id';
