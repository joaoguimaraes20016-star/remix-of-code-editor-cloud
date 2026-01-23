
# Fix Discord OAuth Callback - Add Missing Token Columns

## Problem
The Discord OAuth flow is failing at the callback stage with error `update_failed`. The edge function logs show:
```
Could not find the 'access_token' column of 'team_integrations' in the schema cache
```

The `discord-oauth-callback` function is trying to store OAuth tokens in columns that don't exist in the `team_integrations` table.

## Solution
Add the missing OAuth token columns to the `team_integrations` table via a database migration.

## Database Migration

```sql
ALTER TABLE public.team_integrations 
ADD COLUMN IF NOT EXISTS access_token TEXT,
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;
```

## Column Details

| Column | Type | Purpose |
|--------|------|---------|
| `access_token` | TEXT | Discord bot OAuth access token for API calls |
| `refresh_token` | TEXT | Token to refresh access when it expires |
| `token_expires_at` | TIMESTAMPTZ | When the access token expires |

## Security Note
These token columns will be protected by the existing RLS policies on `team_integrations`. The edge function uses the service role key to write tokens, and frontend queries only expose public fields (not tokens).

## Impact
- No existing data is affected (new columns are nullable)
- Discord OAuth callback will succeed after migration
- No edge function code changes needed

## After This Fix
The complete Discord OAuth flow will:
1. Generate auth URL and store state token (already working)
2. User authorizes bot on Discord
3. Callback exchanges code for tokens and stores them (will work after this fix)
4. User sees "Connected" status in the Apps Portal
