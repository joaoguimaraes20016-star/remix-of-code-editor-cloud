

# Auth Hero Background: Soft Glow Patches with Independent Motion

## Problem
The current implementation still shows the entire background image moving, which causes visible gaps at the edges. The "block" effect also looks too sharp/puzzle-like.

## Solution
Replace the current approach with:
1. **Static base layer** - The full background image stays completely still (no animation)
2. **Soft glow overlays** - 3-4 independent patches using large, soft radial gradients as masks (no hard edges)
3. **Faster, varied motion** - Each patch moves in a distinctly different direction at noticeable speed

---

## Technical Details

### File: `src/styles/auth-hero-motion.css`

**Changes:**
- Remove animation from `.auth-hero-base` (keep it static)
- Update `.auth-hero-piece` mask to use **much softer gradients** (larger radius, smoother falloff)
- Increase **opacity to 0.2-0.3** for more visible glow effect
- Add blur filter for softer appearance
- Update keyframes for **faster animations** (5-7s instead of 9-13s)
- Increase **translation distances** (30-50px instead of 14-18px) for more noticeable movement
- Ensure each piece moves in a **completely different direction**:
  - Piece 1: moves up-left
  - Piece 2: moves down-right
  - Piece 3: moves right-up
  - Piece 4: moves left-down

### File: `src/pages/Auth.tsx`

**Changes:**
- Remove animation class from base image (just keep static with opacity)
- Keep the 4 overlay divs but they'll use the updated CSS

---

## Key CSS Updates

```css
/* Static base - no animation, no gaps */
.auth-hero-base {
  transform: scale(1.05); /* slight scale to prevent any edge issues */
  /* NO animation */
}

/* Soft glow patches - larger, softer masks */
.auth-hero-piece {
  inset: -25%;  /* larger overflow */
  opacity: 0.25;  /* more visible */
  filter: blur(20px) saturate(1.2);  /* softer glow look */
  
  /* Much softer mask - larger gradient with smoother edges */
  mask-image: radial-gradient(
    ellipse 45% 45% at var(--mx) var(--my),
    rgba(0,0,0,0.8) 0%,
    rgba(0,0,0,0.4) 40%,
    transparent 70%
  );
}

/* Faster keyframes with more movement */
@keyframes auth-piece-1 {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(-40px, -30px, 0); }  /* up-left */
}

@keyframes auth-piece-2 {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(35px, 40px, 0); }  /* down-right */
}

@keyframes auth-piece-3 {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(45px, -25px, 0); }  /* right-up */
}

@keyframes auth-piece-4 {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(-35px, 35px, 0); }  /* left-down */
}

/* Faster durations */
.auth-hero-piece-1 { animation: auth-piece-1 5s ease-in-out infinite; }
.auth-hero-piece-2 { animation: auth-piece-2 6s ease-in-out infinite; }
.auth-hero-piece-3 { animation: auth-piece-3 7s ease-in-out infinite; }
.auth-hero-piece-4 { animation: auth-piece-4 5.5s ease-in-out infinite; }
```

---

## Visual Result

- **Base image**: Completely static, full coverage, no gaps ever
- **Glow patches**: Soft, blurred light areas that drift independently
- **Motion**: Clearly noticeable, each moving in opposite directions
- **Feel**: Premium, subtle but alive - like soft light reflections drifting across glass

---

## Files to Modify

1. `src/styles/auth-hero-motion.css` - Update all animation and mask styles
2. `src/pages/Auth.tsx` - Ensure base image has no animation class
3. `src/index.css` - Remove old float-layer animations (cleanup)

