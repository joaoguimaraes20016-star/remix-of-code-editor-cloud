
# Phase 6: Complete Feature Parity with Flow-Canvas Builder

## Overview

The v3 builder currently has the foundation in place (dark theme, device frame, basic panels) but is missing critical functionality that exists in the flow-canvas builder. This plan brings feature parity by integrating the proven patterns from `flow-canvas/builder/components`.

## Gap Analysis

| Feature | Flow-Canvas | V3 Builder | Status |
|---------|-------------|------------|--------|
| Device Selector (Mobile/Tablet/Desktop) | TopToolbar.tsx | Missing | Needs adding |
| Light/Dark Editor Theme Toggle | TopToolbar.tsx | Missing | Needs adding |
| Undo/Redo Buttons | TopToolbar.tsx | Missing | Needs adding |
| Breakpoint Indicator | TopToolbar.tsx | Missing | Needs adding |
| Save Status Indicator | TopToolbar.tsx | Missing | Needs adding |
| Pages/Layers Tab Toggle | EditorShell.tsx | Missing | Needs adding |
| Panel Collapse Toggle | EditorShell.tsx | Missing | Needs adding |
| Desktop Device Frame | DeviceFrame.tsx | CSS exists, not wired | Needs wiring |
| Tablet Device Frame | DeviceFrame.tsx | CSS exists, not wired | Needs wiring |
| Keyboard Shortcuts (Undo/Redo) | EditorShell.tsx | Missing | Needs adding |
| AI Copilot Button | TopToolbar.tsx | Missing | Future |
| Grid Toggle | TopToolbar.tsx | Missing | Needs adding |

---

## Implementation Plan

### 1. Enhanced Toolbar Component (~150 lines)
**File:** `src/funnel-builder-v3/components/Toolbar.tsx`

Transform from basic to feature-complete toolbar with:

```tsx
interface ToolbarProps {
  funnelName: string;
  previewMode: boolean;
  isDirty: boolean;
  onTogglePreview: () => void;
  onPublish?: () => void;
  onSave: () => void;
  onBack?: () => void;
  // NEW: Device mode
  deviceMode: 'mobile' | 'tablet' | 'desktop';
  onDeviceModeChange: (mode: 'mobile' | 'tablet' | 'desktop') => void;
  // NEW: Theme toggle
  editorTheme: 'light' | 'dark';
  onThemeToggle: () => void;
  // NEW: Undo/Redo
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  // NEW: Save status
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
}
```

Add device selector, theme toggle, undo/redo buttons:

```tsx
{/* Device Mode Switcher */}
<div className="builder-v3-device-selector">
  <button
    onClick={() => onDeviceModeChange('desktop')}
    className={cn("builder-v3-device-btn", deviceMode === 'desktop' && "builder-v3-device-btn--active")}
  >
    <Monitor className="w-4 h-4" />
  </button>
  <button
    onClick={() => onDeviceModeChange('tablet')}
    className={cn("builder-v3-device-btn", deviceMode === 'tablet' && "builder-v3-device-btn--active")}
  >
    <Tablet className="w-4 h-4" />
  </button>
  <button
    onClick={() => onDeviceModeChange('mobile')}
    className={cn("builder-v3-device-btn", deviceMode === 'mobile' && "builder-v3-device-btn--active")}
  >
    <Smartphone className="w-4 h-4" />
  </button>
</div>

{/* Editor Theme Toggle */}
<button onClick={onThemeToggle} className="builder-v3-toolbar-btn">
  {editorTheme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
</button>

{/* Undo/Redo */}
<div className="builder-v3-undo-redo">
  <button onClick={onUndo} disabled={!canUndo} className="builder-v3-toolbar-btn">
    <Undo2 className="w-4 h-4" />
  </button>
  <button onClick={onRedo} disabled={!canRedo} className="builder-v3-toolbar-btn">
    <Redo2 className="w-4 h-4" />
  </button>
</div>
```

### 2. Multi-Device Canvas Component (~80 lines)
**File:** `src/funnel-builder-v3/components/Canvas.tsx`

Add device mode support with proper frame switching:

