
# Fix Stats Card to Have True Glassmorphism

## The Problem
The Card component has a default `bg-card` class that applies a light/white background color (from CSS variables). This is overriding or conflicting with our transparent gradient, causing that weird grayish-white appearance instead of a true glass effect.

## Solution
Override the `bg-card` default by explicitly setting `bg-transparent` on the Card, then apply a proper glassmorphism effect with:
- Very subtle white/light overlay for the glass tint
- Strong `backdrop-blur` for the frosted effect
- A light border that catches the light
- Keep the background showing through

## Changes

### File: `src/pages/Auth.tsx`

**1. Update the Card class (line 1124)**
```
Current:
bg-gradient-to-br from-slate-900/40 via-slate-800/30 to-slate-900/40 backdrop-blur-md border-slate-500/20

New:
bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl
```

The key changes:
- `bg-white/10` - Very subtle white tint (10% opacity) for glass effect
- `backdrop-blur-xl` - Stronger blur for frosted glass
- `border-white/20` - Light border that catches light
- Remove the dark slate gradient that was creating the gray

**2. Update stat card backgrounds (lines 1144, 1148, 1152)**

Give them a subtle white glass effect too, with colored borders:
```
Revenue:  bg-white/5 border border-emerald-400/30
MRR:      bg-white/5 border border-blue-400/30  
Close:    bg-white/5 border border-violet-400/30
```

**3. Update activity feed items (lines 1160, 1169, 1178)**
```
Current: bg-slate-800/20 border border-slate-700/20
New:     bg-white/5 border border-white/10
```

## Result
The card will have a true frosted glass effect where you can see the animated background through it, with proper contrast on the stats so they're still readable. The colored stats will pop against the transparent glass background.
