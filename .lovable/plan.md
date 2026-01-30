
# Integrate Funnel-Flow-Studio with Main Stackit App

## Executive Summary

This plan creates a **unified Infostack experience** where the funnel builder at `apps/funnel-flow-studio` shares authentication and data persistence with the main app at the repo root. Users will be able to open the builder from the main app, save/publish funnels to the same Supabase project, and navigate seamlessly between both apps.

---

## Architecture Overview

```text
+---------------------------+       +---------------------------+
|      MAIN APP             |       |   FUNNEL BUILDER APP      |
|  (repo root, port 8080)   |       | (apps/funnel-flow-studio) |
+---------------------------+       +---------------------------+
|  - Auth (login/signup)    |       |  - Editor UI              |
|  - Team management        |       |  - Canvas, panels         |
|  - FunnelList page        |       |  - Block editing          |
|  - PublicFunnel renderer  |       |  - Preview mode           |
+---------------------------+       +---------------------------+
            |                                    |
            |   SHARED SUPABASE PROJECT          |
            +------------------------------------+
            |  Auth session (cookie-based)       |
            |  funnels table (drafts + published)|
            |  funnel_steps table                |
            |  Edge Functions                    |
            +------------------------------------+
```

---

## Implementation Steps

### A. Shared Supabase Environment

**Goal**: Both apps connect to the same Supabase project with identical credentials.

1. **Add Supabase client to builder app**
   - Create `apps/funnel-flow-studio/src/integrations/supabase/client.ts`
   - Use the same project URL and anon key as main app:
     - URL: `https://kqfyevdblvgxaycdvfxe.supabase.co`
     - Anon Key: (existing key from main app)

2. **Add `@supabase/supabase-js` dependency to builder**
   - The builder's `package.json` doesn't have Supabase SDK yet
   - Add `@supabase/supabase-js: ^2.75.0`

### B. Shared Auth/Session

**Goal**: User logs in once in main app; builder reads existing session.

1. **Create auth wrapper in builder app**
   - Add `apps/funnel-flow-studio/src/hooks/useAuth.ts`
   - On mount, call `supabase.auth.getSession()` to check for existing session
   - Supabase stores session in cookies/localStorage, so it will be shared

2. **Create AuthGate component**
   - Wraps the FunnelEditor
   - If no session found, show "Login Required" screen with link back to main app

3. **Session flow**:
   ```text
   User opens builder URL
          |
          v
   [AuthGate checks supabase.auth.getSession()]
          |
          +--> Session exists --> Show FunnelEditor
          |
          +--> No session --> Show login redirect
   ```

### C. Save Draft Flow

**Goal**: Builder saves funnel drafts directly to the existing `funnels` table.

1. **Update FunnelContext to support DB persistence**
   - Add optional props: `funnelId`, `teamId`, `onSave`
   - When saving, convert funnel state to match existing schema

2. **Create save-funnel API call**
   - Upsert to `funnels` table:
     - `builder_document`: The full funnel JSON (Funnel → Steps → Blocks)
     - `settings`: Page-level theme/background settings
     - `status`: 'draft'
     - `updated_at`: current timestamp

3. **Data model mapping**:
   ```text
   Builder App (FunnelContext)     →    Supabase funnels table
   ─────────────────────────────────────────────────────────────
   funnel.id                       →    id
   funnel.name                     →    name
   funnel.slug                     →    slug
   funnel.steps[]                  →    builder_document (JSON)
   funnel.settings (theme, bg)     →    settings (JSON)
   'draft'                         →    status
   ```

### D. Publish Flow

**Goal**: Mark funnel as published, store snapshot for runtime rendering.

1. **Add Publish button handler to EditorHeader**
   - Call existing `publish-funnel` edge function or extend it
   - Pass: `funnel_id`, `name`, `steps[]`, `builder_document`

2. **Update `publish-funnel` edge function**
   - Set `status = 'published'`
   - Store `published_document_snapshot` (the full FlowCanvas JSON for runtime)
   - This matches exactly what `FunnelEditor.tsx` in main app does

3. **Publish API contract**:
   ```typescript
   POST /functions/v1/publish-funnel
   Authorization: Bearer <user_jwt>
   Body: {
     funnel_id: string,
     name: string,
     steps: Step[],           // For funnel_steps table
     builder_document: JSON,  // Full editor state
     settings: JSON           // Theme, background
   }
   ```

### E. Navigation & UX Integration

**Goal**: Seamless navigation between main app and builder.

