/**
 * Aesthetic Vocabulary System
 * 
 * Maps design buzzwords (minimal, premium, bold, etc.) to concrete design tokens
 * that the AI can use to generate consistent, stylistically-coherent designs.
 */

export interface AestheticProfile {
  description: string;
  spacing: string;
  colors: string;
  typography: string;
  borders: string;
  shadows: string;
  radius: string;
  animation: string;
  backgroundSuggestions: string[];
  ctaStyle: string;
}

export const AESTHETIC_VOCABULARY: Record<string, AestheticProfile> = {
  // ============================================================
  // MOOD / VIBE AESTHETICS
  // ============================================================
  
  minimal: {
    description: "Clean, uncluttered, lots of whitespace, focus on content",
    spacing: "Generous: 48-128px section padding, 32px between elements",
    colors: "Neutral palette, max 2 accent colors, muted tones",
    typography: "Light weight (300-400), generous line-height (1.6-1.8), single font family",
    borders: "None or hairline (1px), very subtle",
    shadows: "None or extremely subtle (0 2px 8px rgba(0,0,0,0.04))",
    radius: "None to small (0-4px), or full pill",
    animation: "Subtle, slow (300-500ms), ease-out, minimal movement",
    backgroundSuggestions: ["solid white/off-white", "very light gray (#fafafa)", "single light gradient"],
    ctaStyle: "Outline or text-only, single primary button"
  },
  
  premium: {
    description: "Luxurious, sophisticated, high-end, exclusive feel",
    spacing: "Very generous: 64-160px section padding, breathing room everywhere",
    colors: "Dark backgrounds (#0a0a0a to #1a1a1a), gold/silver accents, muted jewel tones",
    typography: "Serif headlines (Playfair, Cormorant), light weights (300), generous tracking",
    borders: "Thin with subtle gradients, gold/metallic accents",
    shadows: "Layered, soft (20-40px blur), warm undertones",
    radius: "Small (4-8px), consistent, never full pill",
    animation: "Elegant, eased (400-600ms cubic-bezier), subtle parallax",
    backgroundSuggestions: ["dark gradient", "subtle texture overlay", "deep matte black"],
    ctaStyle: "Gold/accent gradient, refined hover with glow"
  },
  
  bold: {
    description: "Striking, confident, attention-grabbing, high energy",
    spacing: "Compact with purposeful dramatic breaks, 32-64px sections",
    colors: "High contrast, vibrant primaries, neon accents acceptable",
    typography: "Extra-bold (800-900), UPPERCASE headlines, tight tracking",
    borders: "Thick (2-4px), solid bright colors",
    shadows: "Hard, offset shadows (4-8px offset, no blur)",
    radius: "None OR full pill, nothing in between",
    animation: "Snappy, quick (100-200ms), spring physics, bold transforms",
    backgroundSuggestions: ["solid bright colors", "stark contrasts", "geometric patterns"],
    ctaStyle: "Large, full-width, high contrast with scale hover"
  },
  
  playful: {
    description: "Fun, energetic, friendly, approachable, casual",
    spacing: "Varied, asymmetrical, unexpected gaps, 24-48px typical",
    colors: "Bright, saturated, multi-color palette (3-4 colors), pastels ok",
    typography: "Rounded fonts, varied sizes, handwritten accents acceptable",
    borders: "Dashed or dotted, colorful, wavy possible",
    shadows: "Colored shadows (10-20% primary color), offset",
    radius: "Large (16-24px), bubbly feel",
    animation: "Bouncy, spring physics, playful micro-interactions",
    backgroundSuggestions: ["gradient mesh", "illustrated elements", "confetti patterns"],
    ctaStyle: "Colorful, rounded, bouncy hover with rotation"
  },
  
  cinematic: {
    description: "Dramatic, immersive, movie-like, full-screen experiences",
    spacing: "Full-viewport sections, minimal padding within, 100vh height",
    colors: "Deep blacks, dramatic contrast, selective color pops",
    typography: "Display fonts, very large scale (64-120px), ultra-thin or ultra-bold",
    borders: "None, rely entirely on contrast and shadow",
    shadows: "Dramatic, directional (like stage lighting)",
    radius: "None, sharp edges",
    animation: "Parallax, fade reveals, Ken Burns on images, slow (600-1000ms)",
    backgroundSuggestions: ["full-bleed videos", "dramatic photography", "dark with spotlight"],
    ctaStyle: "Minimal but prominent, appears on scroll or after video"
  },
  
  // ============================================================
  // TECHNICAL STYLE AESTHETICS
  // ============================================================
  
  glassmorphism: {
    description: "Translucent, layered, modern, frosted glass effect",
    spacing: "Standard (24-48px), cards float above background",
    colors: "Semi-transparent (5-15% opacity white/black), gradient backgrounds required",
    typography: "Clean sans-serif, slightly heavier weight for readability (500-600)",
    borders: "Subtle white (10-20% opacity), 1px",
    shadows: "Backdrop-blur (12-24px), layered soft shadows",
    radius: "Medium-large (12-24px), consistent",
    animation: "Smooth, subtle depth shifts, layer transitions",
    backgroundSuggestions: ["gradient mesh", "blurred image", "animated gradient"],
    ctaStyle: "Frosted glass with blur, light glow on hover"
  },
  
  neobrutalist: {
    description: "Raw, unconventional, anti-design, intentionally rough",
    spacing: "Irregular, breaking grid intentionally, overlapping elements",
    colors: "Harsh combinations, clashing is acceptable, limited palette (2-3)",
    typography: "Mono OR display, wildly varied sizes, uneven alignment",
    borders: "Thick black (3-6px), visible and intentional",
    shadows: "Hard offset only (4-8px), no blur, black or neon",
    radius: "None, sharp corners only",
    animation: "Jarring, intentionally rough, or none at all",
    backgroundSuggestions: ["solid harsh colors", "checker patterns", "raw textures"],
    ctaStyle: "Thick border, stark colors, offset on hover"
  },
  
  editorial: {
    description: "Magazine-like, refined typography, content-focused",
    spacing: "Based on baseline grid, precise rhythm, 32-48px typical",
    colors: "Mostly black and white, single accent color for links/CTAs",
    typography: "Refined serif (Georgia, Times), proper typographic hierarchy",
    borders: "Thin dividers between sections, hairline",
    shadows: "Rare, only for elevation (dropdowns, modals)",
    radius: "None to minimal (2-4px)",
    animation: "Minimal, text reveals, subtle underlines",
    backgroundSuggestions: ["clean white", "off-white/cream", "newspaper texture"],
    ctaStyle: "Text-based, underlined, or minimal button"
  },
  
  tech: {
    description: "Modern SaaS, developer-friendly, clean and functional",
    spacing: "Consistent 8px grid, 48-80px sections, well-organized",
    colors: "Dark or light mode, single primary (often blue/purple), semantic colors",
    typography: "Clean sans-serif (Inter, SF Pro), code fonts for accents",
    borders: "Subtle (1px), used for card definition",
    shadows: "Subtle elevation system, consistent scale",
    radius: "Medium (8-12px), consistent across components",
    animation: "Functional, 200-300ms, transforms and opacity",
    backgroundSuggestions: ["grid patterns", "subtle dots", "gradient mesh"],
    ctaStyle: "Solid primary, clear hover state, focus ring"
  },
  
  organic: {
    description: "Natural, earthy, warm, wellness-focused",
    spacing: "Generous but not extreme, 40-80px sections, flowing",
    colors: "Earth tones (greens, browns, terracotta), cream/warm whites",
    typography: "Rounded sans-serif OR warm serif, medium weights",
    borders: "Rare, organic shapes if used",
    shadows: "Warm, soft (15-30px blur), low opacity",
    radius: "Large organic (16-32px), blob shapes acceptable",
    animation: "Slow, breathing, wave-like movements",
    backgroundSuggestions: ["warm gradients", "natural textures", "subtle leaf patterns"],
    ctaStyle: "Rounded, warm colors, gentle hover"
  },
  
  retro: {
    description: "Vintage-inspired, nostalgic, 70s/80s/90s influences",
    spacing: "Dense or generous depending on era, 32-64px",
    colors: "Era-specific palettes (70s earth, 80s neon, 90s web)",
    typography: "Period-appropriate fonts (70s: rounded, 80s: geometric, 90s: pixel)",
    borders: "Heavy or none depending on era",
    shadows: "Long offset (80s) or none (90s pixel)",
    radius: "Era-specific (70s: rounded, 80s: none, 90s: small)",
    animation: "Era-appropriate or intentionally limited",
    backgroundSuggestions: ["halftone patterns", "gradient meshes", "checkerboard"],
    ctaStyle: "Period-appropriate button style"
  },
  
  corporate: {
    description: "Professional, trustworthy, enterprise-ready",
    spacing: "Structured, grid-based, 48-64px sections",
    colors: "Conservative (blues, grays), single accent for CTAs",
    typography: "Professional sans-serif (Inter, Open Sans), clear hierarchy",
    borders: "Clean 1px borders, well-defined cards",
    shadows: "Subtle, professional elevation",
    radius: "Small (4-8px), consistent",
    animation: "Minimal, functional only, 200-300ms",
    backgroundSuggestions: ["white", "light gray", "subtle blue tint"],
    ctaStyle: "Solid blue, professional hover, clear focus"
  }
};

