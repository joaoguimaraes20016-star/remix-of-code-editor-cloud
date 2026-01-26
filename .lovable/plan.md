
Goal
- Make the auth hero background show clearly visible, “soft glow patch” drift (no “nothing happens”).
- Remove the thin black line on the far-right edge of the hero panel.

What’s happening now (based on your screenshot + code)
- The hero right panel uses a static base image plus 4 masked overlays (`.auth-hero-piece-*`) that animate via CSS.
- You’re reporting “no movement” even though animations exist. The most likely causes:
  1) The current effect is too subtle on your screen because the overlays are low-opacity, heavily blurred, and blended.
  2) Mask/blend rendering quirks can make these overlays effectively invisible depending on browser/GPU/compositing.
- The “black line” on the far-right edge is most likely an edge/compositing artifact from:
  - sub-pixel rendering + overflow clipping + blur/masks, or
  - the base container background peeking through at the extreme edge.

Solution approach (predictable + explainable)
- Keep the base image completely static (already correct).
- Replace the masked “image patches” approach with “true glow patches” that do not depend on `mask-image` to be visible:
  - Each glow patch is a large radial-gradient blob (blue/cyan tones) with blur.
  - Each blob animates independently in different directions.
  - This guarantees obvious motion even if masking/blending behaves differently across browsers.
- Add a small “seam cover” overlay on the far-right edge of the hero panel to remove the black line deterministically.

Implementation steps (code changes)
1) Update `src/styles/auth-hero-motion.css`
   A. Keep `.auth-hero-base` static, but make it more “bulletproof” against edge artifacts:
      - Increase overscan (either via larger negative inset in TSX or via scale here).
      - Add `transform: translateZ(0) scale(...)` (GPU compositing helps avoid 1px seams).
   B. Introduce new glow patch classes that are not image-based:
      - `.auth-hero-glow` (base glow style):
        - `position: absolute; inset: -20%` (big enough so movement never reveals edges)
        - `background: radial-gradient(...)` (soft blob)
        - `filter: blur(50px) saturate(1.2)` (soft + “premium”)
        - `opacity: 0.18–0.35` (noticeable)
        - `mix-blend-mode: screen` or `soft-light` (we’ll pick the one that reads best on your background)
      - Create 4 variants `.auth-hero-glow-1..4` each with:
        - Different starting positions
        - Different gradient colors (all within your blue palette)
        - Different animation durations (e.g. 5.5s, 6.5s, 7.5s, 9s)
        - Different directions (up-left, down-right, right-up, left-down)
   C. Add `@media (prefers-reduced-motion: reduce)` to disable the glow animations (keeps accessibility; you can still get motion if your system is not reduced-motion).

2) Update `src/pages/Auth.tsx` (hero section only)
   A. Keep the base image as-is but increase coverage:
      - Change the base image overscan from `-inset-16 w-[calc(100%+128px)] ...` to a slightly larger overscan (e.g. `-inset-24` / `-inset-28`) to guarantee no edge reveal on any DPI/rounding scenario.
   B. Replace the 4 current overlay `div`s:
      - Remove `auth-hero-piece auth-hero-piece-*` layers.
      - Add 4 `div`s with `auth-hero-glow auth-hero-glow-*`.
      - These will be visually obvious and reliably animated.
   C. Fix the right-edge black line with a deterministic seam-cover:
      - Add an absolute overlay inside the hero container:
        - `right: 0; top: 0; bottom: 0; width: 6–12px;`
        - background: `bg-gradient-to-l from-slate-950 via-slate-950/70 to-transparent`
      - This hides any 1px GPU/compositing seam without changing layout or relying on “magic”.

3) Verification checklist (what we’ll confirm in preview)
- Motion:
  - You can clearly see at least 2–4 independent glow blobs drifting at all times.
  - Motion is “noticeable drift” (not subtle) while still smooth (no jitter).
- No gaps:
  - The base image never reveals empty edges during the animation (it won’t be animated).
- No black line:
  - The far-right edge seam is gone at all zoom levels (100% and 90/110%).
- Consistency:
  - Works on large screens (lg+) where the hero shows; mobile remains unchanged (hero hidden).
  - No new “weird block” artifacts because we’re not using hard masks.

Files touched
- `src/styles/auth-hero-motion.css` (rework overlays to gradient glow patches, improve compositing)
- `src/pages/Auth.tsx` (swap overlay elements, increase base overscan, add seam cover overlay)

Notes / tradeoffs
- This approach is more robust than mask-based “moving pieces” because it doesn’t depend on browser-specific mask rendering and it’s easy to tune (opacity/blur/speed).
- It stays consistent with your “predictable, transparent” rule: base is static; glows are clearly separate layers; no hidden logic.

Acceptance criteria (what you should see when done)
- The hero background feels “alive”: 4 soft glows drifting independently.
- No visible black line on the far right edge.
- The effect looks premium (soft, not blocky), with clearly noticeable motion.
