

## Fix Zapier Authorization Page Branding

The Zapier OAuth authorization page currently displays "Infostack" instead of "Stackit" and uses raw HTML rendering. This plan updates all branding references and improves the visual design.

---

### Issues Identified

| Location | Current | Should Be |
|----------|---------|-----------|
| Page title (line 157) | "Authorize Infostack - Zapier" | "Authorize Stackit - Zapier" |
| Description (line 320) | "your Infostack account" | "your Stackit account" |
| CSS class (line 193) | `.infostack` | `.stackit` |
| HTML class (line 314) | `logo infostack` | `logo stackit` |

---

### File to Modify

| File | Changes |
|------|---------|
| `supabase/functions/zapier-oauth-authorize/index.ts` | Update all "Infostack" references to "Stackit" |

---

### Specific Changes

**Line 157** - Page title:
```html
<title>Authorize Stackit - Zapier</title>
```

**Line 193** - CSS class rename:
```css
.stackit { background: #6366f1; color: white; }
```

**Line 314** - HTML class reference:
```html
<div class="logo stackit">📊</div>
```

**Line 320** - Description text:
```html
<p>Zapier is requesting access to your Stackit account to automate your workflows.</p>
```

---

### Technical Notes

- The page is rendered as a raw HTML string inside the edge function's `renderAuthPage()` function
- This is a standard pattern for OAuth authorization flows since they need to be self-contained
- The styling uses inline CSS with a gradient background and card-based layout
- No structural changes needed - just text replacements

