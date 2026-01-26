
# Make Stats Card Background More Transparent

## What We're Changing
Making the "Live Dashboard" stats card on the login page hero section more transparent/glassmorphic so the background shows through better.

## Changes

### File: `src/pages/Auth.tsx`

**1. Update the main Card background (line 1124)**
- Current: `from-slate-900/90 via-slate-800/80 to-slate-900/90` (very opaque)
- New: `from-slate-900/40 via-slate-800/30 to-slate-900/40` (much more transparent)

**2. Update the stats grid item backgrounds (lines 1144, 1148, 1152)**
- Revenue: `from-emerald-500/20` → `from-emerald-500/10`
- MRR: `from-blue-500/20` → `from-blue-500/10`  
- Close Rate: `from-violet-500/20` → `from-violet-500/10`
- Also reduce border opacity for each

**3. Update the activity feed item backgrounds (lines 1160, 1169, 1178)**
- Current: `bg-slate-800/40`
- New: `bg-slate-800/20` (more transparent)
- Reduce border opacity: `border-slate-700/30` → `border-slate-700/20`

**4. Update card border (line 1124)**
- Current: `border-slate-600/30`
- New: `border-slate-500/20` (lighter, more subtle)

## Result
The stats card will have a true glassmorphism effect where you can see the animated background through it, making it feel more integrated with the hero section rather than a solid floating panel.
