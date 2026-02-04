-- =====================================================
-- FIX TIMESTAMP-ONLY MIGRATIONS TO MATCH LOCAL UUID FILES
-- Run this in Supabase SQL Editor: 
-- https://supabase.com/dashboard/project/kqfyevdblvgxaycdvfxe/sql/new
-- =====================================================
-- Problem: Remote database has timestamp-only entries (e.g., "20251021172545")
-- but local files have UUID format (e.g., "20251021172545_73a121ce-...")
-- This script updates the remote entries to match local files.

-- Update timestamp-only entries to their UUID counterparts
UPDATE supabase_migrations.schema_migrations 
SET version = '20251021172545_73a121ce-26bd-46c6-984d-94dbcaeb8fd9'
WHERE version = '20251021172545';

UPDATE supabase_migrations.schema_migrations 
SET version = '20251021172625_63f0860e-9a5d-4c06-a95b-05f5509b9320'
WHERE version = '20251021172625';

UPDATE supabase_migrations.schema_migrations 
SET version = '20251021173110_6c20350d-ff5e-44ea-ba7b-d04d01d234bc'
WHERE version = '20251021173110';

UPDATE supabase_migrations.schema_migrations 
SET version = '20251021173129_3840db76-6ceb-40b5-9afae-35aa514e1ba4'
WHERE version = '20251021173129';

UPDATE supabase_migrations.schema_migrations 
SET version = '20251021175338_c96d42b9-c73d-4813-8bbd-dfc6a362a8f4'
WHERE version = '20251021175338';

-- Verify: Check if any timestamp-only entries remain
SELECT version 
FROM supabase_migrations.schema_migrations 
WHERE version ~ '^202510[0-9]{8}$'
ORDER BY version;
