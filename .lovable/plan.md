

## Fix `zapier-oauth-authorize` HTML Rendering

### Problem
The authorization page displays as raw HTML text instead of being rendered by the browser. This happens because the `Content-Type` header is not being properly applied despite being defined in the code.

### Root Cause
The current implementation uses a plain JavaScript object for headers:
```typescript
const htmlHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  ...
};
```

In some Deno edge runtime environments, this object form can be inconsistently applied. The fix is to use the explicit `Response` constructor with inline headers exactly as the user specified.

### Solution
Modify the `htmlResponse` function to use the exact pattern requested:

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

### File to Modify
`supabase/functions/zapier-oauth-authorize/index.ts`

### Changes

1. **Replace the `htmlHeaders` constant and `htmlResponse` function** (lines 9-24):
   - Remove the `htmlHeaders` object
   - Rewrite `htmlResponse` to use lowercase header names in an inline object
   - This ensures deterministic header application

2. **Updated code:**
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

### Why This Works
- Uses lowercase header names (HTTP/2 convention, more reliable)
- Inline object in the Response constructor is the most direct way to set headers
- Removes the intermediary `htmlHeaders` object that may not be reliably spread

### Verification
After deployment, visiting the authorize URL should:
- Render a styled HTML login/consent page (not show raw `<html>` tags)
- Return `Content-Type: text/html; charset=utf-8` in response headers
- Return `Cache-Control: no-store` in response headers

