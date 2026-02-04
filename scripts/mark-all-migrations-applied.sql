-- =====================================================
-- MARK ALL LOCAL MIGRATIONS AS APPLIED
-- Run this in Supabase SQL Editor: 
-- https://supabase.com/dashboard/project/kqfyevdblvgxaycdvfxe/sql/new
-- =====================================================
-- Since all these migrations are already applied to the database schema,
-- we need to insert them into the migration history table so the CLI knows
-- they've been applied.

-- Insert all UUID migrations back into history (they're already applied)
-- This is a simplified version - you may need to generate the full list
-- Run this query first to see what's missing:

SELECT 
  'INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES (''' || 
  REPLACE(filename, '.sql', '') || ''', ''' || 
  REPLACE(filename, '.sql', '') || ''');' as insert_statement
FROM (
  SELECT unnest(string_to_array(
    '20251015234728_beb572c9-c1b0-439c-a172-c0a260129671.sql,20251015234821_fdeb02fb-98b6-42c8-93f0-64d98974ae06.sql,20251015235145_19ca6b16-bfbd-4f61-9ed6-991fe6264ad0.sql',
    ','
  )) as filename
) t;

-- Actually, a better approach: Use a script to generate all INSERT statements
-- Or manually insert them in batches

-- For now, let's insert them using a simpler method:
-- Copy all migration filenames from your local directory and insert them
