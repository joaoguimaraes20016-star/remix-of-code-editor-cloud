-- =====================================================
-- MARK ALL UUID MIGRATIONS AS REVERTED
-- Run this in Supabase SQL Editor: 
-- https://supabase.com/dashboard/project/kqfyevdblvgxaycdvfxe/sql/new
-- =====================================================
-- Since these migrations are already applied to the database schema,
-- but the CLI can't match them to local files, we'll delete them from
-- the migration history. The schema changes are already there, so
-- this just syncs the history.

-- Delete all UUID migrations from history (they're already applied to schema)
DELETE FROM supabase_migrations.schema_migrations
WHERE version LIKE '202510%_%';

-- Verify: Check what's left
SELECT COUNT(*) as remaining_migrations 
FROM supabase_migrations.schema_migrations;

-- Show remaining migrations
SELECT version 
FROM supabase_migrations.schema_migrations 
ORDER BY version DESC
LIMIT 20;
