

# Fix v3 Builder Rendering Issues

## Problems Found

Looking at the screenshot and the database data, I found several issues causing the "broken" appearance:

### Issue 1: Raw HTML Being Rendered as Text
The old builders stored rich text as HTML markup in the `content` field:
```
content: "<span style="font-weight: 700">200+ </span>STUDENTS BECAME TOGI..."
```
But `TextBlock` and `HeadingBlock` render this as plain text.

### Issue 2: Icon Names as Text
Some blocks have icon references stored as strings like `"ArrowDown"` that should render as actual icons.

### Issue 3: Data Conversion Not Extracting Content Properly
The `dataConverter.ts` extracts content directly from props, but the old format stores it differently. Some text appears with metadata tags inline.

### Issue 4: Device Frame White Background
The canvas area inside the device frame shows a white background instead of respecting the screen's background settings.

---

## Fixes Required

### 1. Update TextBlock to Render HTML Content (~15 lines)
**File: `src/funnel-builder-v3/components/blocks/TextBlock.tsx`**

```tsx
// Before
<p>{block.content}</p>

// After - sanitize and render HTML
<p dangerouslySetInnerHTML={{ __html: sanitizeContent(block.content) }} />
```

Also add logic to strip inline metadata strings (fontSize:, textAlign:, placeholder:) that got concatenated.

### 2. Update HeadingBlock to Render HTML Content (~10 lines)
**File: `src/funnel-builder-v3/components/blocks/HeadingBlock.tsx`**

Same pattern - allow HTML rendering for styled headings.

### 3. Add Icon Block Rendering (~35 lines)
**File: `src/funnel-builder-v3/components/blocks/IconBlock.tsx`**

Create a new block type for rendering icon elements with proper Lucide icon lookup.

### 4. Fix Data Converter Content Extraction (~30 lines)
**File: `src/funnel-builder-v3/utils/dataConverter.ts`**

Update `extractBlocksFromCanvasNode` to:
- Handle HTML content properly
- Map `icon` type to proper block
- Clean up inline metadata strings
- Handle payment/checkout blocks

### 5. Update BlockRenderer for Icon Type (~5 lines)
**File: `src/funnel-builder-v3/components/blocks/BlockRenderer.tsx`**

Add case for 'icon' block type.

### 6. Fix Canvas Background Styling (~10 lines)
**File: `src/funnel-builder-v3/components/Canvas.tsx`**

Ensure the device frame internal content has proper default background (white for light theme content) while the canvas area itself is dark.

---

## Summary

| File | Changes |
|------|---------|
| `TextBlock.tsx` | Add dangerouslySetInnerHTML for HTML content |
| `HeadingBlock.tsx` | Add dangerouslySetInnerHTML for HTML content |
| `IconBlock.tsx` | NEW - Render Lucide icons from content string |
| `dataConverter.ts` | Fix content extraction and metadata stripping |
| `BlockRenderer.tsx` | Add icon case |
| `Canvas.tsx` | Fix device frame background |

**Total: ~105 lines modified/added**

---

## Technical Details

### Content Sanitization Helper
```tsx
function sanitizeContent(content: string): string {
  // Strip inline metadata that got concatenated
  return content
    .replace(/\s*fontSize:\d+px\s*/g, '')
    .replace(/\s*textAlign:\w+\s*/g, '')
    .replace(/\s*placeholder:[^<]+/g, '');
}
```

### Icon Block Component
```tsx
import * as Icons from 'lucide-react';

export function IconBlock({ block }: IconBlockProps) {
  const iconName = block.content || block.props?.icon || 'HelpCircle';
  const Icon = Icons[iconName as keyof typeof Icons] || Icons.HelpCircle;
  return <Icon className="w-6 h-6" style={{ color: block.props?.color }} />;
}
```

### Data Converter Fix
Update the element type mapping to handle:
- `icon` → new IconBlock
- `payment` → embedded payment block or placeholder
- Content extraction from `props.content` with cleanup

---

## Success Criteria

1. Rich text with `<span>` styling renders properly (bold, colors, italic)
2. Icons render as actual Lucide icons, not text
3. No metadata strings visible in content
4. Device frame shows white background inside (for content) with dark canvas around it
5. All existing block types continue to work

