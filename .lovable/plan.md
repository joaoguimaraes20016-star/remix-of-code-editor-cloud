
# Phase 5: Inspector Panel Styling Refinements

## Overview

This phase focuses on polishing the v3 builder's inspector (Right Panel) to match the refined, professional aesthetic of the flow-canvas builder. While the foundational CSS tokens and structure are in place from Phase 4, the inspector controls and sections need enhanced styling, better visual hierarchy, and improved UX patterns.

## Current State Analysis

### What's Working
- CSS tokens are aligned with builder_v2 palette
- Basic dark theme is applied
- Inspector controls exist (SelectField, AlignmentControl, etc.)
- CollapsibleSection component has proper structure

### What Needs Improvement

| Area | Current Issue | Target State |
|------|---------------|--------------|
| Inspector sections | Basic styling, no icons | Enhanced headers with icons, badges, proper hover states |
| Control inputs | Inconsistent sizing | Unified 32px height, proper padding |
| Toggle pills | Basic active states | Enhanced contrast with shadow on active |
| Color picker | Basic swatch | Enhanced with gradient support indicator |
| Block editor | Inline controls mixed | Organized into collapsible sections |
| Empty states | Missing | Professional centered prompts |
| Scrollbar | Default | Thin, themed, hidden until hover |

---

## Implementation Plan

### 1. Enhanced Inspector CSS (~80 lines)
**File:** `src/funnel-builder-v3/styles/builder.css`

Add refined inspector-specific styles:

```css
/* Enhanced inspector field groups */
.builder-v3-field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.builder-v3-field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

/* Inspector control sizing consistency */
.builder-v3-control-sm {
  height: 28px;
  font-size: 12px;
}

.builder-v3-control-md {
  height: 32px;
  font-size: 13px;
}

/* Enhanced color swatch */
.builder-v3-color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 2px solid hsl(var(--builder-v3-border));
  cursor: pointer;
  transition: all var(--builder-v3-transition-fast);
}

.builder-v3-color-swatch:hover {
  border-color: hsl(var(--builder-v3-accent));
  transform: scale(1.05);
}

.builder-v3-color-swatch--gradient {
  position: relative;
}

.builder-v3-color-swatch--gradient::after {
  content: '∇';
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background: hsl(var(--builder-v3-accent));
  color: white;
  font-size: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Inspector action buttons */
.builder-v3-inspector-action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: var(--builder-v3-radius-sm);
  font-size: 12px;
  font-weight: 500;
  transition: all var(--builder-v3-transition-fast);
}

.builder-v3-inspector-action--primary {
  background: hsl(var(--builder-v3-accent));
  color: white;
}

.builder-v3-inspector-action--secondary {
  background: hsl(var(--builder-v3-surface-hover));
  color: hsl(var(--builder-v3-text-secondary));
  border: 1px solid hsl(var(--builder-v3-border));
}

.builder-v3-inspector-action--danger {
  color: hsl(var(--builder-v3-error));
}

.builder-v3-inspector-action--danger:hover {
  background: hsl(var(--builder-v3-error) / 0.1);
}
```

### 2. Refactor BlockStyleEditor with Collapsible Sections (~120 lines)
**File:** `src/funnel-builder-v3/components/RightPanel.tsx`

Replace the flat control layout with organized collapsible sections:

```tsx
function BlockStyleEditor({ block, onUpdate, onDelete, onDuplicate }) {
  return (
    <div className="space-y-0">
      {/* Quick Actions Bar */}
      <div className="flex gap-2 p-4 border-b border-[hsl(var(--builder-v3-border-subtle))]">
        <button className="builder-v3-inspector-action builder-v3-inspector-action--secondary flex-1">
          <Copy size={14} /> Duplicate
        </button>
        <button className="builder-v3-inspector-action builder-v3-inspector-action--danger">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Content Section - for text/heading/button */}
      {['heading', 'text', 'button'].includes(block.type) && (
        <CollapsibleSection 
          title="Content" 
          icon={<Type size={14} />}
          defaultOpen
        >
          {/* Content controls */}
        </CollapsibleSection>
      )}

      {/* Typography Section */}
      {['heading', 'text'].includes(block.type) && (
        <CollapsibleSection 
          title="Typography" 
          icon={<Type size={14} />}
        >
          {/* Size, alignment, weight */}
        </CollapsibleSection>
      )}

      {/* Appearance Section */}
      <CollapsibleSection 
        title="Appearance" 
        icon={<Palette size={14} />}
      >
        {/* Colors, shadows, etc */}
      </CollapsibleSection>
    </div>
  );
}
```

### 3. Enhanced Toggle Pills (~40 lines)
**File:** `src/funnel-builder-v3/styles/builder.css`

Add refined toggle pill styling matching flow-canvas:

