
<context>
User is seeing raw HTML (tags displayed as text) when hitting the Zapier OAuth authorize endpoint, and also getting “Invalid client_id”. Screenshot shows the response body printed instead of rendered.

Code inspection + a live function call confirm the root cause:
- The authorize function is returning an HTML string, but the HTTP response header is coming back as `Content-Type: text/plain` (default for string bodies), so browsers (and Zapier’s tester) display the HTML as text instead of rendering it.
- Separately, the endpoint is rejecting the request with “Invalid client_id” when `client_id !== Deno.env.get("ZAPIER_CLIENT_ID")`.
</context>

<what-we-will-change>
1) Fix the response headers so the authorize endpoint actually returns `Content-Type: text/html; charset=utf-8` for BOTH:
   - the normal consent/login HTML page
   - the error HTML page

2) Improve the client_id validation messaging so it’s obvious whether:
   - the server is misconfigured (missing `ZAPIER_CLIENT_ID` secret), vs
   - Zapier is sending a client_id that doesn’t match the stored secret

3) Add safer OAuth headers:
   - `Cache-Control: no-store`
   - `Pragma: no-cache`
   This prevents browsers/proxies from caching authorization pages or errors (recommended for OAuth-style flows).
</what-we-will-change>

<files>
- Modify: `supabase/functions/zapier-oauth-authorize/index.ts`
  - Centralize HTML response headers into a helper, e.g. `htmlHeaders()` returning a `Headers` object.
  - Ensure every HTML `new Response(...)` uses those headers.
</files>

<implementation-details>
A) Enforce HTML content type reliably
- Create something like:

```ts
function htmlHeaders() {
  const h = new Headers(corsHeaders);
  h.set("Content-Type", "text/html; charset=utf-8");
  h.set("Cache-Control", "no-store");
  h.set("Pragma", "no-cache");
  return h;
}
```

- Then use it everywhere we return HTML:

```ts
return new Response(renderErrorPage("Invalid client_id"), { headers: htmlHeaders() });
```

Why this fixes it:
- Right now the runtime is effectively behaving like the header wasn’t set (defaulting to `text/plain`), which causes the browser to print the HTML source. Using an explicit `Headers` object and setting `Content-Type` in one place prevents accidental omission and makes the header deterministic.

B) Make client_id failure actionable (no magic)
- If `expectedClientId` is missing/empty:
  - Return an error page: “Server misconfigured: missing ZAPIER_CLIENT_ID”
  - Log a clear server-side error.
- If present but mismatch:
  - Return: “Invalid client_id (check Zapier client ID matches Stackit’s ZAPIER_CLIENT_ID secret)”
  - Log a redacted hint (example: log first 4 chars + length only), so we can debug without leaking secrets.

C) Verification steps (after implementation)
1. Hit authorize endpoint with a fake client_id:
   - Confirm HTML renders (styled error page), not raw tags.
2. Hit authorize endpoint with the REAL Zapier client_id:
   - Confirm it shows the Stackit consent/login UI (rendered).
3. Re-run Zapier “Test Authentication” flow:
   - If it still shows invalid client_id, the next fix is to update the Supabase Function secret `ZAPIER_CLIENT_ID` to exactly match the value shown in Zapier’s integration settings.

Note: The client_id mismatch is not something code can “guess” safely; it must match the secret for a predictable, secure flow.
</implementation-details>

<edge-cases>
- Zapier / OAuth tooling sometimes shows raw HTTP bodies in its debug console; however, the browser case must render. Fixing `Content-Type` makes both scenarios behave predictably.
- We’ll keep the strict client_id check (security + predictability), but improve the error to be explicit and non-confusing.
</edge-cases>

<success-criteria>
- Visiting `/functions/v1/zapier-oauth-authorize?...` renders an actual page (no visible `<html>` tags).
- “Invalid client_id” only occurs when there’s a real mismatch, and the error tells exactly what to verify.
</success-criteria>
