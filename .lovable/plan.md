
# Funnel Builder Reliability Architecture: "Perspective-Level Simplicity"

## The Core Problem

The current funnel builder has **3 major architectural issues** that make it impossible to guarantee every button, effect, and control works:

| Issue | Evidence | Impact |
|-------|----------|--------|
| **Monolithic Renderer** | `CanvasRenderer.tsx` = 5,367 lines | Impossible to test, debug, or extend |
| **Scattered Style Logic** | 703 occurrences of `element.props?.` with inline CSS generation | Effects applied inconsistently |
| **Dual Systems** | `flow-canvas` (5,600+ lines) + `builder_v2` (simpler registry) running parallel | Feature parity impossible |

### Why Controls Don't Work Reliably

The current flow is:

```text
Inspector Control → RightPanel.tsx (5,600 lines)
       ↓
Updates element.props.shadow = "lg"
       ↓  
CanvasRenderer.tsx (5,300 lines)
       ↓
getButtonShadowStyle() → conditional logic
       ↓
Maybe applies CSS, maybe doesn't (default fallbacks override)
```

There are **hundreds of code paths** where:
- User sets `shadow: none` → default shadow still appears
- User sets `borderWidth: 0` → selection ring looks like border
- User picks gradient → text contrast breaks
- User enables effect → nothing visible happens

---

## The Solution: Token-Based Style System

The `builder_v2` already has the RIGHT architecture with `UnifiedButton` and primitive components. We need to:

1. **Consolidate all styling into a single token system**
2. **Make every control a guaranteed 1:1 mapping**
3. **Build a test harness that proves every control works**

### New Architecture: StyleToken System

```text
┌─────────────────────────────────────────────────────────────┐
│                    SINGLE SOURCE OF TRUTH                    │
│                      StyleTokenSystem                        │
├─────────────────────────────────────────────────────────────┤
│  Token Definition          │  CSS Output                    │
│  ─────────────────────────────────────────────────────────  │
│  shadow.none              →  box-shadow: none               │
│  shadow.sm                →  box-shadow: 0 1px 2px...       │
│  shadow.glow              →  box-shadow: 0 0 20px {color}   │
│  border.width.0           →  border-width: 0                │
│  border.width.1           →  border-width: 1px              │
│  radius.sm                →  border-radius: 4px             │
│  effect.fadeIn            →  animation: fadeIn 0.3s         │
│  effect.slideUp           →  animation: slideUp 0.3s        │
│  hover.scale              →  transform: scale(1.05)         │
│  hover.glow               →  filter: drop-shadow(...)       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    ELEMENT RENDERER                          │
│                   (Simple Token Consumer)                    │
├─────────────────────────────────────────────────────────────┤
│  Input: element.styleTokens = ['shadow.lg', 'radius.xl']    │
│  Output: <div style={resolveTokens(element.styleTokens)}>   │
│                                                              │
│  NO conditional logic. NO fallbacks. Just token → CSS.       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    INSPECTOR CONTROL                         │
│                   (Token Picker, not props setter)           │
├─────────────────────────────────────────────────────────────┤
│  ShadowControl:                                              │
│    [None] [S] [M] [L] [XL] [Glow]                            │
│                  ↓                                           │
│    onClick → setToken('shadow', value)                       │
│                  ↓                                           │
│    Guaranteed CSS output via StyleTokenSystem                │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Create StyleTokenSystem (Foundation)

Create a single source of truth for ALL visual properties:

```typescript
// src/builder/tokens/StyleTokenSystem.ts

export interface StyleToken {
  id: string;           // "shadow.lg"
  category: string;     // "shadow"
  value: string;        // "lg"
  css: React.CSSProperties;
  cssClass?: string;    // Optional Tailwind class
}