```css
/* Toggle pills - enhanced active contrast */
.builder-v3-toggle-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px;
  border-radius: var(--builder-v3-radius-md);
  background: hsl(var(--builder-v3-surface-hover));
  border: 1px solid hsl(var(--builder-v3-border-subtle));
}

.builder-v3-toggle-option--active {
  background: hsl(var(--builder-v3-accent));
  color: white;
  font-weight: 500;
  box-shadow: 
    0 1px 3px hsl(0 0% 0% / 0.2),
    0 0 0 1px hsl(var(--builder-v3-accent) / 0.3);
}

.builder-v3-toggle-option--inactive {
  color: hsl(var(--builder-v3-text-dim));
  background: transparent;
}

.builder-v3-toggle-option--inactive:hover {
  color: hsl(var(--builder-v3-text));
  background: hsl(var(--builder-v3-surface-active));
}
```

### 4. Update CollapsibleSection with Enhanced Styling (~25 lines)
**File:** `src/funnel-builder-v3/components/inspector/layout/CollapsibleSection.tsx`

Enhance the component with better visual hierarchy:

```tsx
// Add section icon badge support
// Add subtle border-left accent on expanded sections
// Improve animation easing
```

### 5. Inspector Breadcrumb Component (~60 lines)
**File:** `src/funnel-builder-v3/components/inspector/layout/InspectorBreadcrumb.tsx` (NEW)

Create a breadcrumb component showing selection context:

```tsx
export function InspectorBreadcrumb({ 
  screenName, 
  blockType,
  onClearSelection 
}) {
  return (
    <div className="builder-v3-inspector-breadcrumb">
      <span className="builder-v3-breadcrumb-item">{screenName}</span>
      <ChevronRight className="builder-v3-breadcrumb-separator" />
      <span className="builder-v3-breadcrumb-item builder-v3-breadcrumb-item--active">
        {blockType}
      </span>
      <button onClick={onClearSelection} className="builder-v3-breadcrumb-clear">
        <X size={12} />
      </button>
    </div>
  );
}
```

### 6. Add Section Empty State Component (~35 lines)
**File:** `src/funnel-builder-v3/components/inspector/layout/EmptyState.tsx` (NEW)

```tsx
export function EmptyState({ 
  icon, 
  title, 
  description,
  action 
}) {
  return (
    <div className="builder-v3-inspector-empty">
      {icon}
      <h4>{title}</h4>
      <p>{description}</p>
      {action}
    </div>
  );
}
```

---

## Files to Create/Modify

| File | Type | Changes | Est. Lines |
|------|------|---------|------------|
| `styles/builder.css` | Modify | Enhanced inspector styles, toggle pills, action buttons | ~120 |
| `components/RightPanel.tsx` | Modify | Refactor with collapsible sections, breadcrumb | ~100 |
| `inspector/layout/CollapsibleSection.tsx` | Modify | Enhanced styling, icon badge | ~25 |
| `inspector/layout/InspectorBreadcrumb.tsx` | Create | Selection breadcrumb | ~60 |
| `inspector/layout/EmptyState.tsx` | Create | Empty state component | ~35 |
| `inspector/index.ts` | Modify | Export new components | ~5 |

**Total: ~345 lines**

---

## Visual Improvements

After this phase:

1. **Organized Inspector** - Block properties grouped in collapsible sections (Content, Typography, Appearance)
2. **Visual Hierarchy** - Section headers with icons, proper 11px labels, 9px hints
3. **Enhanced Controls** - Consistent 32px height, proper active states with shadows
4. **Selection Context** - Breadcrumb showing Screen > Block hierarchy
5. **Professional Empty States** - Centered prompts with icons when no selection
6. **Refined Scrolling** - Thin themed scrollbar, smooth overflow handling
7. **Quick Actions** - Duplicate/Delete bar at top of inspector

---

## Technical Details

### Control Sizing System
```css
--builder-v3-control-height-sm: 28px;  /* Compact controls */
--builder-v3-control-height-md: 32px;  /* Default controls */
--builder-v3-control-height-lg: 36px;  /* Prominent controls */
```

### Typography Hierarchy (Inspector)
```
Section headers: 11px, medium, uppercase, tracking-wider
Field labels: 11px, medium, text-muted
Input text: 13px, regular
Hints: 9px, normal, text-dim
```

### Transition Consistency
All inspector interactions use `var(--builder-v3-transition-fast)` (120ms) for snappy feedback.

---

## Success Criteria

1. Block properties are organized in logical collapsible sections
2. All controls have consistent sizing and spacing
3. Toggle pills have clear active/inactive contrast
4. Selection breadcrumb shows current context
5. Empty states appear when appropriate
6. Scrolling is smooth with themed scrollbar
7. All interactions feel responsive (120ms transitions)
