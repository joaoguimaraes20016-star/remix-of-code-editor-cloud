
# Fix Logo Bar "Starting from Middle" Bug on Tablet/Desktop

## Problem Summary
The Logo Bar block appears to "start from the middle" on tablet and desktop viewports instead of filling the full width. This happens because the marquee track uses `width: max-content` which constrains the logo row to its natural width, and the animation starts from position 0 - which may appear visually centered when there aren't enough logos to fill the wider viewport.

## Root Cause Analysis
In `LogoBarBlock.tsx`:
1. The marquee track uses `style={{ width: 'max-content' }}` (line 125)
2. The animation keyframes translate from `0` to `-50%` (left direction) 
3. On wider viewports, the logos don't span edge-to-edge because the container isn't forcing them to fill available width
4. The logos appear to "start in the middle" because the visible portion shows the natural width of the logo row, not a full-width marquee

## Solution

### 1. Update LogoBarBlock.tsx - Animated Version
Ensure the marquee fills the viewport width and creates a seamless infinite scroll effect:

```typescript
// Animated marquee version - duplicate logos for seamless loop
return (
  <div className="space-y-4 w-full overflow-hidden box-border">
    {renderTitle()}
    <div 
      className={cn(
        "relative w-full box-border",
        pauseOnHover && "[&:hover_.marquee-track]:pause"
      )}
      style={{ 
        overflow: 'hidden',
        // Use mask-image instead of gradient overlays to avoid clipping
        maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
      }}
    >
      {/* Marquee track - starts from left edge, not centered */}
      <div 
        className={cn(
          "flex items-center gap-8 will-change-transform marquee-track",
          speedClasses[speed],
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
        style={{ 
          display: 'inline-flex',
          whiteSpace: 'nowrap',
        }}
      >
        {/* First set of logos */}
        {logos.map((logo) => (
          <img key={`${logo.id}-1`} ... />
        ))}
        {/* Duplicate set for seamless loop */}
        {logos.map((logo) => (
          <img key={`${logo.id}-2`} ... />
        ))}
      </div>
    </div>
  </div>
);
```

### 2. Key Changes
| Change | Before | After |
|--------|--------|-------|
| Container overflow | `overflow: hidden` with absolute gradient overlays | CSS `mask-image` for fade edges (no overlays) |
| Track display | `flex` with `width: max-content` | `inline-flex` with `whiteSpace: nowrap` |
| Edge fading | Absolute positioned white gradient divs | Mask gradient (transparent → black → transparent) |

### 3. Remove Gradient Overlay Divs
The absolute-positioned gradient overlays (`from-white to-transparent`) were causing visual clipping issues. Replace them with a CSS `mask-image` on the container, which fades the edges without adding extra DOM elements or blocking content.

### 4. Static Version Update
For the non-animated static logo bar, change from `justify-center` to distribute logos across the full width on larger viewports:

```typescript
// Static (non-animated) version
if (!animated) {
  return (
    <div className="space-y-4 w-full overflow-hidden box-border">
      {renderTitle()}
      <div className="flex items-center justify-evenly gap-4 flex-wrap w-full">
        {logos.map((logo) => (
          <img key={logo.id} ... />
        ))}
      </div>
    </div>
  );
}
```

## Files to Modify
1. **src/components/editor/blocks/LogoBarBlock.tsx** - Fix marquee alignment and remove gradient overlays

## Technical Notes
- `mask-image` with `linear-gradient` creates smooth edge fading without DOM elements
- `inline-flex` with `whiteSpace: nowrap` ensures the track extends as needed
- The animation `translateX(-50%)` works correctly when the track has duplicated logos
- The fix ensures logos start from the left edge and scroll seamlessly on all viewport sizes
