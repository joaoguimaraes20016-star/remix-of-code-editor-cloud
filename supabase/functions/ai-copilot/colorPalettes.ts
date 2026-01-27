/**
 * Industry-Aware Color Palette System
 * 
 * Provides diverse, visually-distinct color palettes that the AI can use
 * to generate varied, industry-appropriate designs instead of always defaulting
 * to the same purple-pink gradient.
 */

// ============================================================
// COLOR PALETTE DEFINITIONS
// ============================================================

export interface ColorPalette {
  name: string;
  primary: string;
  accent: string;
  gradient: [string, string];
  // Optional tertiary for complex designs
  tertiary?: string;
  // Recommended background for this palette
  suggestedBackground: {
    light: string;
    dark: string;
  };
}

export const COLOR_PALETTES: Record<string, ColorPalette> = {
  // Warm/Energetic Palettes
  sunset: {
    name: 'Sunset',
    primary: '#F97316',
    accent: '#EF4444',
    gradient: ['#F97316', '#EF4444'],
    tertiary: '#FBBF24',
    suggestedBackground: { light: '#FFFBEB', dark: '#1C1917' }
  },
  coral: {
    name: 'Coral',
    primary: '#FB7185',
    accent: '#F43F5E',
    gradient: ['#FB7185', '#F43F5E'],
    tertiary: '#FDA4AF',
    suggestedBackground: { light: '#FFF1F2', dark: '#1F1315' }
  },
  amber: {
    name: 'Amber',
    primary: '#F59E0B',
    accent: '#D97706',
    gradient: ['#F59E0B', '#EAB308'],
    tertiary: '#FCD34D',
    suggestedBackground: { light: '#FFFBEB', dark: '#1C1917' }
  },
  peach: {
    name: 'Peach',
    primary: '#FB923C',
    accent: '#EA580C',
    gradient: ['#FDBA74', '#FB923C'],
    suggestedBackground: { light: '#FFF7ED', dark: '#1C1410' }
  },

  // Cool/Professional Palettes
  ocean: {
    name: 'Ocean',
    primary: '#0EA5E9',
    accent: '#06B6D4',
    gradient: ['#0EA5E9', '#06B6D4'],
    tertiary: '#38BDF8',
    suggestedBackground: { light: '#F0F9FF', dark: '#0C1929' }
  },
  sapphire: {
    name: 'Sapphire',
    primary: '#3B82F6',
    accent: '#6366F1',
    gradient: ['#3B82F6', '#8B5CF6'],
    tertiary: '#818CF8',
    suggestedBackground: { light: '#EFF6FF', dark: '#0F172A' }
  },
  teal: {
    name: 'Teal',
    primary: '#14B8A6',
    accent: '#0D9488',
    gradient: ['#14B8A6', '#0D9488'],
    tertiary: '#2DD4BF',
    suggestedBackground: { light: '#F0FDFA', dark: '#0D1B1A' }
  },
  azure: {
    name: 'Azure',
    primary: '#0284C7',
    accent: '#0369A1',
    gradient: ['#38BDF8', '#0284C7'],
    suggestedBackground: { light: '#F0F9FF', dark: '#0C1929' }
  },
  indigo: {
    name: 'Indigo',
    primary: '#6366F1',
    accent: '#4F46E5',
    gradient: ['#818CF8', '#6366F1'],
    suggestedBackground: { light: '#EEF2FF', dark: '#0F0F24' }
  },

  // Rich/Premium Palettes
  violet: {
    name: 'Violet',
    primary: '#8B5CF6',
    accent: '#A855F7',
    gradient: ['#8B5CF6', '#D946EF'],
    tertiary: '#C084FC',
    suggestedBackground: { light: '#FAF5FF', dark: '#0A0A0F' }
  },
  rose: {
    name: 'Rose',
    primary: '#E11D48',
    accent: '#BE185D',
    gradient: ['#E11D48', '#DB2777'],
    tertiary: '#F43F5E',
    suggestedBackground: { light: '#FFF1F2', dark: '#1F1315' }
  },
  emerald: {
    name: 'Emerald',
    primary: '#10B981',
    accent: '#059669',
    gradient: ['#10B981', '#047857'],
    tertiary: '#34D399',
    suggestedBackground: { light: '#ECFDF5', dark: '#0D1F17' }
  },
  fuchsia: {
    name: 'Fuchsia',
    primary: '#D946EF',
    accent: '#C026D3',
    gradient: ['#E879F9', '#D946EF'],
    suggestedBackground: { light: '#FDF4FF', dark: '#140A14' }
  },
  gold: {
    name: 'Gold',
    primary: '#D4AF37',
    accent: '#F5D061',
    gradient: ['#D4AF37', '#F5D061'],
    tertiary: '#C9A227',
    suggestedBackground: { light: '#FFFBEB', dark: '#0A0A0A' }
  },

  // Neutral/Minimal Palettes
  slate: {
    name: 'Slate',
    primary: '#475569',
    accent: '#64748B',
    gradient: ['#334155', '#475569'],
    tertiary: '#94A3B8',
    suggestedBackground: { light: '#F8FAFC', dark: '#0F172A' }
  },
  zinc: {
    name: 'Zinc',
    primary: '#3F3F46',
    accent: '#52525B',
    gradient: ['#27272A', '#3F3F46'],
    tertiary: '#71717A',
    suggestedBackground: { light: '#FAFAFA', dark: '#09090B' }
  },
  stone: {
    name: 'Stone',
    primary: '#57534E',
    accent: '#78716C',
    gradient: ['#44403C', '#57534E'],
    suggestedBackground: { light: '#FAFAF9', dark: '#0C0A09' }
  },

  // Nature-Inspired
  forest: {
    name: 'Forest',
    primary: '#166534',
    accent: '#15803D',
    gradient: ['#22C55E', '#16A34A'],
    suggestedBackground: { light: '#F0FDF4', dark: '#0A1A0F' }
  },
  lavender: {
    name: 'Lavender',
    primary: '#7C3AED',
    accent: '#8B5CF6',
    gradient: ['#A78BFA', '#7C3AED'],
    suggestedBackground: { light: '#F5F3FF', dark: '#0F0A1F' }
  },
  mint: {
    name: 'Mint',
    primary: '#2DD4BF',
    accent: '#14B8A6',
    gradient: ['#5EEAD4', '#2DD4BF'],
    suggestedBackground: { light: '#F0FDFA', dark: '#0D1B1A' }
  },
};

