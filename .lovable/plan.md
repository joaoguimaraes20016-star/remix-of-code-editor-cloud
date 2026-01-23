
# Fix Discord OAuth - Add Missing Database Columns

## Problem
The `discord-oauth-start` edge function is failing with a 500 error because it's trying to store `oauth_state` and `redirect_uri` columns that don't exist in the `team_integrations` table.

## Solution
Add the two missing columns to the `team_integrations` table via a database migration.

## Database Migration

```sql
ALTER TABLE public.team_integrations 
ADD COLUMN IF NOT EXISTS oauth_state TEXT,
ADD COLUMN IF NOT EXISTS redirect_uri TEXT;
```

## Column Details

| Column | Type | Purpose |
|--------|------|---------|
| `oauth_state` | TEXT | Stores the CSRF token generated during OAuth start, validated on callback |
| `redirect_uri` | TEXT | Stores the origin URL to redirect users back after OAuth completes |

## Impact
- No existing data is affected (new columns are nullable)
- Discord OAuth flow will work immediately after migration
- No code changes needed - the edge function already expects these columns

## After This Fix
Once the columns are added, clicking "Connect with Discord" will:
1. Store the state token in the database
2. Redirect to Discord's authorization page
3. On callback, validate the state and complete the connection
