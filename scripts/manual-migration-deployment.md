# Manual Migration Deployment Guide

## Steps to Deploy Account/Subaccount Migrations

### 1. Open Supabase Dashboard
- Go to your Supabase project dashboard
- Navigate to **SQL Editor**

### 2. Run Migrations in Order

Run each migration file **one at a time** in this exact order:

#### Migration 1: Add Column and Constraints
**File:** `20260204211735_da8614f0-8ef4-426c-9917-7e2c1fd0d4b2.sql`

This migration:
- Adds `parent_account_id` column to `teams` table
- Creates constraint to prevent nested subaccounts
- Creates `can_access_workspace()` function
- Creates index for performance

**After running:** Check for errors. If successful, proceed to Migration 2.

#### Migration 2: Update RLS Policies
**File:** `20260204211736_b18e49a9-4105-4143-8958-fc660e2d93f5.sql`

This migration:
- Updates RLS policies on `funnel_leads`, `funnels`, `contacts`, `appointments`, `clients`
- Allows parent account access to subaccount data

**After running:** Check for errors. If successful, proceed to Migration 3.

#### Migration 3: Set Existing Teams as Main Accounts
**File:** `20260204211737_92e7d6b3-3d2e-491d-9ea8-f8a41cd5339b.sql`

This migration:
- Ensures all existing teams have `parent_account_id = NULL` (main accounts)

**After running:** Check for errors. If successful, you're done!

### 3. Verify Deployment

Run this verification query in SQL Editor:

```sql
-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'teams' 
  AND column_name = 'parent_account_id';

-- Check if function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'can_access_workspace';

-- Check teams status
SELECT 
  COUNT(*) as total_teams,
  COUNT(CASE WHEN parent_account_id IS NULL THEN 1 END) as main_accounts,
  COUNT(CASE WHEN parent_account_id IS NOT NULL THEN 1 END) as subaccounts
FROM teams;
```

**Expected Results:**
- Column should exist (UUID type, nullable)
- Function should exist
- All teams should be main accounts (subaccounts = 0)

### 4. Update Migration History (Optional but Recommended)

After manually running migrations, you may want to mark them as applied in Supabase's migration history:

```bash
supabase migration repair --status applied 20260204211735_da8614f0-8ef4-426c-9917-7e2c1fd0d4b2
supabase migration repair --status applied 20260204211736_b18e49a9-4105-4143-8958-fc660e2d93f5
supabase migration repair --status applied 20260204211737_92e7d6b3-3d2e-491d-9ea8-f8a41cd5339b
```

### Troubleshooting

- **If you get "column already exists" error:** The migration was already partially applied. Skip that part and continue.
- **If you get RLS policy errors:** Some tables might not exist. The migration handles this with `IF EXISTS` checks, so it should be safe.
- **After deployment:** Refresh your app - the subaccount features should now be enabled!
