-- Quick check: Does parent_account_id column exist?
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'teams' 
        AND column_name = 'parent_account_id'
    ) THEN 'Column EXISTS - Migrations already applied! ✅'
    ELSE 'Column DOES NOT EXIST - Need to apply migrations ❌'
  END as migration_status;
