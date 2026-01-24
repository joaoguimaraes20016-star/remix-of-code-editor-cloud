

## Fix Zapier OAuth v2 Authorize HTML Rendering

### Problem Analysis

The logs show the authorize function **IS receiving the correct parameters**:
```
received_client_id: "stackit_zapier_client_9f3a7c2d1b84e6f0"
received_redirect_uri: "https://zapier.com/dashboard/auth/oauth/return/App235737CLIAPI/"
received_response_type: "code"
```

Yet Zapier still shows raw HTML instead of a rendered page. This indicates the response **headers are not being applied correctly**.

---

### Root Cause

The current `htmlResponse` helper uses an object literal for headers:
```typescript
function htmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
```

In some edge runtime environments, this can fail to apply headers correctly. The fix is to use a `Headers` object explicitly and add the missing `x-content-type-options: nosniff` header.

---

### File to Modify

`supabase/functions/zapier-oauth-authorize/index.ts`

---

### Changes Required

#### 1. Rewrite `htmlResponse` to use explicit `Headers` object (lines 13-21)

**Before:**
```typescript
function htmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
```

**After:**
```typescript
function htmlResponse(body: string, status = 200): Response {
  const headers = new Headers();
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "no-store");
  headers.set("x-content-type-options", "nosniff");
  
  return new Response(body, { status, headers });
}
```

#### 2. Add enhanced debug logging for environment check (lines 466-472)

**Before:**
```typescript
console.log("OAuth authorize GET request:", { 
  received_client_id: clientId,
  received_redirect_uri: redirectUri,
  received_response_type: responseType,
  has_state: !!state 
});
```

**After:**
```typescript
// Safe debug log - mask client_id partially, never log secrets
const maskedClientId = clientId ? `${clientId.substring(0, 12)}...` : 'null';
console.log("OAuth authorize GET request:", { 
  received_client_id_masked: maskedClientId,
  received_redirect_uri: redirectUri,
  received_response_type: responseType,
  has_state: !!state,
  env_client_id_exists: !!EXPECTED_CLIENT_ID,
  client_id_matches: clientId === EXPECTED_CLIENT_ID
});
```

---

### Technical Explanation

| Issue | Fix |
|-------|-----|
| Headers not applied | Use explicit `Headers` object with `.set()` method |
| MIME type sniffing | Add `x-content-type-options: nosniff` header |
| Missing env debug | Log whether `ZAPIER_CLIENT_ID` exists and matches |
| Partial masking | Show only first 12 chars of received `client_id` for safety |

---

### Expected Response Headers After Fix

```
content-type: text/html; charset=utf-8
cache-control: no-store
x-content-type-options: nosniff
```

---

### Verification Steps

1. After deployment, check edge function logs for:
   - `env_client_id_exists: true`
   - `client_id_matches: true`

2. Open Zapier OAuth popup → should render styled HTML consent page

3. Enter credentials → should redirect to Zapier with `?code=...&state=...`