// ============================================================
// AESTHETIC DETECTION & FORMATTING
// ============================================================

const AESTHETIC_KEYWORDS: Record<string, string[]> = {
  minimal: ['minimal', 'minimalist', 'clean', 'simple', 'whitespace', 'sparse'],
  premium: ['premium', 'luxury', 'luxurious', 'high-end', 'upscale', 'exclusive', 'elegant'],
  bold: ['bold', 'striking', 'loud', 'vibrant', 'energetic', 'powerful'],
  playful: ['playful', 'fun', 'friendly', 'casual', 'whimsical', 'cheerful'],
  cinematic: ['cinematic', 'dramatic', 'immersive', 'movie', 'theatrical', 'epic'],
  glassmorphism: ['glass', 'glassmorphism', 'frosted', 'translucent', 'blur'],
  neobrutalist: ['brutalist', 'neobrutalist', 'raw', 'anti-design', 'unconventional'],
  editorial: ['editorial', 'magazine', 'publication', 'journalistic', 'content-first'],
  tech: ['tech', 'saas', 'developer', 'software', 'modern', 'functional'],
  organic: ['organic', 'natural', 'earthy', 'wellness', 'health', 'eco'],
  retro: ['retro', 'vintage', '70s', '80s', '90s', 'nostalgic', 'throwback'],
  corporate: ['corporate', 'enterprise', 'business', 'professional', 'b2b']
};

