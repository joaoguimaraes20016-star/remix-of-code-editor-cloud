

# Phase 4: Apply Flow Canvas UI Theme to v3 Builder

## Overview

Transform the funnel-builder-v3 components from their current generic light-themed look to the polished, professional **dark charcoal "Fanbasis-like" aesthetic** used in the flow-canvas builder, while maintaining **perspective parity** (the simple, clean editing feel).

## Design Philosophy

**Complex under the hood, simple to use:**
- Dark charcoal panels (HSL 220 13% 8-10%) - matches flow-canvas
- Blue accent system (HSL 217 91% 60%) - brand consistency
- Text hierarchy: bright → secondary → muted → dim
- Clean, minimal chrome that stays out of the way
- Power is hidden until needed

## Files to Modify

| File | Changes | Est. Lines |
|------|---------|------------|
| `Editor.tsx` | Shell background, data-theme | ~15 |
| `Toolbar.tsx` | Toolbar buttons, dividers, preview toggle | ~60 |
| `LeftPanel.tsx` | Panel, screen items, scrollbar | ~70 |
| `RightPanel.tsx` | Panel, tabs, block buttons, inputs | ~100 |
| `Canvas.tsx` | Canvas bg, device frame classes | ~40 |
| `BlockRenderer.tsx` | Selection state classes | ~20 |

**Total: ~305 lines modified**

---

## Implementation Details

### 1. Editor.tsx - Shell Container (~15 lines)

Current:
```tsx
<div className="h-screen flex flex-col bg-background">
  ...
  <div className="flex-1 flex overflow-hidden">
```

Updated:
```tsx
<div className="h-screen flex flex-col bg-[hsl(var(--builder-v3-bg))]" data-theme="builder">
  ...
  <div className="flex-1 flex overflow-hidden bg-[hsl(var(--builder-v3-canvas-bg))]">
```

Key changes:
- Root: `bg-background` → `bg-[hsl(var(--builder-v3-bg))]`
- Add `data-theme="builder"` for CSS cascade
- Main area: Add `bg-[hsl(var(--builder-v3-canvas-bg))]` for dark canvas

---

### 2. Toolbar.tsx - Top Bar (~60 lines)

Current:
```tsx
<header className="h-14 border-b border-border bg-card ...">
```

Updated structure:
```tsx
<header className="h-14 border-b border-[hsl(var(--builder-v3-border))] bg-[hsl(var(--builder-v3-surface))] ...">
  {/* Left section */}
  <div className="flex items-center gap-3">
    {/* Back button - ghost style */}
    <Button variant="ghost" ... className="text-[hsl(var(--builder-v3-text-muted))] hover:text-[hsl(var(--builder-v3-text))] hover:bg-[hsl(var(--builder-v3-surface-hover))]">
    
    {/* Title */}
    <h1 className="font-semibold text-[hsl(var(--builder-v3-text))] ...">
    
    {/* Dirty indicator */}
    <span className="text-xs text-[hsl(var(--builder-v3-text-dim))]">(unsaved)</span>
  </div>

  {/* Center: Preview Toggle - flow-canvas style */}
  <button className={cn(
    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
    previewMode 
      ? 'bg-[hsl(var(--builder-v3-accent)/0.15)] text-[hsl(var(--builder-v3-accent))] ring-1 ring-[hsl(var(--builder-v3-accent)/0.3)]' 
      : 'text-[hsl(var(--builder-v3-text-muted))] hover:text-[hsl(var(--builder-v3-text))] hover:bg-[hsl(var(--builder-v3-surface-hover))]'
  )}>
    {previewMode ? (
      <>
        <Eye /> Testing · <span className="hover:text-[hsl(var(--builder-v3-accent))]">Back to Edit</span>
      </>
    ) : (
      <><Play /> Preview</>
    )}
  </button>

  {/* Right: Save + Publish with dividers */}
  <div className="flex items-center gap-2">
    <div className="w-px h-5 bg-[hsl(var(--builder-v3-border))]" /> {/* divider */}
    
    <Button className="bg-[hsl(var(--builder-v3-surface-hover))] text-[hsl(var(--builder-v3-text-muted))] hover:text-[hsl(var(--builder-v3-text))] hover:bg-[hsl(var(--builder-v3-surface-active))]">
      Save
    </Button>
    
    <Button className="bg-[hsl(var(--builder-v3-accent))] text-white hover:brightness-110">
      Publish
    </Button>
  </div>
</header>
```

