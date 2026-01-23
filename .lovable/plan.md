

# Fix Meta and Google Ads OAuth Integration

## Problem Summary

Two distinct issues:

1. **Meta OAuth**: Returns 500 error "Meta integration not configured" - the `META_CLIENT_ID` and `META_CLIENT_SECRET` secrets are missing from the deployed environment
2. **Google Ads OAuth**: Returns "ERR_BLOCKED_BY_RESPONSE" - the callback URL needs to be added to Google Cloud Console's authorized redirect URIs

---

## Required Actions

### Step 1: Add Meta Secrets

The Meta credentials need to be added to the project secrets. You mentioned adding them, but they're not in the deployed environment.

**Required secrets:**
- `META_CLIENT_ID` - from Meta Developers console
- `META_CLIENT_SECRET` - from Meta Developers console

**How to verify:** After adding, the secrets list should show these two new entries.

---

### Step 2: Configure Google Cloud Console

For Google Ads OAuth to work, the callback URL must be registered in your Google Cloud Console.

**Add to Authorized Redirect URIs:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Add this URL to **Authorized redirect URIs**:
   ```
   https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/functions/v1/google-ads-oauth-callback
   ```

Your Supabase project URL can be found in:
- Supabase Dashboard → Project Settings → API
- Or from the edge function URL pattern already in use

---

### Step 3: Configure Meta Developers Console

For Meta OAuth to work, the callback URL must also be registered.

**In Meta Developers Console:**
1. Go to [Meta Developers](https://developers.facebook.com/)
2. Select your app
3. Navigate to **Facebook Login** → **Settings**
4. Add to **Valid OAuth Redirect URIs**:
   ```
   https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/functions/v1/meta-oauth-callback
   ```

---

## Code Changes (None Required)

The code implementation is correct. The issues are configuration-related:

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Meta 500 error | Missing secrets | Add `META_CLIENT_ID` and `META_CLIENT_SECRET` to project secrets |
| Google ERR_BLOCKED | Missing redirect URI | Add callback URL to Google Cloud Console |

---

## Verification Steps

After making the above changes:

1. **Test Meta connection:**
   - Click "Connect with Meta" in Apps Portal
   - Should open Facebook login in a popup
   - After authorization, should redirect back and show "Connected"

2. **Test Google Ads connection:**
   - Click "Connect with Google Ads" in Apps Portal
   - Should open Google sign-in in a popup
   - After authorization, should redirect back and show "Connected"

---

## Summary

| Task | Type | Status |
|------|------|--------|
| Add META_CLIENT_ID secret | Configuration | You need to add |
| Add META_CLIENT_SECRET secret | Configuration | You need to add |
| Add Meta callback URL to Facebook Login settings | Configuration | You need to add |
| Add Google Ads callback URL to Google Cloud Console | Configuration | You need to add |
| Code changes | Development | Not needed |

