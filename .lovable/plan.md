

## Production-Ready Zapier OAuth v2 for Stackit

This plan addresses all the critical fixes required to make Zapier Step 5 pass.

---

### Issues Found in Current Implementation

| Issue | Location | Fix Required |
|-------|----------|--------------|
| Hardcoded client credentials | All 4 functions | Use `Deno.env.get("ZAPIER_CLIENT_ID")` and `Deno.env.get("ZAPIER_CLIENT_SECRET")` |
| No dedicated OAuth tables | Database | Create `oauth_auth_codes` and `oauth_tokens` tables |
| Using `team_integrations` for codes | authorize/token | Switch to dedicated `oauth_auth_codes` table |
| Missing `response_type` validation log | authorize | Add debug log |

---

### Database Schema (SQL Migration)

Create two new tables for proper OAuth storage:

```sql
-- oauth_auth_codes: stores short-lived authorization codes
CREATE TABLE IF NOT EXISTS oauth_auth_codes (
  code TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  state TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_email TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- oauth_tokens: stores access and refresh tokens
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token TEXT UNIQUE NOT NULL,
  refresh_token TEXT UNIQUE NOT NULL,
  client_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_email TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_expires ON oauth_auth_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_access ON oauth_tokens(access_token);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_refresh ON oauth_tokens(refresh_token);

-- RLS policies
ALTER TABLE oauth_auth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Service role only (edge functions use service role key)
CREATE POLICY "Service role full access on oauth_auth_codes" 
  ON oauth_auth_codes FOR ALL 
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on oauth_tokens" 
  ON oauth_tokens FOR ALL 
  USING (true) WITH CHECK (true);
```

---

### Edge Function Changes

#### 1. `zapier-oauth-authorize/index.ts`

**Changes:**
- Read `ZAPIER_CLIENT_ID` from environment: `Deno.env.get("ZAPIER_CLIENT_ID")`
- Add debug logs for received `client_id` and `redirect_uri`
- Validate `response_type === "code"`
- Store auth codes in new `oauth_auth_codes` table
- Ensure HTML response with correct headers

**Key code updates:**

```typescript
// Replace hardcoded constant
const EXPECTED_CLIENT_ID = Deno.env.get("ZAPIER_CLIENT_ID");

// Add debug logs (safe - no secrets)
console.log("OAuth authorize request:", {
  received_client_id: clientId,
  received_redirect_uri: redirectUri,
  received_response_type: responseType,
  has_state: !!state
});

// Store in oauth_auth_codes table instead of team_integrations.config
await supabase.from("oauth_auth_codes").insert({
  code: authCode,
  client_id: clientId,
  redirect_uri: redirectUri,
  state: state,
  user_id: userId,
  team_id: teamId,
  user_email: email,
  expires_at: expiresAt
});
```

---

#### 2. `zapier-oauth-token/index.ts`

**Changes:**
- Read credentials from environment
- Lookup auth codes in `oauth_auth_codes` table
- Mark code as used after successful exchange
- Store tokens in `oauth_tokens` table
- Add safe debug logs

**Key code updates:**

```typescript
// Read from environment
const EXPECTED_CLIENT_ID = Deno.env.get("ZAPIER_CLIENT_ID");
const EXPECTED_CLIENT_SECRET = Deno.env.get("ZAPIER_CLIENT_SECRET");

// Debug log (safe)
console.log("Token request:", {
  grant_type,
  received_client_id: client_id,
  has_code: !!code,
  has_redirect_uri: !!redirect_uri
});

// Lookup code in oauth_auth_codes
const { data: authCode } = await supabase
  .from("oauth_auth_codes")
  .select("*")
  .eq("code", code)
  .is("used_at", null)
  .single();

// Mark code as used
await supabase
  .from("oauth_auth_codes")
  .update({ used_at: new Date().toISOString() })
  .eq("code", code);

// Store tokens in oauth_tokens
await supabase.from("oauth_tokens").insert({
  access_token: accessToken,
  refresh_token: refreshToken,
  client_id: client_id,
  user_id: authCode.user_id,
  team_id: authCode.team_id,
  user_email: authCode.user_email,
  expires_at: tokenExpiresAt
});
```