// ============================================================
// INDUSTRY MAPPING
// ============================================================

export type Industry = 
  | 'saas' 
  | 'coaching' 
  | 'ecommerce' 
  | 'agency' 
  | 'newsletter' 
  | 'event' 
  | 'fitness' 
  | 'finance'
  | 'health'
  | 'education'
  | 'realestate'
  | 'luxury'
  | 'tech'
  | 'creative'
  | 'nonprofit'
  | 'general';

const INDUSTRY_PALETTE_MAP: Record<Industry, (keyof typeof COLOR_PALETTES)[]> = {
  saas: ['sapphire', 'ocean', 'indigo', 'teal'],
  coaching: ['coral', 'rose', 'peach', 'amber'],
  ecommerce: ['amber', 'emerald', 'coral', 'violet'],
  agency: ['slate', 'zinc', 'violet', 'sapphire'],
  newsletter: ['teal', 'ocean', 'emerald', 'mint'],
  event: ['rose', 'violet', 'fuchsia', 'gold'],
  fitness: ['emerald', 'coral', 'sunset', 'teal'],
  finance: ['ocean', 'emerald', 'sapphire', 'slate'],
  health: ['teal', 'mint', 'emerald', 'ocean'],
  education: ['sapphire', 'violet', 'ocean', 'teal'],
  realestate: ['slate', 'stone', 'gold', 'emerald'],
  luxury: ['gold', 'slate', 'zinc', 'rose'],
  tech: ['sapphire', 'violet', 'indigo', 'ocean'],
  creative: ['fuchsia', 'violet', 'coral', 'amber'],
  nonprofit: ['emerald', 'teal', 'ocean', 'forest'],
  general: ['violet', 'sapphire', 'emerald', 'coral'],
};

// ============================================================
// SELECTION FUNCTIONS
// ============================================================

/**
 * Select the primary palette for an industry
 */
export function selectPaletteForIndustry(industry: string): ColorPalette {
  const normalizedIndustry = industry.toLowerCase() as Industry;
  const paletteKeys = INDUSTRY_PALETTE_MAP[normalizedIndustry] || INDUSTRY_PALETTE_MAP.general;
  const primaryKey = paletteKeys[0];
  return COLOR_PALETTES[primaryKey];
}

/**
 * Get all suitable palettes for an industry (for variety)
 */
export function getPalettesForIndustry(industry: string): ColorPalette[] {
  const normalizedIndustry = industry.toLowerCase() as Industry;
  const paletteKeys = INDUSTRY_PALETTE_MAP[normalizedIndustry] || INDUSTRY_PALETTE_MAP.general;
  return paletteKeys.map(key => COLOR_PALETTES[key]);
}

/**
 * Get a random palette suitable for an industry
 */
export function getRandomPaletteForIndustry(industry: string): ColorPalette {
  const palettes = getPalettesForIndustry(industry);
  const randomIndex = Math.floor(Math.random() * palettes.length);
  return palettes[randomIndex];
}

/**
 * Get a random palette from all available (for maximum variety)
 */
export function getRandomPalette(): ColorPalette {
  const keys = Object.keys(COLOR_PALETTES);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return COLOR_PALETTES[randomKey];
}

/**
 * Detect industry from prompt keywords
 */