Key patterns from flow-canvas:
- `.toolbar-btn` pattern: `bg-builder-surface-hover text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-active`
- `.toolbar-divider`: `w-px h-5 bg-builder-border`
- Preview toggle: Accent glow when active, "Testing · Back to Edit" text pattern

---

### 3. LeftPanel.tsx - Screen List (~70 lines)

Current:
```tsx
<div className="w-64 border-r border-border bg-card ...">
```

Updated structure:
```tsx
<div className="w-64 border-r border-[hsl(var(--builder-v3-border))] bg-[hsl(var(--builder-v3-surface))] flex flex-col shrink-0">
  {/* Header */}
  <div className="h-12 px-4 flex items-center justify-between border-b border-[hsl(var(--builder-v3-border-subtle))]">
    <span className="text-sm font-medium text-[hsl(var(--builder-v3-text))]">Screens</span>
    <Button className="h-7 w-7 bg-transparent text-[hsl(var(--builder-v3-text-muted))] hover:text-[hsl(var(--builder-v3-text))] hover:bg-[hsl(var(--builder-v3-surface-hover))]">
      <Plus />
    </Button>
  </div>

  {/* ScrollArea with custom scrollbar */}
  <ScrollArea className="flex-1 builder-v3-scroll">
    <div className="p-2 space-y-1">
      {screens.map((screen, index) => (
        <div
          className={cn(
            'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150',
            isSelected 
              ? 'bg-[hsl(var(--builder-v3-accent)/0.15)] text-[hsl(var(--builder-v3-accent))]' 
              : 'bg-[hsl(var(--builder-v3-surface))] hover:bg-[hsl(var(--builder-v3-surface-hover))] text-[hsl(var(--builder-v3-text-secondary))]'
          )}
        >
          {/* Drag Handle */}
          <GripVertical className="w-3 h-3 text-[hsl(var(--builder-v3-text-dim))] opacity-0 group-hover:opacity-100" />
          
          {/* Icon */}
          <Icon className={cn(
            'h-4 w-4 shrink-0',
            isSelected ? 'text-[hsl(var(--builder-v3-accent))]' : 'text-[hsl(var(--builder-v3-text-muted))]'
          )} />
          
          {/* Name */}
          <span className={cn(
            'flex-1 text-sm truncate',
            isSelected && 'font-medium'
          )}>
            {index + 1}. {screen.name}
          </span>
          
          {/* Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[hsl(var(--builder-v3-surface-active))]">
              <MoreVertical className="h-3 w-3 text-[hsl(var(--builder-v3-text-muted))]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[hsl(var(--builder-v3-surface))] border-[hsl(var(--builder-v3-border))]">
              ...
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  </ScrollArea>
</div>
```

Key patterns from flow-canvas:
- Selected state: `bg-builder-accent/15 text-builder-accent`
- Hover state: `bg-builder-surface-hover text-builder-text-secondary`
- Drag handle: Dim color, opacity-0 → opacity-100 on hover
- DropdownMenu: Builder surface colors

---

### 4. RightPanel.tsx - Properties Panel (~100 lines)

Current:
```tsx
<div className="w-80 border-l border-border bg-card ...">
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="add">Add Blocks</TabsTrigger>
    <TabsTrigger value="style">...</TabsTrigger>
  </TabsList>
```