1. **Main app → Builder**
   - Update "Edit" button in FunnelList to open builder URL:
     ```
     /team/:teamId/funnels/:funnelId/edit → apps/funnel-flow-studio/?funnelId=X&teamId=Y
     ```
   - Or embed builder in iframe (simpler for session sharing)

2. **Builder → Main app**
   - Add "Back to Dashboard" button in EditorHeader
   - Link: `${MAIN_APP_URL}/team/${teamId}/funnels`

3. **URL parameters in builder**
   - Builder reads `?funnelId=X&teamId=Y` from URL
   - If funnelId provided, load existing funnel from Supabase
   - If not provided, create new funnel on first save

### F. Runtime Rendering (Main App)

**Goal**: Main app renders published funnels using the same renderer.

1. **Existing infrastructure already handles this**:
   - `PublicFunnel.tsx` fetches funnel by slug
   - Uses `published_document_snapshot` for rendering
   - `FlowCanvasRenderer` component handles display

2. **No changes needed** - the builder just needs to write to the same format that the runtime expects.

---

## Technical Details

### Files to Create/Modify in Builder App

| File | Action | Purpose |
|------|--------|---------|
| `src/integrations/supabase/client.ts` | Create | Supabase client with project credentials |
| `src/hooks/useAuth.ts` | Create | Auth hook matching main app pattern |
| `src/components/AuthGate.tsx` | Create | Redirect if not authenticated |
| `src/context/FunnelContext.tsx` | Modify | Add DB persistence props |
| `src/components/editor/EditorHeader.tsx` | Modify | Add Save/Publish handlers, Back link |
| `src/pages/Index.tsx` | Modify | Wrap with AuthGate, read URL params |
| `package.json` | Modify | Add @supabase/supabase-js |

### Files to Modify in Main App

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/FunnelList.tsx` | Modify | Update Edit button to open builder |
| `supabase/functions/publish-funnel/index.ts` | Modify | Accept builder_document, settings |

### Environment Setup

Both apps need these environment variables (already in root `.env`):
```
VITE_SUPABASE_URL=https://kqfyevdblvgxaycdvfxe.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

Note: The builder at `apps/funnel-flow-studio` currently has no `.env` file - we'll add one or share the root one.

---

## Session Sharing Strategy

Supabase Auth stores sessions in:
1. `localStorage` under key `sb-{project-ref}-auth-token`
2. Cookies (if configured)

Since both apps run on the same domain (localhost or preview), they automatically share the session via localStorage. No special configuration needed.

For production with different subdomains:
- Configure Supabase Auth to use cookies with `domain=.yourdomain.com`
- Or use single-domain deployment

---

## Data Flow Diagrams

### Save Draft Flow
```text
[User edits in Builder]
         |
         v
[FunnelContext.handleChange()]
         |
         v
[Debounced auto-save (2s)]
         |
         v
[supabase.from('funnels').update({
   builder_document: funnelJSON,
   settings: pageSettings,
   status: 'draft',
   updated_at: now
 })]
         |
         v
[Supabase funnels table updated]
```

### Publish Flow
```text
[User clicks Publish]
         |
         v
[supabase.functions.invoke('publish-funnel', {
   funnel_id, name, steps, builder_document, settings
 })]
         |
         v
[Edge function updates:
  - funnels.status = 'published'
  - funnels.published_document_snapshot = JSON
  - funnel_steps table (for analytics)
]
         |
         v
[Main app can now render via /f/{slug}]
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Session not shared between apps | Both apps use same Supabase project ID; session stored in localStorage by project ref |
| Data format mismatch | Builder writes to `builder_document` column which is already JSON; main app reads same |
| CORS issues | Both apps use Supabase SDK which handles CORS; edge functions have proper headers |
| Missing lock file warning | User should run `npm install` in builder app to generate lock file |

---

## Testing Checklist

1. **Auth Flow**: Log into main app, open builder URL, verify session exists
2. **Save Draft**: Edit funnel in builder, verify `funnels.builder_document` updated
3. **Publish**: Click publish, verify `status='published'` and `published_document_snapshot` set
4. **Runtime**: Visit `/f/{slug}` and verify funnel renders correctly
5. **Navigation**: Click "Back to Dashboard" from builder, verify returns to main app

---

## Dependencies

The builder app needs these packages added:
- `@supabase/supabase-js: ^2.75.0`

Already present in both apps (compatible):
- `react-router-dom: ^6.30.1`
- `@tanstack/react-query: ^5.83.0`
