

# Funnel Builder Mobile-First Reconstruction

## Executive Summary

This plan transforms the existing funnel builder from a dense, desktop-oriented tool into a mobile-first, touch-friendly creative environment. The goal is to reduce visual noise, consolidate controls, and make editing feel natural on a phone while preserving all functionality.

## Current State Analysis

The existing builder (`src/flow-canvas/builder/components/EditorShell.tsx`) already has:
- A `useIsMobile()` hook detecting viewport < 768px
- Mobile sheet drawers for left/right panels
- Device preview modes (desktop/tablet/mobile)
- A dense TopToolbar with 15+ buttons visible
- Three-column layout with collapsible panels

**Key Issues Identified:**
1. TopToolbar has ~20 buttons visible simultaneously
2. Left panel shows drag handles, icons, and menus on every item
3. Right panel (inspector) uses small controls with tabs
4. Multiple floating toolbars appear on element selection
5. No bottom sheet pattern for mobile editing

---

## Phase 1: Simplified Action Bar (TopToolbar)

### Current Problems
The TopToolbar shows: Back, Logo dropdown, Add Content (+), Add Section, Text Styles, Design Mode, Grid, Theme, AI Generate, Undo, Redo, Device switcher, Preview, Collaborators, SEO, Analytics, Share, Publish.

### Proposed Changes

**Mobile (< 768px):**
```
┌─────────────────────────────────────────────────────┐
│  ←  [Page Name]              [Add +]  [Preview]  ⋮  │
└─────────────────────────────────────────────────────┘
```
- Only 3-4 visible actions: Back, Add, Preview, More (⋮)
- More menu contains: Publish, Undo/Redo, Analytics, SEO, Theme, Settings, Share
- Touch target: minimum 44px

**Tablet/Desktop:**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ←  [Logo ▾]  │  [+] [Layers] [AI ✨]  │  [Undo] [Redo]  │  [📱 💻 🖥️]  │  [Preview] [Publish]  ⋮ │
└──────────────────────────────────────────────────────────────────────────────┘
```
- Grouped by function: Creation | History | Viewport | Actions
- Overflow menu: Collaborators, SEO, Analytics, Theme, Grid, Share

**Files to modify:**
- `src/flow-canvas/builder/components/TopToolbar.tsx`
- `src/flow-canvas/builder/index.css` (or create `mobile-toolbar.css`)

---

## Phase 2: Touch-First Step List (Left Panel)

### Current Problems
- Each step row shows: drag handle, index badge, icon, name, context menu
- Dense 10-12px spacing
- Small tap targets

### Proposed Changes

**Mobile Step Card Design:**
```
┌─────────────────────────────────────────┐
│  ┌───┐                                  │
│  │ 1 │  Welcome Page                ⋮   │
│  └───┘  "Your journey starts here"      │
│                                         │
│  ┌───┐                                  │
│  │ 2 │  Email Capture               ⋮   │
│  └───┘  "Get their contact"             │
│                                         │
│         ╭───────────────────╮           │
│         │   + Add Page      │           │
│         ╰───────────────────╯           │
└─────────────────────────────────────────┘
```

**Key Changes:**
- Minimum row height: 64px (touch-friendly)
- Drag handle only visible on long-press or drag mode
- Inline icons removed; replaced with large number badges
- Context menu (duplicate/delete/rename) in overflow (⋮)
- "Add Page" as clear CTA at bottom
- Swipe-to-delete gesture support (optional enhancement)

**Desktop behavior:**
- Larger cards still, but can show more metadata
- Hover reveals drag handle

**Files to modify:**
- `src/flow-canvas/builder/components/LeftPanel.tsx`
- `src/flow-canvas/builder/components/LeftPanel.css` (new file)

---

## Phase 3: Single Contextual Edit Panel (Right Panel + Bottom Sheet)

### Current Problems
- Desktop: Fixed right panel with 4 tabs (Content/Design/Blocks/Settings)
- Mobile: Sheet drawer from right (feels desktop-ported)
- Multiple floating toolbars on selection

### Proposed Architecture

**Mobile: Bottom Sheet Inspector**
```
┌─────────────────────────────────────────┐
│              [Canvas View]              │
│                                         │
│     ┌─────────────────────────┐         │
│     │     Selected: Button    │         │
│     │  ───────────────────────│         │
│     │  Text: "Get Started"    │         │
│     │  Color: ●●●●●●●●        │         │
│     │  Size:  [S] [M] [L]     │         │
│     │                         │         │
│     │  [Delete] [Duplicate]   │         │
│     └─────────────────────────┘         │
└─────────────────────────────────────────┘
```

**Behavior:**
- Appears from bottom when element is selected
- Draggable to expand (peek → half → full)
- Tap canvas to dismiss
- Large touch controls (44px minimum)
- No tabs on mobile; show most relevant fields contextually

**Desktop: Keep floating panel but consolidate**
- One panel at a time (not overlapping toolbars)
- Tabs remain but auto-switch based on selection type

**Files to modify/create:**
- `src/flow-canvas/builder/components/MobileBottomSheet.tsx` (new)
- `src/flow-canvas/builder/components/RightPanel.tsx`
- `src/flow-canvas/builder/components/EditorShell.tsx`

---

## Phase 4: Canvas & Block Selection

### Current Problems
- Multiple "+" buttons scattered on canvas
- Hover toolbars appear on every element
- Small action buttons on selection

### Proposed Changes

**Single Add Block Action:**
- One clear "Add Block" button at insertion points
- Tapping opens a full-screen picker (mobile) or dropdown (desktop)

**Block Picker Design (Mobile):**
```
┌─────────────────────────────────────────┐
│  ← Add Content                          │
│                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │   📝    │  │   🖼️    │  │   📹    │  │
│  │  Text   │  │  Image  │  │  Video  │  │
│  └─────────┘  └─────────┘  └─────────┘  │
│                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │   📧    │  │   📱    │  │   📋    │  │
│  │  Email  │  │  Phone  │  │  Form   │  │
│  └─────────┘  └─────────┘  └─────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

