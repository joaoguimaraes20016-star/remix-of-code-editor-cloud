-- =====================================================
-- ENSURE UUID MIGRATIONS ARE MARKED AS APPLIED
-- Run this in Supabase SQL Editor: 
-- https://supabase.com/dashboard/project/kqfyevdblvgxaycdvfxe/sql/new
-- =====================================================
-- Since all these UUID migrations exist locally, we need to ensure
-- they're properly recorded in the migration history table.
-- Supabase CLI can't parse UUID format, so we use SQL directly.

-- First, let's see what's currently in the migration history
-- Uncomment to check:
-- SELECT version, name FROM supabase_migrations.schema_migrations 
-- WHERE version LIKE '202510%_%' ORDER BY version;

-- The issue: Supabase CLI expects migrations to be stored by their timestamp
-- but UUID migrations are stored with the full UUID format.
-- Since all these files exist locally, they should be marked as applied.

-- Actually, if the migrations are already in schema_migrations table,
-- they're already applied. The issue is that Supabase CLI can't match them.

-- The real solution: Since Supabase CLI can't handle UUID migrations,
-- and these files all exist locally, we should just ensure they're in the table.
-- But they probably already are.

-- Let's check if there are any missing entries:
-- (This is informational - don't run unless you know what you're doing)

-- If migrations are missing from schema_migrations, insert them:
-- INSERT INTO supabase_migrations.schema_migrations (version, name)
-- VALUES 
--   ('20251015234728_beb572c9-c1b0-439c-a172-c0a260129671', '20251015234728_beb572c9-c1b0-439c-a172-c0a260129671'),
--   ... etc
-- ON CONFLICT (version) DO NOTHING;

-- Actually, the better approach: Since Supabase CLI can't parse these,
-- and they all exist locally, the issue might be that Supabase is looking
-- for them by timestamp only. Let's check what format they're stored in:

SELECT 
  version,
  CASE 
    WHEN version LIKE '%_%' THEN 'Has UUID'
    ELSE 'Timestamp only'
  END as format_type
FROM supabase_migrations.schema_migrations 
WHERE version LIKE '202510%'
ORDER BY version
LIMIT 50;

-- If you see entries with just timestamps (like '20251015234728') AND
-- entries with UUIDs (like '20251015234728_beb572c9-...'), that's the problem!
-- We need to delete the timestamp-only duplicates.
