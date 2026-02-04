-- =====================================================
-- FIND BAD MIGRATION ENTRIES
-- Run this in Supabase SQL Editor: 
-- https://supabase.com/dashboard/project/kqfyevdblvgxaycdvfxe/sql/new
-- =====================================================
-- Check for any weird entries that might be causing issues

-- Find entries that don't match normal migration format
SELECT version, name
FROM supabase_migrations.schema_migrations 
WHERE version NOT LIKE '202%'
   OR version LIKE '% %'  -- Has spaces
   OR version LIKE 'some_file%'
   OR LENGTH(version) < 10
ORDER BY version;

-- Count total migrations
SELECT COUNT(*) as total_migrations FROM supabase_migrations.schema_migrations;

-- Show the last 10 migrations
SELECT version, name 
FROM supabase_migrations.schema_migrations 
ORDER BY version DESC
LIMIT 10;
