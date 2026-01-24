

## Update TikTok Integration for Business API

This plan updates the existing TikTok integration to use TikTok Business API scopes instead of the basic Login Kit scopes.

---

### Redirect URL for TikTok Developer Portal

Add this exact URL to your TikTok app's redirect URI settings:

```
https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/tiktok-oauth-callback
```

---

### Changes Required

**Update `supabase/functions/tiktok-oauth-start/index.ts`**

Change the OAuth scopes from basic Login Kit to TikTok Business API scopes:

| Current Scopes | New Business API Scopes |
|----------------|------------------------|
| `user.info.basic` | `user.info.basic` |
| `user.info.profile` | `user.info.profile` |
| | `lead.management` |
| | `crm.event.management` |
| | `reporting.read` |
| | `measurement.read` |
| | `pixel.read` |
| | `offline.event.manage` |
| | `ad.account.read` |

The authorization endpoint also changes for Business API:
- **From**: `https://www.tiktok.com/v2/auth/authorize/`
- **To**: `https://business-api.tiktok.com/open_api/v1.3/oauth2/authorize/`

**Update `supabase/functions/tiktok-oauth-callback/index.ts`**

Update the token exchange endpoint for Business API:
- **From**: `https://open.tiktokapis.com/v2/oauth/token/`
- **To**: `https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/`

After token exchange, fetch advertiser info using the Business API to get the connected ad accounts.

---

### File Changes Summary

| File | Action |
|------|--------|
| `supabase/functions/tiktok-oauth-start/index.ts` | Update scopes and auth endpoint |
| `supabase/functions/tiktok-oauth-callback/index.ts` | Update token endpoint and add advertiser info fetch |

---

### Technical Details

**tiktok-oauth-start changes:**
- Update `scopes` array to include all Business API scopes you selected
- Change authorization URL to Business API endpoint
- Keep existing state management and CSRF protection

**tiktok-oauth-callback changes:**
- Update token exchange URL to Business API endpoint
- After getting access token, call `/advertiser/info/` endpoint to get connected ad accounts
- Store advertiser IDs in the `config` JSONB field alongside existing user info