```tsx
interface CanvasProps {
  screen: Screen | null;
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onReorderBlocks: (blockIds: string[]) => void;
  previewMode: boolean;
  settings: FunnelSettings;
  // NEW: Device mode
  deviceMode: 'mobile' | 'tablet' | 'desktop';
}

// Render different device frames based on mode
{deviceMode === 'desktop' && (
  <div className="builder-v3-device-frame builder-v3-device-frame--desktop">
    <div className="builder-v3-browser-bar">
      <div className="builder-v3-traffic-lights">
        <span className="builder-v3-traffic-light builder-v3-traffic-light--red" />
        <span className="builder-v3-traffic-light builder-v3-traffic-light--yellow" />
        <span className="builder-v3-traffic-light builder-v3-traffic-light--green" />
      </div>
      <div className="builder-v3-url-bar">yourfunnel.com</div>
    </div>
    <div className="builder-v3-device-screen">{/* Content */}</div>
  </div>
)}

{deviceMode === 'tablet' && (
  <div className="builder-v3-device-frame builder-v3-device-frame--tablet">
    <div className="builder-v3-device-screen">{/* Content */}</div>
    <div className="builder-v3-device-home-bar">
      <div className="builder-v3-home-indicator" />
    </div>
  </div>
)}

{deviceMode === 'mobile' && (
  <div className="builder-v3-device-frame builder-v3-device-frame--mobile">
    <div className="builder-v3-phone-notch">
      <div className="builder-v3-phone-notch-inner" />
    </div>
    <div className="builder-v3-device-screen">{/* Content */}</div>
    <div className="builder-v3-device-home-bar">
      <div className="builder-v3-home-indicator" />
    </div>
  </div>
)}
```

### 3. Enhanced Left Panel with Tab Toggle (~60 lines)
**File:** `src/funnel-builder-v3/components/LeftPanel.tsx`

Add Pages/Layers tab toggle and collapse button:

```tsx
interface LeftPanelProps {
  screens: Screen[];
  selectedScreenId: string;
  onSelectScreen: (screenId: string) => void;
  // ... existing props
  // NEW: Collapse support
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// Tab state
const [activeTab, setActiveTab] = useState<'pages' | 'layers'>('pages');

// Header with tabs and collapse
<div className="builder-v3-panel-header">
  <div className="builder-v3-panel-tabs">
    <button
      onClick={() => setActiveTab('pages')}
      className={cn("builder-v3-panel-tab", activeTab === 'pages' && "builder-v3-panel-tab--active")}
    >
      Pages
    </button>
    <button
      onClick={() => setActiveTab('layers')}
      className={cn("builder-v3-panel-tab", activeTab === 'layers' && "builder-v3-panel-tab--active")}
    >
      Layers
    </button>
  </div>
  <button onClick={onToggleCollapse} className="builder-v3-toolbar-btn">
    <PanelLeftClose className="w-4 h-4" />
  </button>
</div>
```

### 4. Enhanced Editor Shell with State (~100 lines)
**File:** `src/funnel-builder-v3/components/Editor.tsx`

Add device mode, theme toggle, and undo/redo state:

```tsx
// New state
const [deviceMode, setDeviceMode] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
const [editorTheme, setEditorTheme] = useState<'light' | 'dark'>('dark');
const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

// Keyboard shortcuts for undo/redo
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const isModifier = e.metaKey || e.ctrlKey;
    if (!isModifier) return;
    
    if (e.key === 'z' && !e.shiftKey && canUndo) {
      e.preventDefault();
      undo();
    }
    if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
      e.preventDefault();
      if (canRedo) redo();
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [canUndo, canRedo, undo, redo]);

// Sync theme to document
useEffect(() => {
  document.documentElement.classList.toggle('dark', editorTheme === 'dark');
}, [editorTheme]);
```

### 5. Additional CSS for New Features (~80 lines)
**File:** `src/funnel-builder-v3/styles/builder.css`

Add missing device selector, theme, and panel collapse styles:

```css
/* Device selector */
.builder-v3-device-selector {
  display: flex;
  gap: 4px;
  background: hsl(var(--builder-v3-surface-hover));
  padding: 3px;
  border-radius: 8px;
}

.builder-v3-device-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: 5px;
  color: hsl(var(--builder-v3-text-muted));
  cursor: pointer;
  transition: all var(--builder-v3-transition-fast);
}

.builder-v3-device-btn:hover {
  color: hsl(var(--builder-v3-text-secondary));
}

.builder-v3-device-btn--active {
  background: hsl(var(--builder-v3-surface-active));
  color: hsl(var(--builder-v3-text));
  box-shadow: 0 1px 3px hsl(0 0% 0% / 0.2);
}

/* Breakpoint indicator */
.builder-v3-breakpoint-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.builder-v3-breakpoint-indicator .breakpoint-label {
  font-weight: 500;
  color: hsl(var(--builder-v3-accent));
}

.builder-v3-breakpoint-indicator .breakpoint-width {
  color: hsl(var(--builder-v3-text-muted));
}

/* Panel collapse toggle */
.builder-v3-panel-toggle {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 48px;
  background: hsl(var(--builder-v3-surface));
  border: 1px solid hsl(var(--builder-v3-border));
  border-radius: 0 8px 8px 0;
  color: hsl(var(--builder-v3-text-muted));
  cursor: pointer;
  z-index: 100;
  transition: all var(--builder-v3-transition);
  box-shadow: 2px 0 8px hsl(0 0% 0% / 0.2);
}

.builder-v3-panel-toggle--left {
  left: 0;
}

.builder-v3-panel-toggle--right {
  right: 0;
  border-radius: 8px 0 0 8px;
}

.builder-v3-panel-toggle:hover {
  background: hsl(var(--builder-v3-surface-hover));
  color: hsl(var(--builder-v3-text));
}

/* Collapsed panel state */
.builder-v3-left-panel--collapsed,
.builder-v3-right-panel--collapsed {
  width: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
}

/* Editor shell grid layout */
.builder-v3-editor-shell {
  display: grid;
  grid-template-columns: 260px 1fr 320px;
  height: 100%;
  transition: grid-template-columns 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

.builder-v3-editor-shell--left-collapsed {
  grid-template-columns: 0 1fr 320px;
}

.builder-v3-editor-shell--right-collapsed {
  grid-template-columns: 260px 1fr 0;
}

.builder-v3-editor-shell--both-collapsed {
  grid-template-columns: 0 1fr 0;
}
```