Updated structure:
```tsx
<div className="w-80 border-l border-[hsl(var(--builder-v3-border))] bg-[hsl(var(--builder-v3-surface))] flex flex-col shrink-0">
  <Tabs className="flex flex-col h-full">
    {/* Tab Headers - Flow canvas style */}
    <div className="h-12 px-2 flex items-center border-b border-[hsl(var(--builder-v3-border-subtle))]">
      <TabsList className="grid w-full grid-cols-2 bg-[hsl(var(--builder-v3-surface-hover))] p-1 rounded-lg">
        <TabsTrigger 
          value="add"
          className={cn(
            'text-xs font-medium rounded-md transition-all',
            'data-[state=inactive]:text-[hsl(var(--builder-v3-text-muted))]',
            'data-[state=active]:bg-[hsl(var(--builder-v3-surface-active))] data-[state=active]:text-[hsl(var(--builder-v3-text))]'
          )}
        >
          Add Blocks
        </TabsTrigger>
        <TabsTrigger 
          value="style"
          className={cn(...)}
        >
          {block ? 'Block Style' : 'Screen Style'}
        </TabsTrigger>
      </TabsList>
    </div>

    <ScrollArea className="flex-1 builder-v3-scroll">
      {/* Add Blocks Tab */}
      <TabsContent value="add" className="mt-0 p-4">
        {/* Category headers */}
        <h3 className="text-[10px] font-medium text-[hsl(var(--builder-v3-text-dim))] uppercase tracking-wider mb-2">
          Content
        </h3>
        
        {/* Block buttons grid */}
        <div className="grid grid-cols-2 gap-2">
          <button
            className={cn(
              'flex flex-col items-center gap-2 p-3 rounded-lg transition-all',
              'border border-[hsl(var(--builder-v3-border))]',
              'bg-[hsl(var(--builder-v3-surface-hover))]',
              'hover:bg-[hsl(var(--builder-v3-surface-active))]',
              'hover:border-[hsl(var(--builder-v3-accent)/0.3)]',
              'text-[hsl(var(--builder-v3-text-secondary))]'
            )}
          >
            <Icon className="h-5 w-5 text-[hsl(var(--builder-v3-text-muted))]" />
            <span className="text-xs">{label}</span>
          </button>
        </div>
      </TabsContent>

      {/* Style Tab */}
      <TabsContent value="style" className="mt-0 p-4 space-y-6">
        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1 bg-[hsl(var(--builder-v3-surface-hover))] border-[hsl(var(--builder-v3-border))] text-[hsl(var(--builder-v3-text-secondary))] hover:text-[hsl(var(--builder-v3-text))] hover:bg-[hsl(var(--builder-v3-surface-active))]"
          >
            <Copy /> Duplicate
          </Button>
          <Button 
            variant="outline"
            className="text-[hsl(var(--builder-v3-error))] hover:text-[hsl(var(--builder-v3-error))] hover:bg-[hsl(var(--builder-v3-error)/0.1)]"
          >
            <Trash2 />
          </Button>
        </div>

        {/* Field groups use Phase 3 styling */}
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">
            Content
          </Label>
          <Input className="builder-v3-input" />
        </div>

        {/* Select fields */}
        <Select>
          <SelectTrigger className="bg-[hsl(var(--builder-v3-surface-hover))] border-[hsl(var(--builder-v3-border))] text-[hsl(var(--builder-v3-text))]">
            ...
          </SelectTrigger>
          <SelectContent className="bg-[hsl(var(--builder-v3-surface))] border-[hsl(var(--builder-v3-border))]">
            ...
          </SelectContent>
        </Select>
      </TabsContent>
    </ScrollArea>
  </Tabs>
</div>
```

Key patterns from flow-canvas:
- TabsList: `bg-builder-surface-hover p-1 rounded-lg`
- TabsTrigger active: `bg-builder-surface-active text-builder-text`
- Block buttons: `bg-builder-surface-hover hover:bg-builder-surface-active border-builder-border`
- Labels: 11px, font-medium, text-muted
- Inputs: Use `.builder-v3-input` class from Phase 2 CSS

---

### 5. Canvas.tsx - Preview Area (~40 lines)

Current:
```tsx
<div className="flex-1 flex items-center justify-center bg-muted/30 p-8 ...">
  <div className="w-full max-w-md min-h-[600px] rounded-2xl shadow-2xl ...">
```

