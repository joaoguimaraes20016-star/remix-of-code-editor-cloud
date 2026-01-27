

# Fix CTA Section vs Interactive Blocks Collision

## The Problem

The SectionPicker has a **naming collision** between two categories that share the same ID `'cta'`:

| Location | ID | Label | Expected Content |
|----------|-----|-------|------------------|
| `BLOCK_CATEGORIES` | `cta` | Interactive blocks | Questions, Forms (InteractiveBlockGrid) |
| `SECTION_CATEGORIES` | `cta` | Call to Action | CTA section templates gallery |

When you click "Call to Action" in the Sections list, the `isBlockCategory()` function returns `true` because it checks if `categoryId === 'cta'`, causing it to render `InteractiveBlockGrid` instead of the CTA templates.

---

## The Fix

Rename the block category ID to avoid collision:

| Before | After |
|--------|-------|
| `{ id: 'cta', label: 'Interactive blocks' }` | `{ id: 'interactive', label: 'Interactive blocks' }` |

Also update the `isBlockCategory()` function to use the new ID.

---

## File Changes

### `SectionPicker.tsx`

**Line 29** - Change block category ID:
```typescript
// Before
{ id: 'cta', label: 'Interactive blocks', icon: 'sparkles' as const },

// After  
{ id: 'interactive', label: 'Interactive blocks', icon: 'sparkles' as const },
```

**Line 53** - Update the check function:
```typescript
// Before
function isBlockCategory(categoryId: string): boolean {
  return categoryId === 'content' || categoryId === 'cta';
}

// After
function isBlockCategory(categoryId: string): boolean {
  return categoryId === 'content' || categoryId === 'interactive';
}
```

---

## Result

After this fix:
- **"Interactive blocks"** (id: `interactive`) will show the `InteractiveBlockGrid` with Questions and Forms
- **"Call to Action"** (id: `cta`) will show the CTA section templates gallery with the 10 Perspective-style templates

