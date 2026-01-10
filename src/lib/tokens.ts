/**
 * Design Tokens - Centralized CSS variables as typed TypeScript constants
 * Provides type-safe access to all theme colors and design values
 */

// =============================================================================
// CORE THEME COLORS
// =============================================================================

export const colors = {
  // Base
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',

  // Primary & Secondary
  primary: 'hsl(var(--primary))',
  primaryForeground: 'hsl(var(--primary-foreground))',
  secondary: 'hsl(var(--secondary))',
  secondaryForeground: 'hsl(var(--secondary-foreground))',

  // Semantic
  muted: 'hsl(var(--muted))',
  mutedForeground: 'hsl(var(--muted-foreground))',
  accent: 'hsl(var(--accent))',
  accentForeground: 'hsl(var(--accent-foreground))',
  destructive: 'hsl(var(--destructive))',
  destructiveForeground: 'hsl(var(--destructive-foreground))',

  // Layout
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',

  // Card & Popover
  card: 'hsl(var(--card))',
  cardForeground: 'hsl(var(--card-foreground))',
  popover: 'hsl(var(--popover))',
  popoverForeground: 'hsl(var(--popover-foreground))',
} as const;

// =============================================================================
// BUILDER-SPECIFIC TOKENS
// =============================================================================

export const builder = {
  // Surfaces
  bg: 'hsl(var(--builder-bg))',
  surface: 'hsl(var(--builder-surface))',
  surfaceHover: 'hsl(var(--builder-surface-hover))',
  surfaceActive: 'hsl(var(--builder-surface-active))',

  // Borders
  border: 'hsl(var(--builder-border))',
  borderSubtle: 'hsl(var(--builder-border-subtle))',

  // Text hierarchy
  text: 'hsl(var(--builder-text))',
  textSecondary: 'hsl(var(--builder-text-secondary))',
  textMuted: 'hsl(var(--builder-text-muted))',
  textDim: 'hsl(var(--builder-text-dim))',

  // Accents
  accent: 'hsl(var(--builder-accent))',
  accentGlow: 'hsl(var(--builder-accent-glow))',
  accentMuted: 'hsl(var(--builder-accent-muted))',
  accentSecondary: 'hsl(var(--builder-accent-secondary))',
  accentTertiary: 'hsl(var(--builder-accent-tertiary))',

  // Status
  success: 'hsl(var(--builder-success))',
  warning: 'hsl(var(--builder-warning))',
  error: 'hsl(var(--builder-error))',
} as const;

// =============================================================================
// INTENT COLORS (Funnel Steps)
// =============================================================================

export const intent = {
  capture: 'hsl(var(--intent-capture))',
  qualify: 'hsl(var(--intent-qualify))',
  schedule: 'hsl(var(--intent-schedule))',
  convert: 'hsl(var(--intent-convert))',
  complete: 'hsl(var(--intent-complete))',
} as const;

// Intent colors with opacity for backgrounds
export const intentBg = {
  capture: 'hsl(var(--intent-capture) / 0.15)',
  qualify: 'hsl(var(--intent-qualify) / 0.15)',
  schedule: 'hsl(var(--intent-schedule) / 0.15)',
  convert: 'hsl(var(--intent-convert) / 0.15)',
  complete: 'hsl(var(--intent-complete) / 0.15)',
} as const;

// =============================================================================
// CANVAS TOKENS
// =============================================================================

export const canvas = {
  bg: 'hsl(var(--canvas-bg))',
  grid: 'hsl(var(--canvas-grid))',
  frame: 'hsl(var(--canvas-frame))',
  frameBorder: 'hsl(var(--canvas-frame-border))',
} as const;

// =============================================================================
// SIDEBAR TOKENS
// =============================================================================

export const sidebar = {
  background: 'hsl(var(--sidebar-background))',
  foreground: 'hsl(var(--sidebar-foreground))',
  primary: 'hsl(var(--sidebar-primary))',
  primaryForeground: 'hsl(var(--sidebar-primary-foreground))',
  accent: 'hsl(var(--sidebar-accent))',
  accentForeground: 'hsl(var(--sidebar-accent-foreground))',
  border: 'hsl(var(--sidebar-border))',
  ring: 'hsl(var(--sidebar-ring))',
} as const;

