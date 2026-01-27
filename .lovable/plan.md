
# Funnel Builder UX Fixes: 8 Critical Issues

## Executive Summary

This plan addresses **8 distinct bugs and UX issues** identified during the user's testing session:

| # | Issue | Severity | Root Cause |
|---|-------|----------|------------|
| 1 | Dark sidebar appears unexpectedly, can't be dismissed | Critical | AI Copilot panel state bug |
| 2 | Inconsistent Add-Section behavior across pages | High | Modal only triggers on pages with existing frames |
| 3 | Legacy template confusion with "(Legacy)" labels | High | Deprecated templates still visible |
| 4 | Phone input styling issues (contrast, alignment) | Medium | Missing form field styling in templates |
| 5 | Floating mini toolbar clutter | Medium | Toolbar positioning offset issues |
| 6 | Inspector "Step Background" text truncation | Medium | Toggle pill overflow with 5 options |
| 7 | Duplicated pages show no content | Critical | `regenerateIds` mutating wrong reference |
| 8 | "FORM FIELD" stray label clutter | Low | Debug badge visible in editor mode |

---

## Issue 1: Dark Sidebar Cannot Be Dismissed (Critical)

### Problem Analysis
The user describes a dark sidebar appearing during page list scroll, containing "developer notes" and a "Hide sidebar" button that doesn't work. Based on code analysis, this is the **AIBuilderCopilot** component.

**Current behavior** (`EditorShell.tsx:2057-2067`):
```tsx
<AIBuilderCopilot
  isExpanded={isAICopilotExpanded}
  onToggle={() => setIsAICopilotExpanded(!isAICopilotExpanded)}
/>
```

