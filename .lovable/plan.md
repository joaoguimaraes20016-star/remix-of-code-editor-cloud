
Goal: Fix Zapier OAuth v2 “authorize” popup so the consent page renders as real HTML (not raw source), and eliminate any “Invalid client_id” false negatives—by changing ONLY `supabase/functions/zapier-oauth-authorize/index.ts`.

## What’s happening (root cause, based on evidence)
1. The authorize function is returning the HTML body correctly, and our server-side validation logs show:
   - `env_client_id_exists: true`
   - `client_id_matches: true`
2. However, the actual HTTP response seen by the client is coming back with:
   - `Content-Type: text/plain` (this is why the popup shows raw HTML source)
   - `Content-Security-Policy: default-src 'none'; sandbox` (this can also break inline scripts/forms, even if rendering is fixed)

So the page is not being interpreted as HTML by Zapier’s popup because the final response headers are not what we intend. We need to make the HTML response headers “unmistakable” to the platform and avoid relying on any inline JS that might be blocked by a sandbox CSP.

## Key implementation changes (authorize function only)

### A) Make HTML responses unambiguously HTML (no JSON, no helpers that can be bypassed)
Update the function so it always returns HTML using the exact pattern you requested:

- Use `return new Response(html, { status, headers })`
- Set headers explicitly on the Response object
- Ensure `Content-Type` cannot be missed by any intermediary

Implementation detail:
- Build headers with `new Headers()` and set BOTH lowercase and canonical case variants for Content-Type to maximize compatibility with any non-standard proxy behavior:
  - `headers.set("content-type", "text/html; charset=utf-8")`
  - `headers.set("Content-Type", "text/html; charset=utf-8")`

Also set:
- `cache-control: no-store`
- `x-content-type-options: nosniff`

### B) Override the injected CSP sandbox (critical)
Right now, the response includes `Content-Security-Policy: default-src 'none'; sandbox` which can:
- Prevent scripts from running (our current page uses inline JS)
- Potentially block form submissions (sandbox can restrict forms)

Fix: explicitly set our own CSP header in the HTML response to something compatible with an OAuth consent page.

Recommended CSP for this page:
- Allows inline styles (we use inline CSS)
- Avoids sandbox entirely
- Avoids loading third-party resources
- Allows form submission back to the same origin

Example policy to set on the HTML Response:
- `content-security-policy: default-src 'self'; style-src 'unsafe-inline'; img-src 'self' data:; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none';`

(We can tighten further later, but this immediately avoids the sandbox behavior that breaks OAuth pages.)

### C) Remove JavaScript dependency in the consent flow (more robust in embedded/popup environments)
Currently the consent page uses an inline `<script>` to:
- POST JSON to `/zapier-oauth-authorize`
- Parse JSON
- Then `window.location.href = data.redirect_url`

This is brittle if any CSP blocks inline JS.

Fix: change the consent page to a plain HTML `<form method="POST">` submission with hidden fields:
- `client_id`
- `redirect_uri`
- `state`
- `response_type`
…and visible login fields as needed.

On successful POST:
- generate auth code
- store auth code
- return **302 redirect** to:
  `{redirect_uri}?code=AUTH_CODE&state=STATE`

On cancel:
- do NOT use JS; just make the cancel action a normal link:
  `{redirect_uri}?error=access_denied&state=STATE`

This guarantees the flow works even if inline scripts are blocked.

### D) Validation rules (GET and POST)
Enforce exactly what you specified:

On GET:
- read `client_id` from query param
- compare to `Deno.env.get("ZAPIER_CLIENT_ID")`
- read `redirect_uri` and require EXACT match to:
  `https://zapier.com/dashboard/auth/oauth/return/App235737CLIAPI/`
- require `response_type === "code"`

On POST:
- re-validate `client_id` and `redirect_uri` again (never trust hidden fields)
- if mismatch, return an HTML error page (still with `Content-Type: text/html; charset=utf-8`)

### E) Safe debug logs (no secrets)
Add logs (safe and useful) at start of GET handling:
- masked client_id: first 12 chars + “...”
- redirect_uri
- response_type present / value
- `env_client_id_exists: true/false`
- `client_id_matches: true/false`

Also add logs on POST handling:
- presence of email/password (booleans only)
- redirect_uri
- whether the validated client_id matches

Never log:
- client secret
- auth codes
- access tokens

## What will change in Response headers (the user-visible guarantee)
After the fix, the GET authorize response will explicitly include (at minimum):

- `Content-Type: text/html; charset=utf-8`
- `Cache-Control: no-store`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy: ...` (non-sandbox, allows the page to function/render)

And importantly, it will no longer “fall back” to `Content-Type: text/plain` for the consent page response.

## Verification checklist (fast)
1. Hit authorize URL in browser and confirm it renders as a normal web page.
2. Inspect response headers and confirm:
   - `Content-Type` is `text/html; charset=utf-8` (not text/plain)
   - CSP is not `default-src 'none'; sandbox`
3. In Zapier “Connect to Stackit” popup:
   - consent page should visually render (not raw source)
   - Approve submits and redirects with `code` + `state`
   - Cancel redirects with `error=access_denied` + `state`

## Files changed
- Only: `supabase/functions/zapier-oauth-authorize/index.ts`