export function detectIndustryFromPrompt(prompt: string): Industry {
  const lowerPrompt = prompt.toLowerCase();
  
  const industryKeywords: Record<Industry, string[]> = {
    saas: ['saas', 'software', 'app', 'platform', 'tool', 'dashboard', 'analytics'],
    coaching: ['coaching', 'coach', 'mentor', 'consulting', 'consultant', 'course', 'program', 'training'],
    ecommerce: ['ecommerce', 'e-commerce', 'shop', 'store', 'product', 'buy', 'sell', 'retail'],
    agency: ['agency', 'studio', 'creative', 'design', 'marketing', 'branding'],
    newsletter: ['newsletter', 'email', 'subscribe', 'digest', 'weekly', 'daily'],
    event: ['event', 'webinar', 'conference', 'summit', 'workshop', 'live', 'virtual'],
    fitness: ['fitness', 'gym', 'workout', 'health', 'wellness', 'nutrition', 'training'],
    finance: ['finance', 'financial', 'investment', 'trading', 'crypto', 'wealth', 'money'],
    health: ['health', 'medical', 'clinic', 'therapy', 'wellness', 'healthcare'],
    education: ['education', 'school', 'university', 'learning', 'course', 'academy', 'training'],
    realestate: ['real estate', 'realestate', 'property', 'home', 'house', 'apartment', 'listing'],
    luxury: ['luxury', 'premium', 'exclusive', 'high-end', 'vip', 'elite'],
    tech: ['tech', 'technology', 'startup', 'innovation', 'ai', 'machine learning'],
    creative: ['creative', 'art', 'design', 'photography', 'video', 'music', 'portfolio'],
    nonprofit: ['nonprofit', 'charity', 'donate', 'cause', 'foundation', 'volunteer'],
    general: [],
  };
  
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some(kw => lowerPrompt.includes(kw))) {
      return industry as Industry;
    }
  }
  
  return 'general';
}

// ============================================================
// BRAND KIT GENERATION
// ============================================================

export interface GeneratedBrandKit {
  theme: 'light' | 'dark';
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  backgroundType: 'solid' | 'gradient' | 'pattern';
  backgroundGradient?: {
    type: 'linear' | 'radial';
    angle: number;
    stops: Array<{ color: string; position: number }>;
  };
  backgroundPattern?: {
    type: 'grid' | 'dots' | 'lines';
    color: string;
    size: number;
  };
  fontFamily: string;
  headingFont: string;
}

const FONT_COMBINATIONS = [
  { body: 'Inter', heading: 'Space Grotesk' },
  { body: 'Inter', heading: 'Outfit' },
  { body: 'DM Sans', heading: 'DM Sans' },
  { body: 'Inter', heading: 'Playfair Display' },
  { body: 'Poppins', heading: 'Poppins' },
  { body: 'Inter', heading: 'Cal Sans' },
  { body: 'Satoshi', heading: 'Satoshi' },
];

/**
 * Generate a complete brand kit for an industry and theme preference
 */
export function generateBrandKit(
  industry: string, 
  preferDark: boolean = true
): GeneratedBrandKit {
  const palette = getRandomPaletteForIndustry(industry);
  const fonts = FONT_COMBINATIONS[Math.floor(Math.random() * FONT_COMBINATIONS.length)];
  const theme = preferDark ? 'dark' : 'light';
  
  // Randomly select background style
  const bgStyles = ['solid', 'gradient', 'pattern'] as const;
  const bgStyle = bgStyles[Math.floor(Math.random() * bgStyles.length)];
  
  const baseBg = theme === 'dark' ? palette.suggestedBackground.dark : palette.suggestedBackground.light;
  
  const brandKit: GeneratedBrandKit = {
    theme,
    primaryColor: palette.primary,
    accentColor: palette.accent,
    backgroundColor: baseBg,
    backgroundType: bgStyle,
    fontFamily: fonts.body,
    headingFont: fonts.heading,
  };
  
  if (bgStyle === 'gradient') {
    brandKit.backgroundGradient = {
      type: 'linear',
      angle: 180,
      stops: [
        { color: baseBg, position: 0 },
        { color: theme === 'dark' ? '#0a0a0a' : '#ffffff', position: 100 },
      ],
    };
  } else if (bgStyle === 'pattern') {
    brandKit.backgroundPattern = {
      type: 'grid',
      color: `${palette.primary}08`, // Very subtle
      size: 40,
    };
  }
  
  return brandKit;
}

// ============================================================
// PROMPT INJECTION HELPERS
// ============================================================

/**
 * Format palette information for AI prompt injection
 */
export function formatPaletteForPrompt(palette: ColorPalette): string {
  return `
=== COLOR PALETTE: ${palette.name.toUpperCase()} ===
Primary Color: ${palette.primary}
Accent Color: ${palette.accent}
Gradient: ${palette.gradient[0]} → ${palette.gradient[1]}
${palette.tertiary ? `Tertiary: ${palette.tertiary}` : ''}

Use these colors for:
- Primary: Buttons, CTAs, key highlights
- Accent: Secondary buttons, hover states, badges
- Gradient: Hero headlines, gradient-text elements
`.trim();
}

/**
 * Get full color context for AI based on prompt analysis
 */
export function getColorContextForPrompt(userPrompt: string): string {
  const industry = detectIndustryFromPrompt(userPrompt);
  const palette = getRandomPaletteForIndustry(industry);
  
  return formatPaletteForPrompt(palette);
}
