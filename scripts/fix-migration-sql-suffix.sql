-- =====================================================
-- FIX MIGRATION HISTORY: REMOVE .sql SUFFIX
-- Run this in Supabase SQL Editor: 
-- https://supabase.com/dashboard/project/kqfyevdblvgxaycdvfxe/sql/new
-- =====================================================
-- Problem: Migration entries are stored with .sql suffix
-- but Supabase CLI expects them without .sql
-- This script removes the .sql suffix from all entries.

-- Step 1: Preview what will be changed
SELECT 
  version as current_version,
  REPLACE(version, '.sql', '') as new_version
FROM supabase_migrations.schema_migrations 
WHERE version LIKE '%.sql'
LIMIT 20;

-- Step 2: Update all entries to remove .sql suffix
UPDATE supabase_migrations.schema_migrations 
SET version = REPLACE(version, '.sql', '')
WHERE version LIKE '%.sql';

-- Step 3: Verify the fix
SELECT COUNT(*) as remaining_with_sql_suffix
FROM supabase_migrations.schema_migrations 
WHERE version LIKE '%.sql';

-- Step 4: Show some updated entries
SELECT version 
FROM supabase_migrations.schema_migrations 
WHERE version LIKE '202510%'
ORDER BY version
LIMIT 20;
