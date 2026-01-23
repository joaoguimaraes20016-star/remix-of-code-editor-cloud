
Goal: Fix the Typeform “Invalid input: scope not allowed” error shown in your screenshot so the OAuth consent screen loads correctly and the connection completes.

What’s happening (root cause)
- We’re currently setting `scope` to a string that contains literal `+` characters:
  `accounts:read+forms:read+responses:read+webhooks:read+webhooks:write`
- Because we build the URL with `URL.searchParams.set("scope", scopes)`, those `+` characters get URL-encoded as `%2B`.
- Typeform then receives the scope value as one single scope containing plus signs (not as a list of scopes), and rejects it as “scope not allowed”.

Code changes (Typeform OAuth start)
1. Update `supabase/functions/typeform-oauth-start/index.ts`:
   - Change the scopes string to be space-separated (OAuth standard).
     - From:
       - `const scopes = "accounts:read+forms:read+responses:read+webhooks:read+webhooks:write";`
     - To:
       - `const scopes = "accounts:read forms:read responses:read webhooks:read webhooks:write";`
   - Add the required OAuth parameter:
     - `authUrl.searchParams.set("response_type", "code");`
   - Keep the rest of the URL building logic the same (state, client_id, redirect_uri).

Why this works
- When `URLSearchParams` serializes a value with spaces, it produces `+` separators in the final URL (e.g. `scope=accounts:read+forms:read+...`).
- Typeform will interpret those `+` separators correctly as scope separators.

Verification steps (manual)
1. Go to: Team → Apps → Typeform → Connect.
2. Confirm the popup goes to Typeform and shows a consent/authorization screen (not the “We’re sorry / Bad Request” error).
3. Authorize the app.
4. Confirm the popup redirects back to `typeform-callback.html` and closes.
5. Confirm Infostack shows “Connected” with your Typeform email.
6. If anything fails:
   - Check Supabase Edge Function logs for:
     - `typeform-oauth-start`
     - `typeform-oauth-callback`

Fallback if Typeform still rejects scopes after the encoding fix
- Some Typeform apps/accounts may not be allowed to request webhook scopes.
- If it still errors, we’ll temporarily reduce scopes to:
  - `accounts:read forms:read responses:read`
- Then add webhook scopes back once basic connection is confirmed.

Non-blocking improvement (optional, after the above works)
- In `typeform-oauth-callback`, when Typeform sends an `error`, we can parse `state` (if present) so we can always redirect back to your app domain instead of defaulting to the Supabase domain for errors. This makes failures more predictable and easier to understand.

Implementation deliverables
- 1 small edit to `supabase/functions/typeform-oauth-start/index.ts`
- Redeploy edge function automatically (as usual)
- Retest connect flow end-to-end