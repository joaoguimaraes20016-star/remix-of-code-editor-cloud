# DEV Testing Checklist — Funnel Intent & Triggers

This is a minimal, dev-only test plan to validate funnel intent defaults, persistence, runtime emission, dedupe, and intent→trigger mapping. No production behavior is changed by these checks.

Prerequisites
- Run the dev server (project root). Common commands:

```bash
pnpm dev
# or
npm run dev
# or
pnpm start
```

- Open your browser to the app and use a team that has a funnel available.
- Ensure `import.meta.env.DEV` is true (you're running the dev server).

Quick checks (general)
- Open the browser console (DevTools) to watch for DEV-only debug logs.
- Relevant debug strings added by the runtime:
  - `[FunnelRenderer][dev] emitFunnelEvent` — successful intent event emission
  - `[FunnelRenderer][dev] emitFunnelEvent deduped` — a duplicate was prevented
  - `[FunnelRenderer][dev] emitting workflow trigger` — backend trigger event emitted
  - `recordEvent: dedupe hit (inserted=false)` — server-side dedupe (if using function)

Checklist: 1 — `getStepIntent` defaults
1. In the funnel builder, create (or edit) a step without `content.intent` set.
2. Open the Step Content editor for that step.
3. Observe the intent selector — it should show the default inferred by `getStepIntent` for that `step_type` (e.g., `email_capture` → `capture`, `opt_in` → `capture`, `embed` scheduling step → `schedule`, etc.).
4. Console: no errors expected. If the selector shows a sensible default, the helper is working.

Checklist: 2 — builder persistence of `step.content.intent`
1. In the builder, change the step intent via the dropdown and save the funnel.
2. After auto-save completes, reload the builder page.
3. Re-open the same step — the intent dropdown should reflect the saved `content.intent` value.
4. If it does not persist, check the server response on save and the dev console for the post-save debug log added in the editor (search for saved intent logs).

Checklist: 3 — runtime emits one event on submit
1. Open the funnel runtime (public renderer) and navigate to a step with `capture` intent (or make a step with `capture` intent in the builder and save).
2. Submit that step (fill required fields and click submit).
3. Observe the browser console — you should see one `[FunnelRenderer][dev] emitFunnelEvent` log for that step/intent.
4. On the backend (or function logs), verify a single `funnel_step_intent` record was created (or the function returned success).

Checklist: 4 — dedupe prevents duplicates
1. Rapidly click the submit button on a `capture` step twice within a few seconds.
2. Expectation: Only one emitted event and you'll see `[FunnelRenderer][dev] emitFunnelEvent deduped` for the second attempt.
3. Server-side `recordEvent` will also dedupe if the function is used — look for `recordEvent: dedupe hit (inserted=false)` in function logs.

Checklist: 5 — intent → trigger mapping correctness
1. For steps with each intent, perform the interaction that causes `emitFunnelEvent` to run (submit/capture/draft/etc.):
   - `capture` → should produce backend `lead_captured` event
   - `collect` → should produce backend `info_collected` event
   - `schedule` → should produce backend `appointment_scheduled` event
   - `complete` → should produce backend `funnel_completed` event
2. Watch the browser console for `[FunnelRenderer][dev] emitting workflow trigger` logs specifying the trigger name.
3. Verify backend/events table or function logs: look for events with `event_type` equal to the mapped trigger name.

Notes & guardrails
- Dedupe window is 10 seconds in-memory. If you need persistent dedupe across reloads, consider persisting dedupe keys to `sessionStorage` (not implemented here).
- The source of truth for triggering is the backend via `recordEvent` which prefers the `record-funnel-event` Edge Function when available. The function can perform server-side de-duplication and run automations.
- If your environment points to a Supabase project with no functions or no `events` table, server-side recording will fall back and may error; dev logs will indicate this.

Optional quick tests
- To simulate many rapid submissions and inspect fired events, open the console and run a small snippet that calls the public form submit function (if exposed) or programmatically click the submit button in a loop with small delays.

If you want, I can:
- Add an automated dev-only test page that simulates rapid submits and prints results.
- Persist dedupe keys to `sessionStorage` so reloads still prevent duplicates.

---
File: [README.DEV.md](README.DEV.md)
