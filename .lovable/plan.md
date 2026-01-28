
# Phase: Transfer Original Builder v2 Aesthetic to v3

## Overview

The v3 builder currently has CSS tokens defined but isn't visually matching the original builder_v2 "Fanbasis-like" dark charcoal aesthetic. We'll align the v3 builder with the established, polished visual style from `EditorLayout.css` while making subtle enhancements for smoother transitions and interactions.

## Key Visual Differences to Fix

| Area | Current v3 | Original Builder v2 (Target) |
|------|-----------|------------------------------|
| Token Values | `220 13% 8%` (slightly off) | `225 12% 10%` (established palette) |
| Device Frame | Basic rounded box | Realistic phone with notch, shadows, reflections |
| Screen List Items | Simple hover/selected | Index badge, drag handle, icon, proper accent glow |
| Panel Tabs | Generic pills | Proper dark surface with shadow on active |
| Canvas Background | Plain dark | Gradient with subtle radial highlight |
| Scrollbars | Basic | Thin, themed, hidden until hover |
| Transitions | 150-200ms | Smooth 150ms ease with proper easing curves |

---

## Implementation Plan

### 1. Update CSS Tokens to Match Builder v2 (~50 lines)
**File:** `src/funnel-builder-v3/styles/builder.css`

Replace v3 tokens to exactly match the builder_v2 values:

```css
:root {
  /* Match builder_v2 exactly */
  --builder-v3-bg: 225 12% 10%;           /* was 220 13% 8% */
  --builder-v3-surface: 225 12% 14%;      /* was 220 13% 10% */
  --builder-v3-surface-hover: 225 10% 18%;
  --builder-v3-surface-active: 225 8% 22%;
  --builder-v3-border: 225 8% 20%;        /* was 220 13% 16% */
  --builder-v3-border-subtle: 225 8% 16%;
  
  /* Text hierarchy from builder_v2 */
  --builder-v3-text: 210 20% 96%;
  --builder-v3-text-secondary: 215 16% 65%;
  --builder-v3-text-muted: 215 12% 50%;
  --builder-v3-text-dim: 215 8% 40%;
  
  /* Canvas - match gradient effect */
  --builder-v3-canvas-bg: 225 12% 6%;
}
```

### 2. Import Builder v2 EditorLayout.css Patterns (~100 lines)
**File:** `src/funnel-builder-v3/styles/builder.css`

Add the polished patterns from builder_v2:

**Device Frame with Realistic Shadows:**
```css
.builder-v3-device-frame--mobile {
  width: min(375px, calc(100vw - 560px));
  background: hsl(240 6% 12%);
  border-radius: 52px;
  padding: 14px;
  border: 3px solid hsl(240 4% 24%);
  box-shadow: 
    0 50px 100px -20px hsl(0 0% 0% / 0.5),
    0 30px 60px -30px hsl(0 0% 0% / 0.4),
    inset 0 1px 0 0 hsl(0 0% 100% / 0.06),
    inset 0 -1px 0 0 hsl(0 0% 0% / 0.2);
}
```

**Canvas Viewport with Radial Gradient:**
```css
.builder-v3-canvas-viewport {
  background: var(--builder-v3-canvas-bg);
  background-image: radial-gradient(
    circle at 50% 0%, 
    rgba(99, 102, 241, 0.03) 0%, 
    transparent 50%
  );
}
```

**Screen List Item with Index Badge:**
```css
.builder-v3-screen-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  transition: all 150ms ease;
}

.builder-v3-screen-item--active {
  background: hsl(217 91% 60% / 0.12);
}

.builder-v3-screen-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: hsl(var(--builder-v3-surface-active));
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.builder-v3-screen-item--active .builder-v3-screen-index {
  background: hsl(var(--builder-v3-accent));
  color: white;
}
```

### 3. Update LeftPanel Component (~40 lines)
**File:** `src/funnel-builder-v3/components/LeftPanel.tsx`

Apply the enhanced screen item pattern with index badges:

```tsx
<div className="builder-v3-screen-item builder-v3-screen-item--active">
  <GripVertical className="builder-v3-drag-handle" />
  <span className="builder-v3-screen-index">{index + 1}</span>
  <Icon className="builder-v3-screen-icon" />
  <span className="builder-v3-screen-name">{screen.name}</span>
</div>
```

### 4. Update Canvas Component (~30 lines)
**File:** `src/funnel-builder-v3/components/Canvas.tsx`

Use the enhanced device frame and canvas viewport patterns:

```tsx
<div className="builder-v3-canvas-viewport">
  <div className="builder-v3-device-frame builder-v3-device-frame--mobile">
    <div className="builder-v3-device-notch" />
    <div className="builder-v3-device-screen">
      {/* Content */}
    </div>
    <div className="builder-v3-device-home-bar">
      <div className="builder-v3-device-home-indicator" />
    </div>
  </div>
</div>
```

### 5. Update Toolbar Component (~25 lines)
**File:** `src/funnel-builder-v3/components/Toolbar.tsx`

Match the builder_v2 toolbar with proper button grouping and dividers:

```tsx
<header className="builder-v3-toolbar">
  {/* Left: Back + Title */}
  <div className="builder-v3-toolbar-left">...</div>
  
  {/* Center: Device selector (optional) */}
  <div className="builder-v3-device-selector">...</div>
  
  {/* Right: Actions with divider */}
  <div className="builder-v3-toolbar-right">
    <div className="builder-v3-toolbar-divider" />
    {/* Buttons */}
  </div>
</header>
```

### 6. Update RightPanel Tabs (~35 lines)
**File:** `src/funnel-builder-v3/components/RightPanel.tsx`

Use the proper panel tab styling from builder_v2:

```css
.builder-v3-panel-tabs {
  display: flex;
  gap: 4px;
  background: hsl(var(--builder-v3-surface-hover));
  padding: 3px;
  border-radius: 8px;
}

.builder-v3-tab--active {
  background: hsl(var(--builder-v3-surface-active));
  box-shadow: 0 1px 3px hsl(0 0% 0% / 0.2);
}
```

---

## Enhanced Additions (Smoother)

### Transition Improvements
All interactive elements get smooth easing:
```css
transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
```

### Selection State Refinements
Cyan/blue outline matching Perspective style:
```css
.builder-v3-selectable:hover > .builder-v3-overlay {
  border-color: rgba(59, 130, 246, 0.4);
}

.builder-v3-selected > .builder-v3-overlay {
  border-color: #3b82f6;
}
```

### Empty State Polish
Match the builder_v2 centered prompt style:
```css
.builder-v3-empty-page-add-btn {
  width: 64px;
  height: 64px;
  background: rgba(59, 130, 246, 0.15);
  border: 2px dashed rgba(59, 130, 246, 0.4);
  border-radius: 16px;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.builder-v3-empty-page-add-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.2);
}
```

---

## Files to Modify

| File | Changes | Est. Lines |
|------|---------|------------|
| `styles/builder.css` | Token alignment + device frame + canvas + panels | ~150 |
| `components/LeftPanel.tsx` | Screen items with index badges | ~40 |
| `components/Canvas.tsx` | Device frame structure | ~30 |
| `components/Toolbar.tsx` | Proper grouping/dividers | ~25 |
| `components/RightPanel.tsx` | Tab styling refinement | ~35 |

**Total: ~280 lines modified**

---

## Visual Outcome

After this phase:
1. **Exact match** to builder_v2 dark charcoal palette
2. **Realistic phone device frame** with proper shadows/reflections
3. **Polished screen list** with index badges and accent glows
4. **Canvas with radial gradient** highlight for depth
5. **Smooth 150ms transitions** on all interactions
6. **Cyan/blue selection outlines** matching Perspective style
7. **Professional empty states** with dashed add buttons

The v3 builder will look and feel identical to the original, but with cleaner code organization and subtle enhancements.