**Root cause**: The toggle callback creates a closure issue, or the panel is being opened by an unintended trigger (e.g., scroll event collision with the panel's expand area).

### Solution

1. **Add explicit close handler** instead of toggle:
```tsx
// EditorShell.tsx
const handleCloseCopilot = useCallback(() => {
  setIsAICopilotExpanded(false);
}, []);

// Pass explicit handlers
<AIBuilderCopilot
  isExpanded={isAICopilotExpanded}
  onOpen={() => setIsAICopilotExpanded(true)}
  onClose={handleCloseCopilot}
/>
```

2. **Ensure click-outside closes the panel** in `AIBuilderCopilot.tsx`:
```tsx
// Add useEffect for click outside
useEffect(() => {
  if (!isExpanded) return;
  
  const handleClickOutside = (e: MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      onClose?.();
    }
  };
  
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [isExpanded, onClose]);
```

3. **Add escape key handler** to ensure keyboard dismissal works.

**Files to modify:**
- `src/flow-canvas/builder/components/EditorShell.tsx` (~10 lines)
- `src/flow-canvas/builder/components/AIBuilderCopilot.tsx` (~25 lines)

---

## Issue 2: Inconsistent Add-Section Behavior

### Problem Analysis
The dotted-circle "Add Section" target works on the "Questions (Copy)" page but doesn't respond on the landing page.

**Root cause**: The `InlineSectionPicker` is only triggered when `onOpenSectionPicker` is called, but pages with existing content may have a different interaction flow than empty pages.

**Current InlineSectionPicker trigger** (`EditorShell.tsx:~1900`):
```tsx
onOpenSectionPicker={() => setInlineSectionPickerOpen(true)}
```

### Solution

1. **Unify the trigger** - ensure both the dotted-circle CTA and the "Add Section" button in the empty state call the same handler:

```tsx
// In CanvasRenderer.tsx - for empty state
<button 
  onClick={onOpenSectionPicker}
  className="..."
>
  Add Section
</button>

// For the dotted-circle CTA
<AddSectionPopover onOpenPicker={onOpenSectionPicker} />
```

2. **Add debugging toast** to confirm click registration during development:
```tsx
onOpenSectionPicker={() => {
  console.log('Opening section picker');
  setInlineSectionPickerOpen(true);
}}
```

3. **Check for pointer-events blocking** - ensure no overlay is intercepting clicks on the landing page.

**Files to modify:**
- `src/flow-canvas/builder/components/CanvasRenderer.tsx` (~5 lines)
- `src/flow-canvas/builder/components/AddSectionPopover.tsx` (~5 lines)

---

## Issue 3: Legacy Template Confusion

### Problem Analysis
The "Choose Template" modal shows:
- "Email Input (Legacy)"
- "Phone Input (Legacy)"
- "Contact Form (Legacy)"

With description: "Use Interactive Blocks instead" — telling users NOT to use what's offered.

**Current definitions** (`sectionTemplates.ts:365-418`):
```typescript
export const formEmail: SectionTemplate = {
  id: 'form-email',
  name: 'Email Input (Legacy)',
  description: 'Use Interactive Blocks instead',
  category: 'embed',
  // ...
};
```

### Solution

**Option A (Recommended): Hide legacy templates entirely**

Remove legacy templates from the exported `allSectionTemplates` array:

```typescript
// sectionTemplates.ts
const HIDDEN_LEGACY_IDS = ['form-email', 'form-phone', 'form-full'];

export const allSectionTemplates = [
  // ... all templates
].filter(t => !HIDDEN_LEGACY_IDS.includes(t.id));
```

**Option B: Replace with modern equivalents**

Update the InlineSectionPicker's Form category to use Interactive Block templates:

```typescript
// InlineSectionPicker.tsx - quickCategories
{ 
  id: 'form', 
  name: 'Form', 
  icon: Mail,
  description: 'Capture leads',
  templates: ['interactive-email', 'interactive-phone', 'interactive-contact']
  // instead of: ['form-email', 'form-phone', 'form-full']
},
```

**Files to modify:**
- `src/builder_v2/templates/sectionTemplates.ts` (~5 lines)
- `src/flow-canvas/builder/components/InlineSectionPicker.tsx` (~10 lines)

---

## Issue 4: Phone Input Styling Issues

### Problem Analysis
After adding a phone input:
- Dark input bar on blue canvas = low contrast
- Placeholder text misaligned
- Input not centered in section

**Root cause**: The legacy `form-phone` template creates a raw `phone_input` element without proper container styling.

### Solution

1. **Update template with proper container and styling**:

```typescript
// sectionTemplates.ts - formPhone.createNode()
createNode: () => ({
  id: genId('section'),
  type: 'section',
  props: { 
    variant: 'form', 
    alignment: 'center',
    padding: { top: 32, bottom: 32, left: 24, right: 24 }
  },
  children: [
    {
      id: genId('input'),
      type: 'phone_input',
      props: { 
        placeholder: 'Enter your phone number', 
        fieldName: 'phone',
        // Add styling defaults
        textAlign: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        color: '#ffffff',
        borderRadius: 8,
      },
      children: [],
    },
  ],
}),
```

2. **Add form input contrast detection** in `CanvasRenderer.tsx`:
- Check parent section background luminance
- Auto-apply light/dark input theme

**Files to modify:**
- `src/builder_v2/templates/sectionTemplates.ts` (~15 lines)
- `src/flow-canvas/builder/components/CanvasRenderer.tsx` (~20 lines)

---

## Issue 5: Floating Mini Toolbar Clutter

### Problem Analysis
When a form field is placed:
- A small toolbar with up/down arrows appears above it
- The toolbar overlaps other elements
- Floats awkwardly relative to content

**Current positioning** (`BlockActionBar.tsx:230-237`):
```tsx
className={cn(
  'absolute',
  position === 'left' ? 'left-1.5 top-1/2' : 'right-1.5 top-1/2',
  // ...
)}
style={{ transform: 'translateY(-50%)' }}
```

### Solution

1. **Adjust positioning to avoid overlap**:

```tsx
// BlockActionBar.tsx - Desktop positioning
className={cn(
  'absolute',
  position === 'left' ? 'left-0 -translate-x-full top-1/2' : 'right-0 translate-x-full top-1/2',
  // position toolbar OUTSIDE the block boundary
  'ml-2 mr-2', // gap from block edge
  // ...
)}
```

2. **Add collision detection** to flip position if near canvas edge.

3. **Reduce toolbar prominence** - smaller size, more subtle appearance:

```tsx
// Reduce from p-1 to p-0.5, gap-0.5 to gap-0
'flex flex-col gap-0 p-0.5 rounded-md'
```

**Files to modify:**
- `src/flow-canvas/builder/components/BlockActionBar.tsx` (~15 lines)
- `src/flow-canvas/index.css` (~5 lines for sizing adjustments)

---

## Issue 6: Inspector "Step Background" Text Truncation

### Problem Analysis
The toggle pill with 5 options (Solid | Gradient | Image | Video | Pattern) truncates "Video" to "Vide" or shows a stray "p".

**Root cause** (`RightPanel.tsx:3128`):
```tsx
<div className="toggle-pill w-full">
```

The `w-full` applies, but with 5 options at `px-3` padding each, the container overflows.

**CSS definition** (`flow-canvas/index.css:577-579`):
```css
.toggle-pill-option {
  @apply px-3 py-1.5 text-xs font-medium rounded-md transition-colors;
}
```

### Solution

1. **Reduce padding for 5-option toggles**:

```css
/* flow-canvas/index.css */
.toggle-pill-option-compact {
  @apply px-2 py-1.5 text-xs font-medium rounded-md transition-colors;
}
```

2. **Apply compact class to Step Background control**:

```tsx
// RightPanel.tsx:3128-3159
<div className="toggle-pill w-full">
  <button 
    className={cn('toggle-pill-option toggle-pill-option-compact flex-1 text-center min-w-0', ...)}
  >
    Solid
  </button>
  // ... same for all 5 options
</div>
```

3. **Add `min-w-0` and `overflow-hidden text-ellipsis`** as safety:

```css
.toggle-pill-option {
  @apply px-3 py-1.5 text-xs font-medium rounded-md transition-colors min-w-0;
}
```

**Files to modify:**
- `src/flow-canvas/index.css` (~5 lines)
- `src/flow-canvas/builder/components/RightPanel.tsx` (~10 lines)

---

## Issue 7: Duplicated Pages Show No Content (Critical)

### Problem Analysis
Switching to "Questions (Copy)" shows an empty page with only the default welcome message — the duplicated content is missing.

**Current duplication logic** (`EditorShell.tsx:469-493`):
```typescript
const handleDuplicateStep = useCallback((stepId: string) => {
  const stepToDuplicate = page.steps.find(s => s.id === stepId);
  if (!stepToDuplicate) return;

  const duplicatedStep = deepClone(stepToDuplicate);
  duplicatedStep.id = generateId();
  duplicatedStep.name = `${stepToDuplicate.name} (Copy)`;
  
  const regenerateIds = (obj: any) => {
    if (obj && typeof obj === 'object') {
      if (obj.id) obj.id = generateId();  // ⚠️ BUG: This mutates ALL objects with 'id', including primitives
      Object.values(obj).forEach(regenerateIds);
    }
    if (Array.isArray(obj)) {
      obj.forEach(regenerateIds);
    }
  };
  regenerateIds(duplicatedStep.frames);
  // ...
});
```

**Root cause**: The `regenerateIds` function has logic that checks `obj.id` first, which works, BUT the issue is that `deepClone` might be returning a reference rather than a true deep copy, OR the regeneration is corrupting the structure.

### Solution

1. **Use JSON-based deep clone** (guaranteed new reference):

```typescript
const duplicatedStep = JSON.parse(JSON.stringify(stepToDuplicate)) as Step;
```

2. **Fix regenerateIds to be more robust**:

```typescript
const regenerateIds = (obj: any): void => {
  if (!obj || typeof obj !== 'object') return;
  
  // If it's an array, recurse into each element
  if (Array.isArray(obj)) {
    obj.forEach(item => regenerateIds(item));
    return;
  }
  
  // If it's an object with an 'id' property, regenerate it
  if ('id' in obj && typeof obj.id === 'string') {
    obj.id = generateId();
  }
  
  // Recurse into all object values
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value && typeof value === 'object') {
      regenerateIds(value);
    }
  }
};
```

3. **Add verification toast** with content count:

```typescript
toast.success(`Page duplicated (${duplicatedStep.frames.length} sections)`);
```

**Files to modify:**
- `src/flow-canvas/builder/components/EditorShell.tsx` (~20 lines)

---

## Issue 8: Stray "FORM FIELD" and "Add section" Labels

### Problem Analysis
Clutter on the canvas from debug badges like "FORM FIELD" appearing visibly.

**Current behavior**: These are block-type badges defined in CSS:
```css
.block-type-badge {
  @apply absolute -top-5 left-2 ...
}
```

### Solution

1. **Hide badges by default**, show only on hover:

```css
/* flow-canvas/index.css */
.block-type-badge {
  @apply opacity-0 pointer-events-none;
  transition: opacity 0.15s ease;
}

.group\/block:hover > .block-type-badge,
.builder-block-selected > .block-type-badge {
  @apply opacity-100;
}
```

2. **Ensure badges are NOT shown during preview mode**:

```css
.builder-v2-canvas--preview .block-type-badge,
.builder-v2-canvas--preview .section-type-badge {
  display: none !important;
}
```

**Files to modify:**
- `src/flow-canvas/index.css` (~10 lines)

---

## Implementation Order

1. **Issue 7** (Duplicated pages empty) - Critical, affects data integrity
2. **Issue 1** (Dark sidebar stuck) - Critical, blocks editing
3. **Issue 3** (Legacy templates) - High, causes user confusion
4. **Issue 2** (Add-Section inconsistent) - High, blocks workflow
5. **Issue 6** (Toggle truncation) - Medium, visual bug
6. **Issue 4** (Phone input styling) - Medium, visual bug
7. **Issue 5** (Toolbar overlap) - Medium, UX polish
8. **Issue 8** (Stray labels) - Low, clutter

---

## Files Summary

| File | Changes | Lines |
|------|---------|-------|
| `EditorShell.tsx` | Fix duplication, copilot handlers | ~40 |
| `AIBuilderCopilot.tsx` | Add click-outside, escape handlers | ~25 |
| `sectionTemplates.ts` | Hide legacy templates | ~10 |
| `InlineSectionPicker.tsx` | Update form category | ~10 |
| `RightPanel.tsx` | Compact toggle classes | ~10 |
| `BlockActionBar.tsx` | Reposition toolbar | ~15 |
| `CanvasRenderer.tsx` | Unify Add-Section trigger | ~10 |
| `flow-canvas/index.css` | Toggle compact, badge visibility | ~20 |

**Total: ~140 lines across 8 files**

---

## Testing Checklist

After implementation:

- [ ] **Duplicate page** → Content appears in copy
- [ ] **AI Copilot** → "Hide sidebar" closes panel; click-outside closes; Escape closes
- [ ] **Add Section** → Works identically on all pages (empty or with content)
- [ ] **Template modal** → No "(Legacy)" options visible
- [ ] **Step Background toggle** → All 5 options fully visible without truncation
- [ ] **Form field added** → Input centered, readable contrast
- [ ] **Block toolbar** → Positioned outside block, no overlap
- [ ] **Preview mode** → No "FORM FIELD" badges visible
