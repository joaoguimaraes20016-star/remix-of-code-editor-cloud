

# Update Discord Bot Permissions

## Overview
Update the Discord OAuth flow to request the full set of permissions needed for rich reporting capabilities (EOD reports, call reports, event notifications).

## Change Summary

| File | Change |
|------|--------|
| `supabase/functions/discord-oauth-start/index.ts` | Update permissions from `2048` to `52224` |

## Permission Breakdown

| Permission | Integer | Purpose |
|------------|---------|---------|
| View Channels | 1024 | See available channels for posting |
| Send Messages | 2048 | Post reports and notifications |
| Embed Links | 16384 | Rich formatted messages with colors/fields |
| Attach Files | 32768 | Include recordings, screenshots, etc. |
| **Total** | **52224** | |

## Code Change

**File:** `supabase/functions/discord-oauth-start/index.ts`

```typescript
// Line 93: Change from
const permissions = "2048"; // SEND_MESSAGES

// To
const permissions = "52224"; // VIEW_CHANNEL + SEND_MESSAGES + EMBED_LINKS + ATTACH_FILES
```

## Impact
- Users who have already connected will need to reconnect to grant new permissions
- New connections will automatically receive full permissions
- No database changes required

