
# Animate & Reduce Opacity of Auth Page Background

## Overview

Enhance the right-side hero panel by reducing the background image opacity and adding a subtle floating/panning animation for a more dynamic, modern feel.

---

## Summary of Changes

| Area | Change |
|------|--------|
| **Background Image** | Move to separate `<img>` element with reduced opacity (30-40%) |
| **Animation** | Add slow, subtle scale/pan animation using CSS keyframes |
| **CSS** | Add new keyframe animation to `index.css` |

---

## Implementation Approach

### Current State
The background is applied via inline `style={{ backgroundImage }}` with a `bg-black/20` overlay on top. This makes it difficult to animate or control opacity of the image itself.

### New Approach
Separate the background image into its own absolutely-positioned `<img>` element. This allows us to:
1. Apply `opacity` directly to the image (e.g., `opacity-30` or `opacity-40`)
2. Add CSS animation classes for smooth movement
3. Keep the dark overlay for text readability

---

## 1. Add Animation Keyframes

### File: `src/index.css`

Add a slow, subtle floating animation:

```css
@keyframes float-bg {
  0%, 100% {
    transform: scale(1.05) translate(0, 0);
  }
  25% {
    transform: scale(1.08) translate(-1%, -1%);
  }
  50% {
    transform: scale(1.1) translate(0, -2%);
  }
  75% {
    transform: scale(1.08) translate(1%, -1%);
  }
}

.animate-float-bg {
  animation: float-bg 20s ease-in-out infinite;
}
```

This creates a very slow (20 second loop), gentle floating effect that subtly scales and pans the background without being distracting.

---

## 2. Update Auth.tsx Right Panel

### File: `src/pages/Auth.tsx`

Replace the inline background style with a separate image element:

```text
Current structure:
┌─────────────────────────────────┐
│ <div style={backgroundImage}>   │ ← Background on container
│   <div bg-black/20 overlay />   │
│   <Card>...</Card>              │
│   <Bottom copy>...</Bottom>     │
└─────────────────────────────────┘

New structure:
┌─────────────────────────────────┐
│ <div relative overflow-hidden>  │ ← Plain container
│   <img                          │ ← Separate animated image
│     src={authHeroBg}            │
│     className="absolute inset-0 │
│       w-full h-full             │
│       object-cover              │
│       opacity-30                │  ← Reduced opacity (30%)
│       animate-float-bg"         │  ← Floating animation
│   />                            │
│   <div bg-black/30 overlay />   │ ← Slightly stronger overlay
│   <Card>...</Card>              │
│   <Bottom copy>...</Bottom>     │
└─────────────────────────────────┘
```

### Code Changes (lines ~1097-1110):

```tsx
{/* Right Side - Hero (Hidden on mobile) */}
<div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center p-12 bg-slate-950">
  {/* Animated Background Image */}
  <img 
    src={authHeroBg}
    alt=""
    className="absolute inset-0 w-full h-full object-cover opacity-30 animate-float-bg"
  />
  
  {/* Overlay for text readability */}
  <div className="absolute inset-0 bg-black/30" />
  
  {/* Center Content - Feature Card */}
  <div className="relative z-10">
    {/* ... existing card content ... */}
  </div>
  
  {/* Bottom Copy */}
  {/* ... existing bottom content ... */}
</div>
```

---

## Visual Effect

The result will be:
- **Dimmer background** - Image at 30% opacity makes it more subtle
- **Gentle floating motion** - Slow, continuous scale/pan creates depth
- **Dark base color** - `bg-slate-950` provides a fallback behind the transparent image
- **Preserved readability** - Feature card and text remain crisp and clear

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Add `@keyframes float-bg` and `.animate-float-bg` class |
| `src/pages/Auth.tsx` | Replace inline background with animated `<img>` element |