// =============================================================================
// BRAND GRADIENT
// =============================================================================

export const gradient = {
  start: 'hsl(var(--gradient-start))',
  mid: 'hsl(var(--gradient-mid))',
  end: 'hsl(var(--gradient-end))',

  // Pre-composed CSS gradients
  brand: 'linear-gradient(135deg, hsl(var(--gradient-start)), hsl(var(--gradient-mid)), hsl(var(--gradient-end)))',
  brandHorizontal: 'linear-gradient(90deg, hsl(var(--gradient-start)), hsl(var(--gradient-mid)), hsl(var(--gradient-end)))',
  brandVertical: 'linear-gradient(180deg, hsl(var(--gradient-start)), hsl(var(--gradient-mid)), hsl(var(--gradient-end)))',
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const fonts = {
  sans: "'DM Sans', 'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
  display: "'Oswald', system-ui, sans-serif",
} as const;

export const fontSizes = {
  xs: '0.75rem',     // 12px
  sm: '0.875rem',    // 14px
  base: '1rem',      // 16px
  lg: '1.125rem',    // 18px
  xl: '1.25rem',     // 20px
  '2xl': '1.5rem',   // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
  '5xl': '3rem',     // 48px
  '6xl': '3.75rem',  // 60px
  '7xl': '4.5rem',   // 72px
} as const;

// =============================================================================
// SPACING & RADIUS
// =============================================================================

export const radius = {
  sm: 'calc(var(--radius) - 4px)',
  md: 'calc(var(--radius) - 2px)',
  lg: 'var(--radius)',
  xl: 'calc(var(--radius) + 4px)',
  full: '9999px',
} as const;

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
} as const;

// =============================================================================
// SHADOWS
// =============================================================================

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  glow: '0 0 20px -5px hsl(var(--builder-accent) / 0.4)',
  glowBrand: '0 0 20px -5px hsl(var(--gradient-start) / 0.3), 0 0 40px -10px hsl(var(--gradient-mid) / 0.3)',
  deviceFrame: '0 0 0 1px hsl(var(--canvas-frame-border)), 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 80px -20px hsl(var(--builder-accent) / 0.15)',
} as const;

// =============================================================================
// ANIMATIONS & TRANSITIONS
// =============================================================================

export const transitions = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easingOut: 'ease-out',
} as const;

export const animations = {
  fadeIn: 'fadeIn 0.2s ease-out',
  scaleIn: 'scale-in 0.2s ease-out',
  slideInRight: 'slide-in-right 0.3s ease-out',
  slideInLeft: 'slide-in-left 0.3s ease-out',
  accordion: 'accordion-down 0.2s ease-out',
  pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get HSL value for a CSS variable
 */
export const getHSL = (cssVar: string): string => {
  return `hsl(var(${cssVar}))`;
};

/**
 * Get color with custom opacity
 * @example withOpacity('--builder-accent', 0.5) => 'hsl(var(--builder-accent) / 0.5)'
 */
export const withOpacity = (cssVar: string, opacity: number): string => {
  return `hsl(var(${cssVar}) / ${opacity})`;
};

/**
 * Get intent color by step intent type
 */
export const getIntentColor = (intentType: keyof typeof intent): string => {
  return intent[intentType];
};

/**
 * Get intent background color by step intent type
 */
export const getIntentBgColor = (intentType: keyof typeof intent): string => {
  return intentBg[intentType];
};

// =============================================================================
// MASTER EXPORT
// =============================================================================

export const tokens = {
  colors,
  builder,
  intent,
  intentBg,
  canvas,
  sidebar,
  gradient,
  fonts,
  fontSizes,
  radius,
  spacing,
  shadows,
  transitions,
  animations,
} as const;

export type Tokens = typeof tokens;
export type IntentType = keyof typeof intent;
export type BuilderColor = keyof typeof builder;
export type ThemeColor = keyof typeof colors;
