-- =====================================================
-- FIND MIGRATIONS IN REMOTE THAT DON'T MATCH LOCAL FILES
-- Run this in Supabase SQL Editor: 
-- https://supabase.com/dashboard/project/kqfyevdblvgxaycdvfxe/sql/new
-- =====================================================
-- Check for migrations that might not have corresponding local files

-- Show all migrations that don't follow the standard UUID format
-- (these might be the ones causing issues)
SELECT version 
FROM supabase_migrations.schema_migrations 
WHERE version NOT LIKE '%_%'  -- No underscore (timestamp-only)
   OR version LIKE '% %'      -- Has spaces
   OR version NOT LIKE '202%' -- Doesn't start with 202
ORDER BY version;

-- Also check the last few migrations
SELECT version 
FROM supabase_migrations.schema_migrations 
ORDER BY version DESC
LIMIT 10;
