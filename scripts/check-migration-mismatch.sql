-- =====================================================
-- CHECK MIGRATION MISMATCH
-- Run this in Supabase SQL Editor: 
-- https://supabase.com/dashboard/project/kqfyevdblvgxaycdvfxe/sql/new
-- =====================================================
-- This shows what migrations are in the remote database history

-- Show all UUID migrations in the history
SELECT version 
FROM supabase_migrations.schema_migrations 
WHERE version LIKE '202510%'
ORDER BY version
LIMIT 60;
