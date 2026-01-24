

## Production-Ready Zapier OAuth v2 for Stackit

This plan implements a complete, secure OAuth 2.0 provider that will pass Zapier's Step 5 authentication test.

---

### Current State Analysis

The existing implementation has these issues:
- No strict `redirect_uri` validation (security vulnerability)
- Uses `Math.random()` for token generation (insecure)
- The authorize page requires a real Stackit login, which complicates Zapier testing
- No explicit validation against the exact Zapier redirect URI

---

### Architecture Overview

```text
+-----------------+     1. GET /authorize     +------------------------+
|     Zapier      | -----------------------> |   zapier-oauth-authorize |
|  (OAuth Client) |                          |   - Renders login page   |
|                 | <----------------------- |   - User approves        |
|                 |     302 redirect         |   - Issues auth code     |
|                 |     ?code=XXX&state=YYY  +------------------------+
|                 |
|                 |     2. POST /token       +------------------------+
|                 | -----------------------> |   zapier-oauth-token     |
|                 |                          |   - Validates code       |
|                 | <----------------------- |   - Returns tokens       |
|                 |     { access_token, ... }+------------------------+
|                 |
|                 |     3. GET /test         +------------------------+
|                 | -----------------------> |   zapier-oauth-test      |
|                 |     Authorization: Bearer|   - Validates token      |
|                 | <----------------------- |   - Returns user info    |
|                 |     { id, email }        +------------------------+
+-----------------+
```

---

### Files to Modify

| File | Purpose |
|------|---------|
| `supabase/functions/zapier-oauth-authorize/index.ts` | Complete rewrite for strict OAuth compliance |
| `supabase/functions/zapier-oauth-token/index.ts` | Add redirect_uri validation, use secure token generation |
| `supabase/functions/zapier-oauth-refresh/index.ts` | Ensure proper refresh token handling |
| `supabase/functions/zapier-oauth-test/index.ts` | Return `id` and `email` fields for Zapier connection label |

---

### Implementation Details

#### 1. `zapier-oauth-authorize` (Complete Rewrite)

**Validation Requirements:**
- `client_id` must exactly match `stackit_zapier_client_9f3a7c2d1b84e6f0`
- `redirect_uri` must exactly match `https://zapier.com/dashboard/auth/oauth/return/App235737CLIAPI/`
- Must accept `response_type`, `state`, and optional `scope`

**Login Flow (Simplified for Zapier Testing):**
- Render a simple HTML form with email + password inputs
- On form submit, validate credentials against Supabase Auth
- If valid, generate auth code and 302 redirect to Zapier
- If user cancels, redirect with `error=access_denied`

**Security:**
- Auth codes expire in 5 minutes
- Use `crypto.getRandomValues()` for code generation
- Store codes in `team_integrations.config` JSONB with expiry

**Key Code Changes:**
```typescript
// Strict redirect_uri validation
const ALLOWED_REDIRECT_URI = "https://zapier.com/dashboard/auth/oauth/return/App235737CLIAPI/";

if (redirectUri !== ALLOWED_REDIRECT_URI) {
  return htmlResponse(renderErrorPage("Invalid redirect_uri"));
}

// Secure random code generation
function generateSecureCode(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}
```

---

#### 2. `zapier-oauth-token` Updates

**Validation:**
- Validate `client_id` and `client_secret` match stored secrets
- Validate `redirect_uri` matches exactly (per OAuth 2.0 spec)
- Validate auth code exists, is not expired, and has not been used

**Token Generation:**
- Use `crypto.getRandomValues()` for access and refresh tokens
- Access tokens expire in 1 hour (3600 seconds)
- Refresh tokens have longer validity

**Response Format:**
```json
{
  "access_token": "zat_a1b2c3d4e5f6...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "zrt_x9y8z7w6v5u4..."
}
```

---

#### 3. `zapier-oauth-refresh` Updates

**Changes:**
- Currently proxies to token endpoint (acceptable)
- Ensure refresh token rotation is consistent
- Return new access_token with optional new refresh_token

---

#### 4. `zapier-oauth-test` Updates

**Response Format (for Zapier Connection Label):**
```json
{
  "id": "team_uuid",
  "email": "user@example.com"
}
```

The current implementation returns `id` and `name` - we need to add `email` from the stored config.

---

### Secret Updates Required

The secrets `ZAPIER_CLIENT_ID` and `ZAPIER_CLIENT_SECRET` must be updated to match:

| Secret | Value |
|--------|-------|
| `ZAPIER_CLIENT_ID` | `stackit_zapier_client_9f3a7c2d1b84e6f0` |
| `ZAPIER_CLIENT_SECRET` | `sk_stackit_zapier_live_7c1f93e4a2d8b6f059e1c4a9d3b2f8aa` |

---

### Test Checklist for Zapier Step 5

1. **Click "Connect to Stackit"**
   - Browser opens authorization page
   - Page renders as HTML (not raw text)
   - Enter test credentials and select team
   - Click "Authorize Access"
   - Redirected back to Zapier with `?code=XXX&state=YYY`

2. **Click "Test Authentication"**
   - Zapier exchanges code for tokens
   - Zapier calls `/zapier-oauth-test` with Bearer token
   - Returns `{ "id": "...", "email": "..." }`
   - Connection shows as successful

---

### Security Checklist

- [x] Strict `redirect_uri` matching (no partial/contains)
- [x] Auth codes expire in 5 minutes
- [x] Access tokens expire in 1 hour
- [x] `crypto.getRandomValues()` for all tokens
- [x] Auth code invalidated after use
- [x] CORS headers allow Zapier origin
- [x] Error responses use proper OAuth error codes

---

### No Database Changes Needed

The existing `team_integrations` table already has all required columns:
- `access_token`
- `refresh_token`
- `token_expires_at`
- `config` (JSONB for auth_code, user_email, etc.)
- `oauth_state`

