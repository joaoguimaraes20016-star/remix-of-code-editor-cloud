
# Phase 2: Create CSS Design System

## Overview

Create a comprehensive CSS design system for `funnel-builder-v3` by porting the best elements from `src/flow-canvas/index.css` and `src/flow-canvas/builder/styles/mobile.css`.

## Files to Create

### File: `src/funnel-builder-v3/styles/builder.css`

This single CSS file will contain all the design tokens and styles needed for the v3 builder, organized into clear sections:

---

## Section 1: Design Tokens (~100 lines)

```css
/* Builder v3 Design Tokens */
:root {
  /* Core builder colors (HSL values) */
  --builder-v3-bg: 220 13% 8%;
  --builder-v3-surface: 220 13% 10%;
  --builder-v3-surface-hover: 220 13% 14%;
  --builder-v3-surface-active: 220 13% 18%;
  --builder-v3-border: 220 13% 16%;
  --builder-v3-border-subtle: 220 13% 13%;
  
  /* Text hierarchy */
  --builder-v3-text: 210 20% 96%;
  --builder-v3-text-secondary: 210 15% 80%;
  --builder-v3-text-muted: 215 12% 62%;
  --builder-v3-text-dim: 215 12% 52%;
  
  /* Accent colors */
  --builder-v3-accent: 217 91% 60%;
  --builder-v3-accent-glow: 217 91% 66%;
  --builder-v3-success: 142 71% 45%;
  --builder-v3-warning: 38 92% 50%;
  --builder-v3-error: 0 84% 60%;
  
  /* Selection colors */
  --builder-v3-selection-section: 210 85% 48%;
  --builder-v3-selection-block: 217 91% 60%;
  --builder-v3-selection-element: 214 85% 55%;
  
  /* Transitions */
  --builder-v3-transition: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --builder-v3-transition-fast: 150ms;
  --builder-v3-transition-slow: 400ms;
  
  /* Radius */
  --builder-v3-radius-sm: 6px;
  --builder-v3-radius-md: 10px;
  --builder-v3-radius-lg: 16px;
  --builder-v3-radius-xl: 24px;
  
  /* Touch targets */
  --builder-v3-touch-target: 44px;
  
  /* Canvas */
  --builder-v3-canvas-bg: 0 0% 3%;
  --builder-v3-canvas-grid: 0 0% 8%;
}
```

---

## Section 2: Device Frame Styles (~80 lines)

Port from lines 447-527 of `index.css`:

```css
/* Device Frames */
.builder-v3-device-frame {
  position: relative;
  border-radius: var(--builder-v3-radius-xl);
  overflow: visible;
  box-shadow: 
    0 0 0 1px hsl(var(--builder-v3-border) / 0.3),
    0 25px 50px -12px rgba(0, 0, 0, 0.4),
    0 0 80px -20px hsl(var(--builder-v3-accent) / 0.15);
}

.builder-v3-device-frame--mobile {
  width: 375px;
  border-radius: 52px;
}

.builder-v3-device-frame--tablet {
  width: 768px;
  border-radius: 28px;
}

.builder-v3-device-frame--desktop {
  width: 1200px;
  border-radius: 12px;
}

/* Phone notch / dynamic island */
.builder-v3-phone-notch {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 126px;
  height: 37px;
  background: #000;
  border-radius: 20px;
  z-index: 10;
}

/* Home indicator */
.builder-v3-home-indicator {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 134px;
  height: 5px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 100px;
}

/* Browser bar for desktop */
.builder-v3-browser-bar {
  height: 36px;
  background: hsl(var(--builder-v3-surface));
  border-bottom: 1px solid hsl(var(--builder-v3-border));
  border-radius: 12px 12px 0 0;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;
}

.builder-v3-traffic-lights {
  display: flex;
  gap: 6px;
}

.builder-v3-traffic-light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.builder-v3-traffic-light--red { background: #ff5f57; }
.builder-v3-traffic-light--yellow { background: #febc2e; }
.builder-v3-traffic-light--green { background: #28c840; }
```

---

## Section 3: Selection States (~60 lines)

Port from lines 238-343 of `index.css`:

```css
/* Block Selection System */
.builder-v3-selectable {
  position: relative;
  cursor: pointer;
  transition: all var(--builder-v3-transition-fast);
}

.builder-v3-selectable:hover {
  outline: 1px solid hsl(var(--builder-v3-selection-element) / 0.4);
  outline-offset: 2px;
}

.builder-v3-selected {
  outline: 2px solid hsl(var(--builder-v3-selection-element));
  outline-offset: 3px;
}

.builder-v3-selected--block {
  outline: 2px solid hsl(var(--builder-v3-selection-block));
  outline-offset: 2px;
}

/* Hide selection in preview mode */
[data-preview="true"] .builder-v3-selectable:hover,
[data-preview="true"] .builder-v3-selected {
  outline: none !important;
}
```

---

## Section 4: Animation Keyframes (~100 lines)

Port from lines 777-964 of `index.css`:

```css
/* Animation Keyframes */
@keyframes builder-v3-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes builder-v3-slide-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes builder-v3-slide-down {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes builder-v3-slide-left {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes builder-v3-slide-right {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes builder-v3-scale-in {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes builder-v3-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes builder-v3-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes builder-v3-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@keyframes builder-v3-wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-3deg); }
  75% { transform: rotate(3deg); }
}

@keyframes builder-v3-blur-in {
  from { filter: blur(10px); opacity: 0; }
  to { filter: blur(0); opacity: 1; }
}

@keyframes builder-v3-rotate-in {
  from { transform: rotate(-10deg) scale(0.9); opacity: 0; }
  to { transform: rotate(0deg) scale(1); opacity: 1; }
}

@keyframes builder-v3-glow-pulse {
  0%, 100% { box-shadow: 0 0 5px hsl(var(--builder-v3-accent) / 0.5); }
  50% { box-shadow: 0 0 20px hsl(var(--builder-v3-accent) / 0.8); }
}

/* Animation utility classes */
.builder-v3-animate-fade-in { animation: builder-v3-fade-in 0.5s ease-out forwards; }
.builder-v3-animate-slide-up { animation: builder-v3-slide-up 0.5s ease-out forwards; }
.builder-v3-animate-slide-down { animation: builder-v3-slide-down 0.5s ease-out forwards; }
.builder-v3-animate-slide-left { animation: builder-v3-slide-left 0.5s ease-out forwards; }
.builder-v3-animate-slide-right { animation: builder-v3-slide-right 0.5s ease-out forwards; }
.builder-v3-animate-scale-in { animation: builder-v3-scale-in 0.4s ease-out forwards; }
.builder-v3-animate-bounce { animation: builder-v3-bounce 0.6s ease-in-out; }
.builder-v3-animate-pulse { animation: builder-v3-pulse 2s ease-in-out infinite; }
.builder-v3-animate-shake { animation: builder-v3-shake 0.5s ease-in-out; }
.builder-v3-animate-wiggle { animation: builder-v3-wiggle 0.5s ease-in-out infinite; }
.builder-v3-animate-blur-in { animation: builder-v3-blur-in 0.6s ease-out forwards; }
.builder-v3-animate-rotate-in { animation: builder-v3-rotate-in 0.6s ease-out forwards; }
.builder-v3-animate-glow { animation: builder-v3-glow-pulse 2s ease-in-out infinite; }
```

---

## Section 5: Inspector Styles (~60 lines)

Port from lines 556-736 of `index.css`:

```css
/* Inspector Panel Styles */
.builder-v3-inspector-section {
  border-bottom: 1px solid hsl(var(--builder-v3-border-subtle));
}

.builder-v3-inspector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  background: hsl(var(--builder-v3-surface));
  transition: background var(--builder-v3-transition-fast);
}

.builder-v3-inspector-header:hover {
  background: hsl(var(--builder-v3-surface-hover));
}

.builder-v3-inspector-content {
  padding: 16px;
  padding-top: 0;
}

/* Form controls */
.builder-v3-input {
  height: 36px;
  border-radius: var(--builder-v3-radius-md);
  background: hsl(var(--builder-v3-surface-hover));
  border: 1px solid hsl(var(--builder-v3-border));
  color: hsl(var(--builder-v3-text));
  font-size: 14px;
  padding: 0 12px;
  transition: all var(--builder-v3-transition-fast);
}

.builder-v3-input:focus {
  outline: none;
  border-color: hsl(var(--builder-v3-accent));
  box-shadow: 0 0 0 2px hsl(var(--builder-v3-accent) / 0.2);
}

.builder-v3-input::placeholder {
  color: hsl(var(--builder-v3-text-dim));
}

/* Toggle pill controls */
.builder-v3-toggle-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px;
  border-radius: var(--builder-v3-radius-md);
  background: hsl(var(--builder-v3-surface-hover));
  border: 1px solid hsl(var(--builder-v3-border-subtle));
}

.builder-v3-toggle-option {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  transition: all var(--builder-v3-transition-fast);
  color: hsl(var(--builder-v3-text-dim));
}

.builder-v3-toggle-option--active {
  background: hsl(var(--builder-v3-accent));
  color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
```