/**
 * Detects aesthetic keywords from a prompt and returns matching aesthetics
 */
export function extractAestheticsFromPrompt(prompt: string): string[] {
  const lowerPrompt = prompt.toLowerCase();
  const detected: string[] = [];
  
  for (const [aesthetic, keywords] of Object.entries(AESTHETIC_KEYWORDS)) {
    if (keywords.some(kw => lowerPrompt.includes(kw))) {
      detected.push(aesthetic);
    }
  }
  
  return detected;
}

/**
 * Returns formatted aesthetic rules for the AI prompt based on detected aesthetics
 */
export function getAestheticRules(aesthetics: string[]): string {
  if (aesthetics.length === 0) {
    return '';
  }
  
  const rules: string[] = ['=== AESTHETIC STYLE RULES ===\n'];
  
  for (const aesthetic of aesthetics) {
    const profile = AESTHETIC_VOCABULARY[aesthetic];
    if (profile) {
      rules.push(`
### ${aesthetic.toUpperCase()} AESTHETIC
${profile.description}

Design Tokens:
- SPACING: ${profile.spacing}
- COLORS: ${profile.colors}
- TYPOGRAPHY: ${profile.typography}
- BORDERS: ${profile.borders}
- SHADOWS: ${profile.shadows}
- BORDER RADIUS: ${profile.radius}
- ANIMATION: ${profile.animation}
- CTA STYLE: ${profile.ctaStyle}

Background suggestions: ${profile.backgroundSuggestions.join(', ')}
`);
    }
  }
  
  return rules.join('\n');
}

/**
 * Returns a condensed version for token-limited contexts
 */
export function getAestheticSummary(aesthetics: string[]): string {
  if (aesthetics.length === 0) return '';
  
  const summaries: string[] = [];
  for (const aesthetic of aesthetics) {
    const profile = AESTHETIC_VOCABULARY[aesthetic];
    if (profile) {
      summaries.push(`${aesthetic}: ${profile.description}`);
    }
  }
  
  return `Target aesthetics: ${summaries.join('; ')}`;
}
