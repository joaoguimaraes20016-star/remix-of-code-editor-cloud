-- =====================================================
-- CHECK CURRENT MIGRATION STATUS
-- Run this in Supabase SQL Editor: 
-- https://supabase.com/dashboard/project/kqfyevdblvgxaycdvfxe/sql/new
-- =====================================================
-- Check what migrations are currently in the history table

SELECT COUNT(*) as total_migrations FROM supabase_migrations.schema_migrations;

-- Show first 20 migrations
SELECT version 
FROM supabase_migrations.schema_migrations 
ORDER BY version
LIMIT 20;

-- Show last 20 migrations
SELECT version 
FROM supabase_migrations.schema_migrations 
ORDER BY version DESC
LIMIT 20;
