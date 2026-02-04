-- =====================================================
-- DELETE ALL UUID MIGRATIONS FROM HISTORY TABLE
-- Run this in Supabase SQL Editor: 
-- https://supabase.com/dashboard/project/kqfyevdblvgxaycdvfxe/sql/new
-- =====================================================
-- These migrations are already applied to the database schema.
-- The CLI can't match UUID migrations to local files, so we'll remove
-- them from the history table. The schema changes remain intact.

-- Delete all UUID-based migrations (format: timestamp_uuid)
DELETE FROM supabase_migrations.schema_migrations
WHERE version LIKE '202510%_%'
   OR version LIKE '202511%_%'
   OR version LIKE '202512%_%'
   OR version LIKE '202601%_%';

-- Verify: Check what's left
SELECT COUNT(*) as remaining_migrations 
FROM supabase_migrations.schema_migrations;

-- Show remaining migrations (should be timestamp-only ones)
SELECT version 
FROM supabase_migrations.schema_migrations 
ORDER BY version DESC
LIMIT 20;