Updated structure:
```tsx
<div 
  className="flex-1 flex items-center justify-center p-8 overflow-auto"
  style={{ backgroundColor: 'hsl(var(--builder-v3-canvas-bg))' }}
  data-preview={previewMode ? 'true' : undefined}
>
  {/* Device Frame - uses v3 classes */}
  <div
    className={cn(
      'builder-v3-device-frame builder-v3-device-frame--mobile',
      'min-h-[600px] overflow-hidden',
      !previewMode && 'ring-1 ring-[hsl(var(--builder-v3-border)/0.3)]'
    )}
    style={{
      ...getBackgroundStyle(),
      fontFamily: settings.fontFamily || 'Inter, sans-serif',
    }}
    onClick={handleCanvasClick}
  >
    {/* Phone Notch */}
    <div className="builder-v3-phone-notch" />
    
    {/* Progress Bar */}
    {settings.showProgress && (
      <div className="h-1 bg-[hsl(var(--builder-v3-surface))]">
        <div 
          className="h-full bg-[hsl(var(--builder-v3-accent))] transition-all" 
          style={{ width: '33%' }}
        />
      </div>
    )}

    {/* Screen Content */}
    <div className="p-6 space-y-4">
      {screen.blocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          isSelected={block.id === selectedBlockId}
          onSelect={() => onSelectBlock(block.id)}
          previewMode={previewMode}
          primaryColor={settings.primaryColor}
        />
      ))}
    </div>
    
    {/* Home Indicator */}
    <div className="builder-v3-home-indicator" />
  </div>
</div>
```

Key changes:
- Canvas background: `--builder-v3-canvas-bg` (very dark, near black)
- Device frame: Use `.builder-v3-device-frame` classes from Phase 2 CSS
- Add phone notch and home indicator for realism
- Progress bar uses accent color
- Add `data-preview` attribute for CSS to hide selection states

---

### 6. BlockRenderer.tsx - Selection States (~20 lines)

Current:
```tsx
<div
  className={cn(
    'relative transition-all cursor-pointer',
    isSelected && 'ring-2 ring-primary ring-offset-2',
    !previewMode && 'hover:ring-2 hover:ring-primary/50 hover:ring-offset-2'
  )}
>
```

Updated:
```tsx
<div
  className={cn(
    'builder-v3-selectable relative transition-all',
    isSelected && 'builder-v3-selected',
    // Hover states handled by CSS
  )}
  data-selected={isSelected || undefined}
>
```

Key changes:
- Use `.builder-v3-selectable` and `.builder-v3-selected` classes
- Selection states automatically hidden in preview mode via CSS `[data-preview="true"]`
- Cleaner, more maintainable

---

## Visual Result

After this phase, the v3 builder will have:

1. **Dark charcoal panels** - Matching flow-canvas aesthetic (HSL 220 13% 8-10%)
2. **Blue accent system** - Consistent with Infostack brand (HSL 217 91% 60%)
3. **Proper text hierarchy** - Bright → secondary → muted → dim progression
4. **Toolbar with proper styling** - Button patterns, dividers, preview toggle
5. **Professional device frame** - Phone notch, home indicator, shadow/glow
6. **Clean selection states** - Using CSS classes from Phase 2

## CSS Classes Utilized (from Phase 2)

```css
/* Layout */
.builder-v3-device-frame, .builder-v3-device-frame--mobile
.builder-v3-phone-notch, .builder-v3-home-indicator
.builder-v3-scroll

/* Selection */
.builder-v3-selectable, .builder-v3-selected
[data-preview="true"] .builder-v3-selected { outline: none }

/* Inputs */
.builder-v3-input, .builder-v3-textarea
```

## Success Criteria

1. All 6 files updated with dark theme tokens
2. Toolbar matches flow-canvas pattern (dividers, preview toggle)
3. Left panel screen items have proper hover/selected states
4. Right panel tabs and controls use builder tokens
5. Canvas has dark background with device frame styling
6. Selection states work and hide in preview mode
7. No TypeScript errors
8. Visual parity with flow-canvas builder aesthetic

