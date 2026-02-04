-- =====================================================
-- REMOVE TIMESTAMP-ONLY DUPLICATES FOR UUID MIGRATIONS
-- Run this in Supabase SQL Editor: 
-- https://supabase.com/dashboard/project/kqfyevdblvgxaycdvfxe/sql/new
-- =====================================================
-- Problem: We repaired migrations using just timestamps (e.g., "20251015234728")
-- but the actual files have UUIDs (e.g., "20251015234728_beb572c9-...")
-- This created duplicate entries. We need to delete the timestamp-only ones
-- and keep only the UUID format entries (which match the actual files).

-- Step 1: Check for duplicates
SELECT 
  SUBSTRING(version FROM 1 FOR 14) as timestamp_part,
  COUNT(*) as count,
  array_agg(version) as versions
FROM supabase_migrations.schema_migrations 
WHERE version LIKE '202510%'
GROUP BY SUBSTRING(version FROM 1 FOR 14)
HAVING COUNT(*) > 1
ORDER BY timestamp_part;

-- Step 2: Delete timestamp-only entries that have UUID counterparts
-- This keeps the UUID format entries (which match local files) and removes timestamp-only duplicates
DELETE FROM supabase_migrations.schema_migrations
WHERE version ~ '^202510[0-9]{8}$'  -- Matches timestamp-only format (14 digits)
AND EXISTS (
  SELECT 1 FROM supabase_migrations.schema_migrations s2
  WHERE SUBSTRING(s2.version FROM 1 FOR 14) = version
  AND s2.version LIKE '%_%'  -- Has UUID part
);

-- Step 3: Verify cleanup
SELECT COUNT(*) as remaining_timestamp_only
FROM supabase_migrations.schema_migrations 
WHERE version ~ '^202510[0-9]{8}$';

-- Step 4: Check UUID migrations are still there
SELECT COUNT(*) as uuid_migrations_count
FROM supabase_migrations.schema_migrations 
WHERE version LIKE '202510%_%';