- Large visual tiles (80x80px minimum)
- Categories: Capture, Content, Media, Layout
- No tiny icons; use recognizable graphics

**Selection Behavior:**
- Tap element → single outline + bottom sheet opens
- No floating toolbars on hover (mobile)
- Desktop: subtle hover outline, selection shows inline actions

**Files to modify:**
- `src/flow-canvas/builder/components/BlockPickerPanel.tsx`
- `src/flow-canvas/builder/components/CanvasRenderer.tsx`
- `src/builder_v2/EditorLayout.css` (remove `.builder-v2-hover-toolbar` on mobile)

---

## Phase 5: Navigation & Flow UX

### Add Page Flow
```
User taps "Add Page" → Full-screen template picker → Tap template → Page added
```

### Editing Flow
```
Tap page in list → Canvas updates → Tap element → Bottom sheet opens → Edit
```

### Visual Cues
- Active page highlighted with accent color
- Clear page number badges
- Step indicator: "Step 2 of 5"

---

## Technical Implementation

### New Components Needed

| Component | Purpose |
|-----------|---------|
| `MobileActionBar.tsx` | Compact top toolbar for mobile |
| `MobileBottomSheet.tsx` | Draggable inspector from bottom |
| `TouchStepCard.tsx` | Large card for step list |
| `BlockPickerGrid.tsx` | Full-screen tile picker |

### CSS Strategy

1. Create `src/flow-canvas/builder/styles/mobile.css`
2. Use CSS container queries for responsive behavior
3. Set `--touch-target-min: 44px` design token
4. Apply `touch-action: manipulation` to prevent zoom

### Breakpoints

| Breakpoint | Layout |
|------------|--------|
| < 640px | Mobile-first: bottom sheet, hamburger menu |
| 640-1024px | Tablet: side sheets, compact toolbar |
| > 1024px | Desktop: three-column, full toolbar |

---

## Migration Path

### Step 1: Mobile TopToolbar (Low Risk)
- Add mobile variant to TopToolbar
- Implement overflow menu
- No breaking changes to desktop

### Step 2: Touch Step List (Medium Risk)
- Create new component alongside existing
- Feature flag to switch
- Test drag-and-drop on touch

### Step 3: Bottom Sheet Inspector (Medium Risk)
- New component, additive
- Replace mobile right-sheet with bottom-sheet
- Keep desktop inspector unchanged

### Step 4: Canvas Cleanup (High Risk)
- Remove hover toolbars on mobile
- Consolidate add-block interactions
- Requires thorough testing

---

## Success Criteria

1. **One-handed editing on mobile** - All primary actions reachable with thumb
2. **No hunting for buttons** - Maximum 4 visible actions at once
3. **Fewer visible controls** - 50% reduction in simultaneous UI elements
4. **Touch-friendly** - All tap targets ≥ 44px
5. **Same functionality** - No features removed, just reorganized

---

## Files Overview

| File | Action |
|------|--------|
| `src/flow-canvas/builder/components/TopToolbar.tsx` | Major refactor |
| `src/flow-canvas/builder/components/LeftPanel.tsx` | Major refactor |
| `src/flow-canvas/builder/components/RightPanel.tsx` | Conditionally replaced on mobile |
| `src/flow-canvas/builder/components/EditorShell.tsx` | Update layout logic |
| `src/flow-canvas/builder/components/MobileBottomSheet.tsx` | New file |
| `src/flow-canvas/builder/components/BlockPickerPanel.tsx` | Refactor for tiles |
| `src/flow-canvas/builder/styles/mobile.css` | New file |
| `src/builder_v2/EditorLayout.css` | Add mobile media queries |

