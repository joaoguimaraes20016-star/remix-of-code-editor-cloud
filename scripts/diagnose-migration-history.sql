-- =====================================================
-- DIAGNOSE MIGRATION HISTORY FOR CORRECT PROJECT
-- Run this FIRST in Supabase SQL Editor: 
-- https://supabase.com/dashboard/project/kqfyevdblvgxaycdvfxe/sql/new
-- =====================================================
-- This script will show you the current state of your migration history
-- so we can determine what needs to be fixed.

-- 1. Count total migrations
SELECT COUNT(*) as total_migrations FROM supabase_migrations.schema_migrations;

-- 2. Count UUID migrations (format: timestamp_uuid)
SELECT COUNT(*) as uuid_migrations_count
FROM supabase_migrations.schema_migrations 
WHERE version LIKE '%_%' AND version ~ '^[0-9]{14}_';

-- 3. Count timestamp-only migrations (format: timestamp)
SELECT COUNT(*) as timestamp_only_count
FROM supabase_migrations.schema_migrations 
WHERE version ~ '^[0-9]{14}$';

-- 4. Find potential duplicates (same timestamp, different formats)
SELECT 
  SUBSTRING(version FROM 1 FOR 14) as timestamp_part,
  COUNT(*) as count,
  array_agg(version ORDER BY version) as versions
FROM supabase_migrations.schema_migrations 
WHERE version LIKE '202510%' OR version LIKE '202511%' OR version LIKE '202512%' OR version LIKE '202601%'
GROUP BY SUBSTRING(version FROM 1 FOR 14)
HAVING COUNT(*) > 1
ORDER BY timestamp_part
LIMIT 50;

-- 5. Show recent migrations (last 20)
SELECT version, name 
FROM supabase_migrations.schema_migrations 
ORDER BY version DESC
LIMIT 20;

-- 6. Check for UUID migrations that might be causing issues
SELECT version
FROM supabase_migrations.schema_migrations 
WHERE version LIKE '202510%_%'
ORDER BY version
LIMIT 20;
