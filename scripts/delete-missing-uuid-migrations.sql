-- =====================================================
-- DELETE MISSING UUID MIGRATIONS FROM HISTORY
-- Run this in Supabase SQL Editor: 
-- https://supabase.com/dashboard/project/kqfyevdblvgxaycdvfxe/sql/new
-- =====================================================
-- This deletes migration history entries for UUID migrations that don't exist locally
-- The ones that DO exist locally will be kept and can be re-applied if needed

-- List of UUID migrations that DON'T exist locally (based on error message)
DELETE FROM supabase_migrations.schema_migrations
WHERE version IN (
  '20251015235422_534169cc-d3cd-4262-878d-aab4949dfc4e',
  '20251016001521_c85ec6b6-87f3-47f3-8dd8-c85e55276d02',
  '20251016004345_4ed50adb-1d9d-4dbd-8028-a6d629baafae',
  '20251016015857_03794fe3-2afc-4496-ba38-fd93623e0422',
  '20251016020332_0ac69cca-2098-45f9-a43d-1c6322f7b7ea',
  '20251016025401_f20d4817-2270-4091-a5fc-b37fd0dc3cf9',
  '20251016025800_ba6a2e71-6351-4c44-85ca-6f2f1f6b0225',
  '20251016025857_1631075d-b8c5-4c40-bde7-a79ebe83cb2f',
  '20251016135223_ef397582-4299-45e2-ab0e-d2542132a5e0',
  '20251016164408_d2704562-8548-40bf-9155-ef6409621b1d',
  '20251016233518_5dc86d6f-fae5-4771-bbea-8a9a416a86c1',
  '20251017013713_784eaf79-06f5-40e0-9db6-7f5a2b0d8acd',
  '20251017173724_a3387a36-4bca-4056-8e92-095539e68c05',
  '20251017183911_30b59d1f-7e6d-44dd-8ede-a53b3911da2d',
  '20251018224743_1e8f6a2e-2cf1-4c9a-b3f4-70b43b0e7e15',
  '20251018232633_ef1705ab-f392-43b9-8b6d-55249e0b3213',
  '20251018232933_949389f0-8992-478a-b4ba-b55d15438445',
  '20251018233113_56e5bbed-808f-4c6d-bf4c-91a59c0247b5',
  '20251018233319_b21ae511-7e78-49b5-b661-9031e7e61e31',
  '20251019001439_669e1c5f-29db-4180-9ed2-39ba1392e321',
  '20251019013045_39eec767-3456-4470-937e-807f4e140402',
  '20251019140115_832e1d8d-5506-4233-a19e-81b92ec419bc',
  '20251019203518_e234ff35-33c9-46a9-b337-408a9f76c47d',
  '20251019223945_21c90ded-19f3-4f69-8399-8c634354e20b',
  '20251020160737_2d98530e-c241-4f09-b678-0cbc2cd0b049',
  '20251020164847_f41a4974-ec7b-4a30-b0db-ff27c7c1f604',
  '20251021164337_c6dee4b3-3e75-4568-97d4-e28dfa2e0b62',
  '20251021171144_666b835a-bbed-4917-b2a3-ae0885f9c523'
);

-- Verify: Check how many UUID migrations remain
SELECT version, name 
FROM supabase_migrations.schema_migrations 
WHERE version LIKE '202510%_%'
ORDER BY version;