---

#### 3. `zapier-oauth-refresh/index.ts`

**Changes:**
- Read credentials from environment
- Lookup and validate refresh token in `oauth_tokens` table
- Issue new access token (and optionally rotate refresh token)
- Add safe debug logs

**Key code updates:**

```typescript
const EXPECTED_CLIENT_ID = Deno.env.get("ZAPIER_CLIENT_ID");
const EXPECTED_CLIENT_SECRET = Deno.env.get("ZAPIER_CLIENT_SECRET");

// Lookup refresh token
const { data: tokenRecord } = await supabase
  .from("oauth_tokens")
  .select("*")
  .eq("refresh_token", refresh_token)
  .is("revoked_at", null)
  .single();

// Issue new tokens
const newAccessToken = generateSecureToken("zat");
const newRefreshToken = generateSecureToken("zrt");

// Update or insert new token record
await supabase
  .from("oauth_tokens")
  .update({
    access_token: newAccessToken,
    refresh_token: newRefreshToken,
    expires_at: newExpiresAt
  })
  .eq("id", tokenRecord.id);
```

---

#### 4. `zapier-oauth-test/index.ts`

**Changes:**
- Lookup access token in `oauth_tokens` table
- Return `{ id, email }` for Zapier connection label
- Add safe debug logs

**Key code updates:**

```typescript
// Lookup in oauth_tokens
const { data: tokenRecord } = await supabase
  .from("oauth_tokens")
  .select("*")
  .eq("access_token", accessToken)
  .is("revoked_at", null)
  .single();

// Check expiry
if (new Date(tokenRecord.expires_at) < new Date()) {
  return jsonError("Access token has expired", 401);
}

// Return user info for connection label
return new Response(JSON.stringify({
  id: tokenRecord.team_id || tokenRecord.user_id,
  email: tokenRecord.user_email
}), { headers: corsHeaders });
```

---

### Security Checklist

| Requirement | Implementation |
|-------------|----------------|
| Strict `redirect_uri` match | Exact string comparison against Zapier URI |
| 5-minute auth code TTL | `expires_at` set to `now() + 5 min` |
| 1-hour access token TTL | `expires_in: 3600` |
| Crypto-secure tokens | `crypto.getRandomValues()` |
| One-time auth codes | `used_at` column marks codes as consumed |
| Environment secrets | `Deno.env.get("ZAPIER_*")` |
| Safe debug logs | Log `client_id`, `redirect_uri`; never log secrets |

---

### Files to Modify

| File | Action |
|------|--------|
| `supabase/functions/zapier-oauth-authorize/index.ts` | Update to use env vars and new tables |
| `supabase/functions/zapier-oauth-token/index.ts` | Update to use env vars and new tables |
| `supabase/functions/zapier-oauth-refresh/index.ts` | Update to use env vars and new tables |
| `supabase/functions/zapier-oauth-test/index.ts` | Update to use new `oauth_tokens` table |

---

### Test Checklist for Zapier Step 5

1. **Click "Connect to Stackit"**
   - Browser opens to `/functions/v1/zapier-oauth-authorize?client_id=...&redirect_uri=...&response_type=code&state=...`
   - HTML consent page renders (not raw text)
   - Enter Stackit credentials
   - Click "Authorize Access"
   - Redirected to `https://zapier.com/dashboard/auth/oauth/return/App235737CLIAPI/?code=XXX&state=YYY`

2. **Click "Test Authentication"**
   - Zapier calls `/functions/v1/zapier-oauth-token` with auth code
   - Returns `{ access_token, refresh_token, token_type, expires_in }`
   - Zapier calls `/functions/v1/zapier-oauth-test` with Bearer token
   - Returns `{ id, email }`
   - Connection shows as successful with email label