---

## Section 6: Pattern Backgrounds (~40 lines)

Port from lines 1237-1272 of `index.css`:

```css
/* Background Patterns */
.builder-v3-pattern-grid {
  background-image: 
    linear-gradient(var(--pattern-color, rgba(139,92,246,0.05)) 1px, transparent 1px),
    linear-gradient(90deg, var(--pattern-color, rgba(139,92,246,0.05)) 1px, transparent 1px);
  background-size: var(--pattern-size, 40px) var(--pattern-size, 40px);
}

.builder-v3-pattern-dots {
  background-image: radial-gradient(var(--pattern-color, rgba(139,92,246,0.1)) 1px, transparent 1px);
  background-size: var(--pattern-size, 20px) var(--pattern-size, 20px);
}

.builder-v3-pattern-lines {
  background-image: repeating-linear-gradient(
    90deg,
    var(--pattern-color, rgba(139,92,246,0.05)),
    var(--pattern-color, rgba(139,92,246,0.05)) 1px,
    transparent 1px,
    transparent var(--pattern-size, 40px)
  );
}
```

---

## Section 7: Shadow Presets (~50 lines)

Port from lines 1028-1104 of `index.css`:

```css
/* Text Shadows */
.builder-v3-text-shadow-subtle { text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15); }
.builder-v3-text-shadow-medium { text-shadow: 0 2px 4px rgba(0, 0, 0, 0.25); }
.builder-v3-text-shadow-strong { text-shadow: 0 4px 8px rgba(0, 0, 0, 0.4); }
.builder-v3-text-shadow-glow {
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5),
               0 0 20px rgba(255, 255, 255, 0.3),
               0 0 30px rgba(255, 255, 255, 0.2);
}
.builder-v3-text-shadow-neon {
  text-shadow: 0 0 5px currentColor,
               0 0 10px currentColor,
               0 0 20px currentColor;
}

/* Block Shadows */
.builder-v3-shadow-sm { box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.15); }
.builder-v3-shadow-md { box-shadow: 0 4px 12px -3px rgba(0, 0, 0, 0.2); }
.builder-v3-shadow-lg { box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.3); }
.builder-v3-shadow-xl { box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.35); }
.builder-v3-shadow-glow {
  box-shadow: 0 0 30px -5px var(--glow-color, rgba(139, 92, 246, 0.4));
}
```

---

## Section 8: Utility Classes (~30 lines)

```css
/* Scrollbar */
.builder-v3-scroll::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.builder-v3-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.builder-v3-scroll::-webkit-scrollbar-thumb {
  background: hsl(var(--builder-v3-border));
  border-radius: 100px;
}

.builder-v3-scroll::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--builder-v3-text-dim));
}

/* Glass effect */
.builder-v3-glass {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: hsl(var(--builder-v3-surface) / 0.85);
}

/* Gradient text */
.builder-v3-text-gradient {
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## Import the CSS

Update `src/funnel-builder-v3/index.ts` to import the new styles:

```typescript
// Add at top
import './styles/builder.css';
```

---

## Total: ~520 lines

This creates a self-contained, well-organized CSS system that:
- Uses namespaced CSS variables (`--builder-v3-*`) to avoid conflicts
- Uses namespaced class names (`builder-v3-*`) to avoid collisions
- Includes all essential animations, shadows, patterns from legacy
- Provides device frame styling for mobile/tablet/desktop preview
- Is ready for the inspector components in Phase 3

---

## Implementation Steps

1. Create `src/funnel-builder-v3/styles/builder.css` with all sections above
2. Update `src/funnel-builder-v3/index.ts` to import the CSS
3. Verify the styles load correctly without breaking existing functionality