### 6. Light Theme Support (~40 lines)
**File:** `src/funnel-builder-v3/styles/builder.css`

Add light theme token overrides:

```css
/* Light theme overrides */
[data-theme="builder-light"] {
  --builder-v3-bg: 0 0% 98%;
  --builder-v3-surface: 0 0% 100%;
  --builder-v3-surface-hover: 0 0% 96%;
  --builder-v3-surface-active: 0 0% 92%;
  --builder-v3-border: 0 0% 88%;
  --builder-v3-border-subtle: 0 0% 92%;
  --builder-v3-text: 0 0% 10%;
  --builder-v3-text-secondary: 0 0% 40%;
  --builder-v3-text-muted: 0 0% 55%;
  --builder-v3-text-dim: 0 0% 70%;
  --builder-v3-canvas-bg: 0 0% 94%;
}
```

---

## Files to Modify

| File | Type | Changes | Est. Lines |
|------|------|---------|------------|
| `components/Toolbar.tsx` | Modify | Device selector, theme toggle, undo/redo | ~150 |
| `components/Canvas.tsx` | Modify | Multi-device frame support | ~80 |
| `components/LeftPanel.tsx` | Modify | Pages/Layers tabs, collapse | ~60 |
| `components/Editor.tsx` | Modify | State management, keyboard shortcuts | ~100 |
| `styles/builder.css` | Modify | Device selector, panel toggle, light theme | ~120 |

**Total: ~510 lines modified**

---

## Visual Outcome

After this phase:

1. **Device Selector** - Mobile/Tablet/Desktop toggle in toolbar center
2. **Light/Dark Theme Toggle** - Sun/Moon button to switch editor appearance
3. **Undo/Redo Controls** - Buttons with keyboard shortcuts (Cmd+Z, Cmd+Shift+Z)
4. **Breakpoint Indicator** - Shows "Mobile 390px" or "Desktop 1024px"
5. **Save Status** - "Saving...", "Saved", "Error" indicator
6. **Pages/Layers Tabs** - Toggle between screen list and layer tree
7. **Panel Collapse** - Buttons to hide left/right panels for focus
8. **Full Device Frames** - Desktop browser bar, tablet, mobile with notch
9. **Keyboard Shortcuts** - Working undo/redo via keyboard

---

## Technical Architecture

The v3 builder will follow the same proven patterns from flow-canvas:

```text
Editor.tsx (Shell)
├── State Management
│   ├── deviceMode: 'mobile' | 'tablet' | 'desktop'
│   ├── editorTheme: 'light' | 'dark'
│   ├── leftPanelCollapsed: boolean
│   ├── rightPanelCollapsed: boolean
│   └── useFunnelState (existing)
│
├── Toolbar.tsx
│   ├── Back button
│   ├── Funnel name
│   ├── Undo/Redo
│   ├── Device selector
│   ├── Theme toggle
│   ├── Preview toggle
│   └── Save/Publish
│
├── LeftPanel.tsx
│   ├── Pages/Layers tabs
│   ├── Screen list (Pages)
│   ├── Layer tree (Layers) [future]
│   └── Collapse button
│
├── Canvas.tsx
│   ├── Device frame (mobile/tablet/desktop)
│   ├── Screen content
│   └── Block selection
│
└── RightPanel.tsx
    ├── Block/Screen tabs
    ├── Block inspector
    └── Collapse button
```

---

## Success Criteria

1. Device selector switches between mobile/tablet/desktop frames
2. Theme toggle changes editor panels between light/dark
3. Undo/Redo buttons work with visual feedback
4. Keyboard shortcuts (Cmd+Z, Cmd+Shift+Z) function correctly
5. Panels can be collapsed and restored
6. All existing functionality remains intact
7. Smooth 250ms transitions on panel collapse
