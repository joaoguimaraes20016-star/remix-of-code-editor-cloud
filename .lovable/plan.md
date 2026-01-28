
# Make Section Templates Display Like Perspective

## Problem Summary

When section templates (Hero + Logos, etc.) are added to the canvas, they don't match the polished preview cards. The key issues:

1. **Logo bars show placeholder icons** instead of Perspective-style text wordmarks (like "Coca-Cola", "Zalando")
2. **Props aren't being passed through** - `templateConverter.ts` correctly sets `showTextFallback: true`, but both renderers don't pass it to `LogoMarquee`
3. **Avatar group ratings** work but could be more polished
4. **Missing visual refinements** for professional appearance

---

## Root Cause Analysis

```text
templateConverter.ts                    CanvasRenderer.tsx
┌────────────────────────┐              ┌─────────────────────────┐
│ type: 'logo-marquee'   │              │ <LogoMarquee            │
│ props: {               │   ──────>    │   logos={...}           │
│   logos: [{name: ...}] │              │   animated={...}        │
│   showTextFallback: ✅ │              │   speed={...}           │
│   grayscale: true      │              │   // showTextFallback   │
│ }                      │              │   // ❌ NOT PASSED!     │
└────────────────────────┘              └─────────────────────────┘
```

The `showTextFallback` prop is correctly set in the template data, but neither renderer passes it to the LogoMarquee component.

---

## Implementation Plan

### 1. Fix CanvasRenderer.tsx - Pass Missing Props

**File:** `src/flow-canvas/builder/components/CanvasRenderer.tsx`

Pass `showTextFallback` to the LogoMarquee component:

```typescript
<LogoMarquee
  logos={logos}
  animated={element.props?.animated !== false}
  speed={element.props?.speed as number || 30}
  direction={(element.props?.direction as 'left' | 'right') || 'left'}
  pauseOnHover={element.props?.pauseOnHover !== false}
  grayscale={element.props?.grayscale !== false}
  logoHeight={element.props?.logoHeight as number || 40}
  gap={element.props?.gap as number || 48}
  showTextFallback={element.props?.showTextFallback === true}  // ADD THIS
  hoverEffect={(element.props?.hoverEffect as 'none' | 'color' | 'scale' | 'both') || 'color'}  // ADD THIS
  isBuilder={true}
  onLogosChange={...}
/>
```

### 2. Fix FlowCanvasRenderer.tsx - Pass Missing Props

**File:** `src/flow-canvas/components/FlowCanvasRenderer.tsx`

Same fix for runtime rendering:

```typescript
<LogoMarquee
  logos={logos}
  animated={element.props?.animated !== false}
  speed={element.props?.speed as number || 30}
  direction={(element.props?.direction as 'left' | 'right') || 'left'}
  pauseOnHover={element.props?.pauseOnHover !== false}
  grayscale={element.props?.grayscale !== false}
  logoHeight={element.props?.logoHeight as number || 40}
  gap={element.props?.gap as number || 48}
  showTextFallback={element.props?.showTextFallback === true}  // ADD THIS
  hoverEffect={(element.props?.hoverEffect as 'none' | 'color' | 'scale' | 'both') || 'color'}  // ADD THIS
/>
```

### 3. Enhance Template Defaults in templateConverter.ts

**File:** `src/flow-canvas/builder/utils/templateConverter.ts`

Improve the default logo bar configuration:

```typescript
if (node.type === 'logo_bar') {
  const logos = (node.props?.logos as string[]) || ['Coca-Cola', 'Zalando', 'Braun', 'IKEA', 'Sony'];
  return {
    id: generateId(),
    type: 'logo-marquee',
    content: '',
    props: {
      logos: logos.map((name, i) => ({ id: `logo-${i}`, src: '', alt: name, name })),
      speed: 25,
      pauseOnHover: true,
      grayscale: true,
      showTextFallback: true,
      hoverEffect: 'color',      // ADD: Professional hover effect
      logoHeight: 32,            // ADD: Refined sizing
      gap: 40,                   // ADD: Better spacing
      animated: false,           // ADD: Static by default for cleaner look
    },
  };
}
```

### 4. Enhance Rating Display Defaults

**File:** `src/flow-canvas/builder/utils/templateConverter.ts`

Make rating display match Perspective more closely:

```typescript
if (node.type === 'rating_display') {
  return {
    id: generateId(),
    type: 'avatar-group',
    content: '',
    props: {
      count: 4,
      size: 'sm',
      colorMode: 'varied',
      overlap: 10,
      showRating: true,
      rating: (node.props?.rating as number) || 4.8,
      ratingCount: (node.props?.count as number) || 148,
      ratingSource: (node.props?.source as string) || 'reviews',
      alignment: 'center',       // ADD: Center alignment
    },
  };
}
```

### 5. Add CSS Refinements

**File:** `src/flow-canvas/index.css`

Add polished styles for Perspective-like appearance:

```css
/* Perspective-style logo wordmarks */
.perspective-logo-text {
  font-weight: 700;
  letter-spacing: -0.02em;
  color: rgba(107, 114, 128, 0.6);
  transition: all 0.3s ease;
  white-space: nowrap;
}

.perspective-logo-text:hover {
  color: rgba(17, 24, 39, 0.9);
}

/* Refined rating display */
.perspective-rating-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.perspective-rating-stars {
  display: flex;
  gap: 2px;
}

.perspective-rating-text {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/flow-canvas/builder/components/CanvasRenderer.tsx` | Pass `showTextFallback` and `hoverEffect` props to LogoMarquee |
| `src/flow-canvas/components/FlowCanvasRenderer.tsx` | Pass `showTextFallback` and `hoverEffect` props to LogoMarquee |
| `src/flow-canvas/builder/utils/templateConverter.ts` | Enhance logo bar and rating display defaults |
| `src/flow-canvas/index.css` | Add refined CSS for Perspective-style elements |

---

## Visual Result

**Before:**
- Logo bars show gray placeholder image icons
- Templates look generic and unpolished

**After:**
- Logo bars display clean text wordmarks: "Coca-Cola • Zalando • Braun • IKEA • Sony"
- Grayscale text that becomes full opacity on hover
- Professional typography and spacing
- Matches Perspective's clean aesthetic