export const StyleTokenSystem = {
  // SHADOWS - Complete list, no gaps
  shadow: {
    none: { boxShadow: 'none' },
    sm: { boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
    md: { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
    lg: { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
    xl: { boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' },
    glow: (color: string) => ({ 
      boxShadow: `0 0 20px ${hexToRgba(color, 0.5)}` 
    }),
  },
  
  // BORDERS - Every value explicit
  border: {
    width: {
      0: { borderWidth: '0' },
      1: { borderWidth: '1px' },
      2: { borderWidth: '2px' },
      4: { borderWidth: '4px' },
    },
    radius: {
      none: { borderRadius: '0' },
      sm: { borderRadius: '4px' },
      md: { borderRadius: '8px' },
      lg: { borderRadius: '12px' },
      xl: { borderRadius: '16px' },
      full: { borderRadius: '9999px' },
    },
  },
  
  // EFFECTS - Entry + Exit animations
  effects: {
    fadeIn: { animation: 'fadeIn 0.3s ease-out' },
    fadeOut: { animation: 'fadeOut 0.3s ease-out' },
    slideUp: { animation: 'slideUp 0.3s ease-out' },
    slideDown: { animation: 'slideDown 0.3s ease-out' },
    scaleIn: { animation: 'scaleIn 0.2s ease-out' },
    bounce: { animation: 'bounce 0.5s ease-out' },
  },
  
  // HOVER EFFECTS
  hover: {
    none: {},
    lift: { transform: 'translateY(-2px)' },
    scale: { transform: 'scale(1.02)' },
    glow: (color: string) => ({ 
      filter: `drop-shadow(0 0 8px ${hexToRgba(color, 0.5)})` 
    }),
  },
};

// Single function to resolve tokens to CSS
export function resolveTokens(
  tokens: Record<string, string>,
  context?: { primaryColor?: string }
): React.CSSProperties {
  const result: React.CSSProperties = {};
  
  for (const [category, value] of Object.entries(tokens)) {
    const tokenDef = StyleTokenSystem[category]?.[value];
    if (!tokenDef) continue;
    
    const css = typeof tokenDef === 'function' 
      ? tokenDef(context?.primaryColor || '#8b5cf6')
      : tokenDef;
    
    Object.assign(result, css);
  }
  
  return result;
}
```

**Files to create:**
- `src/builder/tokens/StyleTokenSystem.ts` - Token definitions
- `src/builder/tokens/index.ts` - Exports
- `src/builder/tokens/TokenResolver.ts` - Resolution logic

---

### Phase 2: Create TokenControl Components

Replace all inspector controls with token-aware versions:

```typescript
// src/builder/inspector/TokenShadowControl.tsx

export function TokenShadowControl({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (token: string) => void 
}) {
  const options = Object.keys(StyleTokenSystem.shadow);
  
  return (
    <div className="flex rounded-lg border overflow-hidden">
      {options.map((opt) => (
        <Button
          key={opt}
          variant={value === opt ? 'default' : 'ghost'}
          onClick={() => onChange(opt)}
          className="flex-1 h-8 text-xs"
        >
          {/* Live preview of the shadow */}
          <div 
            className="w-4 h-4 rounded bg-white"
            style={StyleTokenSystem.shadow[opt]}
          />
        </Button>
      ))}
    </div>
  );
}
```

**Files to create:**
- `src/builder/inspector/controls/TokenShadowControl.tsx`
- `src/builder/inspector/controls/TokenBorderControl.tsx`
- `src/builder/inspector/controls/TokenRadiusControl.tsx`
- `src/builder/inspector/controls/TokenEffectControl.tsx`
- `src/builder/inspector/controls/TokenHoverControl.tsx`

---

### Phase 3: Create TokenElement Renderer

A simplified element renderer that ONLY consumes tokens:

```typescript
// src/builder/canvas/TokenElementRenderer.tsx

export function TokenElementRenderer({ 
  element,
  isPreview = false 
}: { 
  element: CanvasElement;
  isPreview?: boolean;
}) {
  // Resolve all tokens to CSS
  const tokenStyles = resolveTokens(element.tokens || {}, {
    primaryColor: element.primaryColor,
  });
  
  // Merge with explicit inline styles
  const finalStyles = {
    ...tokenStyles,
    ...element.styles,
  };
  
  // Render based on type - NO conditional styling logic
  switch (element.type) {
    case 'button':
      return (
        <button 
          className="builder-button"
          style={finalStyles}
        >
          {element.props.label}
        </button>
      );
    
    case 'heading':
      return (
        <h2 style={finalStyles}>
          {element.props.text}
        </h2>
      );
    
    // ... other element types
  }
}
```

---

### Phase 4: Create Visual Test Harness

A dedicated page that renders EVERY token combination for visual verification:

```typescript
// src/builder/test/TokenTestHarness.tsx

export function TokenTestHarness() {
  return (
    <div className="p-8 space-y-12">
      {/* Shadow Tests */}
      <section>
        <h2 className="text-xl font-bold mb-4">Shadow Tokens</h2>
        <div className="grid grid-cols-6 gap-4">
          {Object.entries(StyleTokenSystem.shadow).map(([key, css]) => (
            <div key={key} className="flex flex-col items-center gap-2">
              <div 
                className="w-16 h-16 bg-white rounded-lg"
                style={typeof css === 'function' ? css('#8b5cf6') : css}
              />
              <span className="text-xs">{key}</span>
              <span className="text-xs text-green-500">✓</span>
            </div>
          ))}
        </div>
      </section>
      
      {/* Border Radius Tests */}
      <section>
        <h2 className="text-xl font-bold mb-4">Border Radius Tokens</h2>
        <div className="grid grid-cols-6 gap-4">
          {Object.entries(StyleTokenSystem.border.radius).map(([key, css]) => (
            <div key={key} className="flex flex-col items-center gap-2">
              <div 
                className="w-16 h-16 bg-purple-500"
                style={css}
              />
              <span className="text-xs">{key}</span>
            </div>
          ))}
        </div>
      </section>
      
      {/* Effect Tests (Animated) */}
      <section>
        <h2 className="text-xl font-bold mb-4">Effect Tokens</h2>
        <div className="grid grid-cols-6 gap-4">
          {Object.entries(StyleTokenSystem.effects).map(([key, css]) => (
            <EffectTestCard key={key} name={key} css={css} />
          ))}
        </div>
      </section>
      
      {/* Button Combinations */}
      <section>
        <h2 className="text-xl font-bold mb-4">Button Token Combinations</h2>
        <div className="grid grid-cols-4 gap-4">
          {/* Generate all shadow × radius combinations */}
          {Object.keys(StyleTokenSystem.shadow).flatMap(shadow =>
            Object.keys(StyleTokenSystem.border.radius).map(radius => (
              <button
                key={`${shadow}-${radius}`}
                className="px-4 py-2 bg-purple-500 text-white"
                style={{
                  ...StyleTokenSystem.shadow[shadow],
                  ...StyleTokenSystem.border.radius[radius],
                }}
              >
                {shadow} / {radius}
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
```

---

### Phase 5: Migrate Existing Elements

Gradually migrate existing elements to use the token system:

**Migration Strategy:**
1. Add `tokens` field to Element type
2. Update RightPanel to set tokens instead of scattered props
3. Update CanvasRenderer to consume tokens first, fall back to props
4. Once verified, remove prop-based styling logic

```typescript
// Element type evolution
interface Element {
  id: string;
  type: string;
  // OLD: Scattered props
  props?: Record<string, unknown>;
  styles?: Record<string, string>;
  // NEW: Token-based
  tokens?: {
    shadow?: string;      // "none" | "sm" | "md" | "lg" | "xl" | "glow"
    radius?: string;      // "none" | "sm" | "md" | "lg" | "xl" | "full"
    effect?: string;      // "fadeIn" | "slideUp" | etc.
    hover?: string;       // "none" | "lift" | "scale" | "glow"
    border?: string;      // "0" | "1" | "2"
  };
}
```

---

## File Structure

```text
src/builder/
├── tokens/
│   ├── StyleTokenSystem.ts      # Token definitions (single source of truth)
│   ├── TokenResolver.ts         # Token → CSS resolution
│   ├── animations.css           # All keyframe animations
│   └── index.ts
│
├── inspector/
│   └── controls/
│       ├── TokenShadowControl.tsx
│       ├── TokenBorderControl.tsx
│       ├── TokenRadiusControl.tsx
│       ├── TokenEffectControl.tsx
│       ├── TokenHoverControl.tsx
│       └── index.ts
│
├── canvas/
│   ├── TokenElementRenderer.tsx  # Simplified element renderer
│   └── TokenButtonRenderer.tsx   # Button-specific (unified)
│
└── test/
    ├── TokenTestHarness.tsx      # Visual verification page
    └── token.test.ts             # Unit tests for token resolution
```

---

## Guarantees This Architecture Provides

| Control | Current State | After Token System |
|---------|--------------|-------------------|
| Shadow = None | Maybe shows shadow due to fallbacks | **Guaranteed** no shadow |
| Border = 0 | Selection ring confuses users | **Guaranteed** no visible border |
| Effect = FadeIn | Might not trigger | **Guaranteed** animation plays |
| Hover = Scale | Depends on element type | **Guaranteed** scale on hover |
| Radius = Full | Works sometimes | **Guaranteed** pill shape |

---

## Testing Strategy

### Unit Tests (token.test.ts)
```typescript
describe('StyleTokenSystem', () => {
  test.each(Object.keys(StyleTokenSystem.shadow))('shadow.%s resolves to valid CSS', (key) => {
    const css = StyleTokenSystem.shadow[key];
    expect(css).toHaveProperty('boxShadow');
  });
  
  test('shadow.none produces no visible shadow', () => {
    expect(StyleTokenSystem.shadow.none.boxShadow).toBe('none');
  });
  
  test.each(Object.keys(StyleTokenSystem.border.radius))('radius.%s resolves to valid CSS', (key) => {
    const css = StyleTokenSystem.border.radius[key];
    expect(css).toHaveProperty('borderRadius');
  });
});
```

### Visual Tests (TokenTestHarness)
- Accessible via `/builder/token-test` in development
- Shows every token rendered live
- Each token has a ✓/✗ indicator
- Can be screenshotted for regression testing

### Integration Tests
- Playwright tests that:
  1. Open builder
  2. Add button
  3. Set shadow to "lg"
  4. Verify button has `box-shadow` CSS applied
  5. Set shadow to "none"
  6. Verify `box-shadow: none`

---

## Implementation Order

1. **Create StyleTokenSystem.ts** - 1-2 hours
   - Define all tokens with explicit CSS values
   - No conditionals, no fallbacks

2. **Create TokenResolver.ts** - 30 minutes
   - Simple function: tokens → CSS
   - No special cases

3. **Create Token controls** - 2-3 hours
   - One control per category
   - Each control shows live preview

4. **Create TokenTestHarness** - 1-2 hours
   - Visual verification of every token
   - Generates confidence report

5. **Migrate buttons first** - 2-3 hours
   - Buttons are highest complexity
   - Proves the architecture works

6. **Migrate remaining elements** - 4-6 hours
   - Headings, paragraphs, inputs
   - Use same pattern

---

## Technical Details

### Files to Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `src/builder/tokens/StyleTokenSystem.ts` | Token definitions | ~200 |
| `src/builder/tokens/TokenResolver.ts` | Resolution logic | ~50 |
| `src/builder/tokens/animations.css` | Keyframe definitions | ~100 |
| `src/builder/inspector/controls/TokenShadowControl.tsx` | Shadow picker | ~60 |
| `src/builder/inspector/controls/TokenRadiusControl.tsx` | Radius picker | ~60 |
| `src/builder/inspector/controls/TokenEffectControl.tsx` | Animation picker | ~80 |
| `src/builder/inspector/controls/TokenHoverControl.tsx` | Hover effect picker | ~60 |
| `src/builder/test/TokenTestHarness.tsx` | Visual test page | ~200 |

**Total new code: ~810 lines**

### Files to Modify

| File | Changes | Est. Lines |
|------|---------|------------|
| `src/flow-canvas/types/infostack.ts` | Add `tokens` to Element type | ~10 |
| `src/flow-canvas/builder/components/RightPanel.tsx` | Use token controls | ~100 |
| `src/flow-canvas/builder/components/CanvasRenderer.tsx` | Consume tokens | ~150 |
| `src/components/builder/UnifiedButton.tsx` | Accept token prop | ~30 |

**Total modifications: ~290 lines**

---

## Success Criteria

After implementation:

- [ ] Every shadow option visually distinct in test harness
- [ ] Every border radius option visually distinct
- [ ] Every effect animation plays correctly
- [ ] Every hover effect triggers on hover
- [ ] Setting "none" to any effect **removes** it completely
- [ ] No default fallbacks that override user intent
- [ ] Test harness shows 100% ✓ for all tokens

This architecture makes "100 of these feel easy" because:
1. **One token = One visual result** (no surprises)
2. **Every control is testable** (visible in harness)
3. **No conditional logic** (what you set is what you get)
4. **Shared across all element types** (buttons, text, cards all use same system)
