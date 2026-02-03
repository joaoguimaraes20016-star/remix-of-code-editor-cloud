# Unify Block Centering

## Problem

Blocks and components sometimes appear pushed to the side instead of centered. This happens because:
1. Some blocks don't have `textAlign: 'center'` set in their defaultStyles
2. The block container doesn't enforce centering
3. AI-generated blocks might not always include center alignment
4. Existing blocks created before centering was enforced may lack alignment

## Solution

### 1. Ensure Block Container Centers Content

**File**: [src/funnel-builder-v3/editor/Canvas.tsx](src/funnel-builder-v3/editor/Canvas.tsx)

The block container should center all blocks:

```tsx
// Line ~379: Change from:
<div className="space-y-4 w-full max-w-full">

// To:
<div className="space-y-4 w-full max-w-full flex flex-col items-center">
```

### 2. Enforce Center Alignment in BlockRenderer

**File**: [src/funnel-builder-v3/editor/blocks/BlockRenderer.tsx](src/funnel-builder-v3/editor/blocks/BlockRenderer.tsx)

Ensure all text-based blocks default to center and the wrapper centers content:

```typescript
// Line ~173-179: Update textAlign logic to always default to center
const textAlign: 'left' | 'center' | 'right' = 
  styles.textAlign || 
  contentTextAlign || 
  'center'; // Always default to center

// Line ~181-207: Update wrapperStyle to ensure centering
const wrapperStyle: React.CSSProperties = {
  // ... existing styles ...
  textAlign: textAlign || 'center', // Ensure textAlign is always set
  width: '100%', // Ensure full width
  maxWidth: '100%', // Prevent overflow
  // For non-fullWidth buttons, center them
  ...(shouldCenterButton && {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }),
  // Center media blocks (image, video)
  ...((block.type === 'image' || block.type === 'video') && {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }),
};
```

### 3. Update Block Definitions to Default to Center

**File**: [src/funnel-builder-v3/lib/block-definitions.ts](src/funnel-builder-v3/lib/block-definitions.ts)

Add `textAlign: 'center'` to blocks that should be centered:

- reviews (line 271): Add `textAlign: 'center'`
- testimonial-slider (line 291): Add `textAlign: 'center'`
- social-proof (line 326): Add `textAlign: 'center'`
- accordion (line 364): Add `textAlign: 'center'`

```typescript
reviews: {
  // ... existing ...
  defaultStyles: { ...defaultStyles, textAlign: 'center' },
},
'testimonial-slider': {
  // ... existing ...
  defaultStyles: { ...defaultStyles, textAlign: 'center' },
},
'social-proof': {
  // ... existing ...
  defaultStyles: { ...defaultStyles, textAlign: 'center' },
},
accordion: {
  // ... existing ...
  defaultStyles: { ...defaultStyles, textAlign: 'center' },
},
```

### 4. Ensure AI-Generated Blocks Are Centered

**File**: [src/funnel-builder-v3/editor/AICopilot.tsx](src/funnel-builder-v3/editor/AICopilot.tsx)

In `createBlock` function (around line 761), ensure all blocks get center alignment:

```typescript
// After mergedStyles is created (around line 786-790), ensure textAlign is set
const textBasedBlocks = ['heading', 'text', 'list', 'button', 'accordion', 'social-proof', 'reviews', 'testimonial-slider'];
if (textBasedBlocks.includes(blockType) && !mergedStyles.textAlign && !mergedContent.styles?.textAlign) {
  mergedStyles.textAlign = 'center';
}
```

### 5. Update FunnelContext to Enforce Center on Block Creation

**File**: [src/funnel-builder-v3/context/FunnelContext.tsx](src/funnel-builder-v3/context/FunnelContext.tsx)

In `addBlock` function (around line 471), ensure center alignment is always set:

```typescript
// Line ~476-486: Update to always set center for all text-based blocks
const textBasedBlocks = ['heading', 'text', 'list', 'button', 'accordion', 'social-proof', 'reviews', 'testimonial-slider'];
if (textBasedBlocks.includes(blockType) && !defaultStylesCopy.textAlign) {
  const contentStyles = processedContent?.styles as any;
  if (contentStyles?.textAlign && ['left', 'center', 'right'].includes(contentStyles.textAlign)) {
    defaultStylesCopy.textAlign = contentStyles.textAlign;
  } else {
    defaultStylesCopy.textAlign = 'center'; // Always default to center
  }
}
```

### 6. Update Funnel Parser to Ensure Center Alignment

**File**: [src/funnel-builder-v3/lib/funnel-parser.ts](src/funnel-builder-v3/lib/funnel-parser.ts)

In `createBlockFromContent` function, ensure center alignment:

```typescript
// After finalStyles is created (around line 50-56), ensure center for text-based blocks
const textBasedBlocks = ['heading', 'text', 'list', 'button', 'accordion', 'social-proof', 'reviews', 'testimonial-slider'];
if (textBasedBlocks.includes(type)) {
  if (!finalStyles.textAlign && !contentStyles?.textAlign) {
    finalStyles.textAlign = 'center';
  }
}
```

## Files to Modify

1. [src/funnel-builder-v3/editor/Canvas.tsx](src/funnel-builder-v3/editor/Canvas.tsx): Center block container
2. [src/funnel-builder-v3/editor/blocks/BlockRenderer.tsx](src/funnel-builder-v3/editor/blocks/BlockRenderer.tsx): Enforce center alignment in wrapper
3. [src/funnel-builder-v3/lib/block-definitions.ts](src/funnel-builder-v3/lib/block-definitions.ts): Ensure all relevant blocks default to center
4. [src/funnel-builder-v3/editor/AICopilot.tsx](src/funnel-builder-v3/editor/AICopilot.tsx): Ensure AI-generated blocks are centered
5. [src/funnel-builder-v3/context/FunnelContext.tsx](src/funnel-builder-v3/context/FunnelContext.tsx): Enforce center on block creation
6. [src/funnel-builder-v3/lib/funnel-parser.ts](src/funnel-builder-v3/lib/funnel-parser.ts): Ensure parsed blocks are centered

## Expected Outcomes

1. All blocks are centered by default across all steps
2. Text-based blocks (heading, text, list) are always centered
3. Media blocks (image, video) are centered
4. Buttons are centered unless fullWidth
5. AI-generated blocks are always centered
6. Existing blocks without alignment get centered automatically
