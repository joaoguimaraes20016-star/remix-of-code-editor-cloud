

# Enhancing Your AI Copilot to Lovable-Level Intelligence

## Executive Summary

Your builder already has **excellent foundations** - you've built a comprehensive knowledge system with UI principles, anti-patterns, and design examples. To reach Lovable-level intelligence, we need to add 5 key enhancements that Lovable uses but your system currently lacks.

---

## Current State Assessment

### What You Have (Solid Foundation)

| Component | Status | Quality |
|-----------|--------|---------|
| `uiKnowledge.ts` | 553 lines of design principles | Excellent |
| `antiPatterns.ts` | UI/Copy/Structural anti-patterns | Good |
| `designExamples.ts` | Hero, Feature, Pricing patterns | Good |
| `prompts.ts` | Context-aware prompt injection | Good |
| Content Snapshot Extractor | Page content analysis | Good |
| Contrast Context | Color luminance calculations | Good |

### What You're Missing (Lovable's Edge)

1. **Prompt Patterns Library** - Structured templates users can invoke
2. **Aesthetic Vocabulary System** - Buzzword-to-style mappings
3. **Component-Level Generation** - Atomic design primitives
4. **Industry-Specific Knowledge** - Vertical-aware design rules
5. **Dynamic Quality Scoring** - Post-generation validation

---

## The 5 Enhancements

### Enhancement 1: Aesthetic Vocabulary System

Lovable understands design buzzwords like "minimal," "premium," "cinematic," "playful." We need to create a mapping from these aesthetic terms to concrete design tokens.

**New File**: `supabase/functions/ai-copilot/aestheticVocabulary.ts`

```typescript
export const AESTHETIC_VOCABULARY = {
  // Mood/Vibe Terms
  minimal: {
    description: "Clean, uncluttered, lots of whitespace",
    spacing: "generous (32-96px sections)",
    colors: "neutral palette, max 2 accent colors",
    typography: "light weight, generous line-height",
    borders: "none or hairline (1px)",
    shadows: "subtle or none",
    radius: "none to small (0-4px)",
    animation: "subtle, slow (300-500ms)"
  },
  
  premium: {
    description: "Luxurious, sophisticated, high-end",
    spacing: "very generous (48-128px sections)",
    colors: "dark backgrounds, gold/silver accents",
    typography: "serif headlines, light weights",
    borders: "thin, subtle gradients",
    shadows: "layered, soft (20-40px blur)",
    radius: "small (4-8px)",
    animation: "elegant, eased (400-600ms)"
  },
  
  bold: {
    description: "Striking, confident, attention-grabbing",
    spacing: "compact with purposeful breaks",
    colors: "high contrast, vibrant primaries",
    typography: "extra-bold (800-900), uppercase headlines",
    borders: "thick (2-4px), solid colors",
    shadows: "hard, offset shadows",
    radius: "none or full pill",
    animation: "snappy, quick (150-250ms)"
  },
  
  playful: {
    description: "Fun, energetic, friendly",
    spacing: "varied, asymmetrical",
    colors: "bright, saturated, multi-color",
    typography: "rounded fonts, mixed sizes",
    borders: "dashed or dotted, colorful",
    shadows: "colored shadows, offset",
    radius: "large (16-24px)",
    animation: "bouncy, spring physics"
  },
  
  cinematic: {
    description: "Dramatic, immersive, movie-like",
    spacing: "full-viewport sections",
    colors: "deep blacks, dramatic contrast",
    typography: "display fonts, large scale",
    borders: "none, rely on contrast",
    shadows: "dramatic, directional",
    radius: "none",
    animation: "parallax, fade reveals"
  },
  
  glassmorphism: {
    description: "Translucent, layered, modern",
    spacing: "standard (24-48px)",
    colors: "semi-transparent (5-15% opacity)",
    typography: "clean sans-serif",
    borders: "subtle white/10-20%",
    shadows: "backdrop-blur (12-24px)",
    radius: "medium-large (12-20px)",
    animation: "smooth, subtle depth shifts"
  },
  
  neobrutalist: {
    description: "Raw, unconventional, anti-design",
    spacing: "irregular, breaking grid",
    colors: "harsh combinations, often clashing",
    typography: "mono or display, varied sizes",
    borders: "thick black (3-6px)",
    shadows: "hard offset (no blur)",
    radius: "none",
    animation: "jarring, intentionally rough"
  }
};

export function getAestheticRules(buzzwords: string[]): string {
  const rules: string[] = [];
  
  for (const word of buzzwords) {
    const aesthetic = AESTHETIC_VOCABULARY[word.toLowerCase()];
    if (aesthetic) {
      rules.push(`
${word.toUpperCase()} AESTHETIC:
- Spacing: ${aesthetic.spacing}
- Colors: ${aesthetic.colors}
- Typography: ${aesthetic.typography}
- Borders: ${aesthetic.borders}
- Shadows: ${aesthetic.shadows}
- Border Radius: ${aesthetic.radius}
- Animation: ${aesthetic.animation}
      `);
    }
  }
  
  return rules.join('\n');
}
```

---

### Enhancement 2: Industry-Specific Knowledge

Lovable generates different designs for SaaS vs e-commerce vs coaching. We need vertical-aware design rules.

**New File**: `supabase/functions/ai-copilot/industryKnowledge.ts`

```typescript
export const INDUSTRY_PATTERNS = {
  saas: {
    name: "SaaS / Software",
    heroStyle: "Split layout - text left, product screenshot right",
    trustSignals: ["Logo bar (enterprise clients)", "Uptime stats", "Security badges"],
    colorPsychology: "Blue/Purple for trust + innovation",
    ctaPatterns: ["Free trial", "Start free", "See demo", "Book a call"],
    keyElements: ["Feature grid", "Pricing table", "Integration logos", "Product screenshots"],
    avoidElements: ["Heavy imagery", "Long paragraphs", "Emotional appeals"],
    socialProof: "Customer logos > testimonials",
    pricingStyle: "3-tier with annual discount"
  },
  
  coaching: {
    name: "Coaching / Personal Brand",
    heroStyle: "Center-aligned with personal photo",
    trustSignals: ["Media logos", "Certifications", "Results testimonials"],
    colorPsychology: "Warm tones for approachability OR dark premium",
    ctaPatterns: ["Book a call", "Apply now", "Get the free guide", "Watch the training"],
    keyElements: ["About/story section", "Transformation testimonials", "Video content"],
    avoidElements: ["Generic stock photos", "Tech jargon"],
    socialProof: "Transformation testimonials with before/after",
    pricingStyle: "Application-based OR single high-ticket"
  },
  
  ecommerce: {
    name: "E-commerce / Product",
    heroStyle: "Product-centric with lifestyle imagery",
    trustSignals: ["Review stars", "Units sold", "Secure payment badges"],
    colorPsychology: "Matches product/brand, clean backgrounds",
    ctaPatterns: ["Add to cart", "Buy now", "Shop collection", "Get yours"],
    keyElements: ["Product gallery", "Size/variant selectors", "Urgency indicators"],
    avoidElements: ["Long-form copy", "Multiple CTAs per product"],
    socialProof: "Star ratings + review count",
    pricingStyle: "Clear price, strikethrough for sales"
  },
  
  agency: {
    name: "Agency / Services",
    heroStyle: "Bold statement + work showcase",
    trustSignals: ["Client logos", "Case study results", "Awards"],
    colorPsychology: "Black/white with single accent OR bold creative",
    ctaPatterns: ["Start a project", "Get a quote", "Let's talk", "See our work"],
    keyElements: ["Portfolio grid", "Process section", "Team photos"],
    avoidElements: ["Generic service descriptions", "Stock imagery"],
    socialProof: "Case studies with metrics",
    pricingStyle: "Quote-based / Custom"
  },
  
  newsletter: {
    name: "Newsletter / Content",
    heroStyle: "Minimal - headline + email capture",
    trustSignals: ["Subscriber count", "Where featured", "Sample content"],
    colorPsychology: "Clean, readable, single accent",
    ctaPatterns: ["Subscribe free", "Get it in your inbox", "Join X readers"],
    keyElements: ["Content preview", "Single email input", "Benefits bullets"],
    avoidElements: ["Too many fields", "Distracting elements"],
    socialProof: "Subscriber count, reader testimonials",
    pricingStyle: "Free or simple paid tier"
  },
  
  event: {
    name: "Event / Webinar",
    heroStyle: "Date-prominent with countdown",
    trustSignals: ["Speaker credentials", "Attendee count", "Company logos"],
    colorPsychology: "Energetic, urgent (orange, red accents)",
    ctaPatterns: ["Register now", "Save your spot", "Claim your seat"],
    keyElements: ["Countdown timer", "Agenda/schedule", "Speaker bios"],
    avoidElements: ["Buried registration", "Unclear date/time"],
    socialProof: "Past attendee testimonials, registrant count",
    pricingStyle: "Free OR early bird discount"
  }
};

export function getIndustryGuidance(industry: string): string {
  const pattern = INDUSTRY_PATTERNS[industry.toLowerCase()];
  if (!pattern) return '';
  
  return `
=== INDUSTRY-SPECIFIC DESIGN (${pattern.name}) ===

Hero Layout: ${pattern.heroStyle}
Color Psychology: ${pattern.colorPsychology}

Trust Signals to Include:
${pattern.trustSignals.map(t => `- ${t}`).join('\n')}

Recommended CTAs:
${pattern.ctaPatterns.map(c => `- "${c}"`).join('\n')}

Key Elements:
${pattern.keyElements.map(e => `- ${e}`).join('\n')}

Elements to AVOID:
${pattern.avoidElements.map(a => `- ${a}`).join('\n')}

Social Proof Style: ${pattern.socialProof}
Pricing Approach: ${pattern.pricingStyle}
`;
}
```

---

### Enhancement 3: Component Atoms Library

Lovable thinks in atomic components. We need a structured library of primitives.

**New File**: `supabase/functions/ai-copilot/componentAtoms.ts`

```typescript
export const COMPONENT_ATOMS = {
  // === INPUT ATOMS ===
  inputs: {
    email: {
      width: "280-320px",
      placeholder: "you@example.com",
      autocomplete: "email",
      validation: "email format",
      label: "Email address"
    },
    name: {
      width: "200-280px",
      placeholder: "Jane Smith",
      autocomplete: "name",
      label: "Full name"
    },
    phone: {
      width: "200-240px",
      placeholder: "+1 (555) 000-0000",
      autocomplete: "tel",
      type: "tel",
      label: "Phone number"
    }
  },
  
  // === BUTTON ATOMS ===
  buttons: {
    primary: {
      minHeight: "48px",
      padding: "12-16px vertical, 24-48px horizontal",
      fontWeight: "600-700",
      textTransform: "none or uppercase",
      states: ["default", "hover (+10% darker)", "active (scale 0.98)", "disabled (50% opacity)"]
    },
    secondary: {
      style: "outline or muted fill",
      usage: "alternative actions, back buttons",
      contrast: "lower than primary"
    },
    ghost: {
      style: "text only, minimal padding",
      usage: "tertiary actions, links that need button shape"
    }
  },
  
  // === CARD ATOMS ===
  cards: {
    basic: {
      padding: "24-32px",
      radius: "8-16px",
      shadow: "subtle (0 4px 12px rgba(0,0,0,0.08))",
      border: "1px subtle or none"
    },
    feature: {
      structure: "icon → title → description",
      iconSize: "32-48px",
      titleSize: "18-20px",
      descriptionSize: "14-16px"
    },
    testimonial: {
      structure: "quote → avatar + name + title",
      quoteSize: "16-18px",
      quoteStyle: "italic or larger",
      avatarSize: "48-64px"
    },
    pricing: {
      structure: "tier name → price → description → features → CTA",
      highlight: "scale 1.05 OR border accent OR badge",
      featureList: "checkmarks, 5-8 items"
    }
  },
  
  // === BADGE ATOMS ===
  badges: {
    info: { bg: "blue-100", text: "blue-700", icon: "info" },
    success: { bg: "green-100", text: "green-700", icon: "check" },
    warning: { bg: "yellow-100", text: "yellow-700", icon: "alert-triangle" },
    error: { bg: "red-100", text: "red-700", icon: "x-circle" },
    neutral: { bg: "gray-100", text: "gray-700", icon: null }
  },
  
  // === AVATAR ATOMS ===
  avatars: {
    sizes: {
      xs: "24px",
      sm: "32px",
      md: "48px",
      lg: "64px",
      xl: "96px"
    },
    group: {
      overlap: "-8px to -12px",
      max: "5 visible + count badge",
      border: "2px white ring"
    }
  },
  
  // === SPACING ATOMS ===
  spacing: {
    inlineElements: "4-8px",
    relatedGroups: "16px",
    subsections: "24-32px",
    sections: "48-96px",
    majorBreaks: "96-128px"
  }
};

export function getComponentGuidance(componentType: string): string {
  const atoms = COMPONENT_ATOMS[componentType];
  if (!atoms) return '';
  
  return JSON.stringify(atoms, null, 2);
}
```

---

### Enhancement 4: Dynamic Quality Validator

Lovable validates output quality before returning. We need a scoring system.

**Add to**: `supabase/functions/ai-copilot/prompts.ts`

```typescript
export const QUALITY_VALIDATION_PROMPT = `
After generating, validate your output against these criteria:

HIERARCHY CHECK (Critical):
□ Only ONE H1 per page/step
□ Headlines are 2-3x body text size
□ Visual weight decreases: H1 → H2 → body → caption
□ One primary CTA per section (highest contrast)

SPACING CHECK:
□ All values divisible by 4 or 8
□ Related items: 8-16px
□ Sections: 48-96px
□ Hero sections: 96-128px vertical padding

ACCESSIBILITY CHECK:
□ Touch targets ≥44px
□ Contrast ratio ≥4.5:1 for text
□ No color-only information
□ All images have alt text intent

COPY CHECK:
□ Headlines <10 words
□ Body lines <75 characters
□ CTAs use action verbs
□ No "Submit", "Click Here", "Learn More"
□ No emojis or special characters

MOBILE CHECK:
□ Single column on <640px
□ Font sizes ≥16px
□ Full-width CTAs
□ Stacked layouts

If ANY check fails, fix before responding.
`;
```

---

### Enhancement 5: Prompt Pattern Templates

Lovable users benefit from reusable prompt patterns. We should provide built-in templates.

**New File**: `supabase/functions/ai-copilot/promptPatterns.ts`

```typescript
export const PROMPT_PATTERNS = {
  // === SECTION PATTERNS ===
  hero_split: `
Create a split hero section:
- Left column (55-60%): eyebrow badge, H1 headline, subheadline (2 lines max), CTA button group
- Right column (40-45%): product image or illustration
- Avatar group below CTA showing "Join X others"
- Background: subtle gradient or pattern
`,
  
  hero_centered: `
Create a centered hero section:
- Centered alignment, max-width 800px
- Eyebrow badge with icon
- H1 headline with gradient accent on key phrase
- Subheadline (single paragraph, max 2 lines)
- Single prominent CTA button
- Trust bar below: logos or stats
- Full viewport height
`,
  
  feature_grid: `
Create a feature section:
- Section header: eyebrow + H2 + optional subtext
- 3-4 column grid on desktop (2 tablet, 1 mobile)
- Each card: icon (32-40px) → title (18px, semibold) → description (14-16px)
- Cards have subtle shadows, lift on hover
- Icons use consistent style (outline or filled)
`,
  
  testimonial_carousel: `
Create a testimonial section:
- Section header: H2 with social proof count
- 3 testimonial cards in horizontal scroll on mobile, grid on desktop
- Each card: large quote (16-18px italic) → 5-star rating → avatar + name + title
- Include specific results/numbers in quotes
- Cards have distinct styling (shadow or border)
`,
  
  pricing_table: `
Create a pricing section:
- Toggle at top: Monthly / Annual (show savings %)
- 3 tiers side by side
- Middle tier highlighted: larger, border accent, "Most Popular" badge
- Each tier: name → price → tagline → feature list (5-8 checkmarks) → CTA
- Feature list alternates checked/unchecked to show tier differences
`,
  
  faq_accordion: `
Create an FAQ section:
- H2 header with "Got questions?" or similar
- 5-8 questions in accordion format
- Questions are clickable, expand to show answer
- Include questions about: pricing, timeline, guarantee, support
- Optional: contact CTA below for unaddressed questions
`,
  
  cta_final: `
Create a final CTA section:
- Full-width background (gradient or contrasting color)
- Centered content, max-width 600px
- H2 repeating main value proposition
- Urgency element: countdown, limited spots, or bonus
- Single large CTA button
- Small guarantee/trust text below button
- Remove all navigation distractions
`
};

export function getPromptPattern(patternName: string): string {
  return PROMPT_PATTERNS[patternName] || '';
}

export function listAvailablePatterns(): string[] {
  return Object.keys(PROMPT_PATTERNS);
}
```

---

## Implementation Plan

### Files to Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `supabase/functions/ai-copilot/aestheticVocabulary.ts` | Buzzword-to-design mappings | ~200 |
| `supabase/functions/ai-copilot/industryKnowledge.ts` | Vertical-specific design rules | ~250 |
| `supabase/functions/ai-copilot/componentAtoms.ts` | Atomic design primitives | ~180 |
| `supabase/functions/ai-copilot/promptPatterns.ts` | Reusable section templates | ~150 |

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/ai-copilot/prompts.ts` | Add quality validation, import new knowledge |
| `supabase/functions/ai-copilot/uiKnowledge.ts` | Add `getRelevantKnowledge` enhancements |
| `src/lib/ai/aiCopilotService.ts` | Add industry and aesthetic context to `PageContext` |

---

## Integration Flow

```text
User Prompt: "Create a hero for my coaching business, premium feel"
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    CONTEXT EXTRACTION                        │
├─────────────────────────────────────────────────────────────┤
│ 1. Detect industry: "coaching" → INDUSTRY_PATTERNS.coaching │
│ 2. Detect aesthetic: "premium" → AESTHETIC_VOCABULARY.premium│
│ 3. Detect section: "hero" → PROMPT_PATTERNS.hero_split      │
│ 4. Get atoms: buttons, avatars, badges                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    PROMPT INJECTION                          │
├─────────────────────────────────────────────────────────────┤
│ Base Prompt +                                                │
│ Industry Guidance (coaching patterns) +                      │
│ Aesthetic Rules (premium tokens) +                           │
│ Section Pattern (hero structure) +                           │
│ Component Atoms (sizing, spacing) +                          │
│ Anti-Patterns (what to avoid) +                              │
│ Quality Checklist (validation)                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    AI GENERATION                             │
├─────────────────────────────────────────────────────────────┤
│ AI generates with full context:                              │
│ - Warm colors (coaching psychology)                          │
│ - Generous spacing (premium aesthetic)                       │
│ - Personal photo focus (coaching pattern)                    │
│ - Transformation testimonials (industry-specific)            │
│ - "Book a call" CTA (coaching-optimized)                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    QUALITY VALIDATION                        │
├─────────────────────────────────────────────────────────────┤
│ Before returning, AI validates:                              │
│ ✓ Single H1                                                  │
│ ✓ Spacing follows 8px grid                                   │
│ ✓ CTA uses action verb                                       │
│ ✓ Touch targets ≥44px                                        │
│ ✓ No anti-patterns present                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Expected Outcomes

### Before Enhancement

```
User: "Create a hero for my coaching business"

AI Output:
- Generic "Welcome to Our Site" headline
- Blue color scheme (SaaS default)
- "Learn More" CTA
- Stock photo of laptop
- No industry-specific patterns
```

### After Enhancement

```
User: "Create a hero for my coaching business, premium feel"

AI Output:
- "Transform Your Business in 90 Days" headline (benefit-focused)
- Warm/premium color palette (gold, dark backgrounds)
- "Book Your Strategy Call" CTA (coaching-specific)
- Personal photo placement (industry pattern)
- Transformation testimonial preview
- Generous spacing (48-96px) per premium aesthetic
- Dark mode with reduced saturation
- Avatar group with "Join 500+ entrepreneurs"
```

---

## Technical Notes

### Context Extraction Logic

Add to `src/lib/ai/aiCopilotService.ts`:

```typescript
interface EnhancedPageContext extends PageContext {
  // New fields for enhanced intelligence
  detectedIndustry?: string;
  detectedAesthetics?: string[];
  requestedPattern?: string;
}

function extractIndustryFromPrompt(prompt: string): string | undefined {
  const industries = ['saas', 'coaching', 'ecommerce', 'agency', 'newsletter', 'event'];
  const keywords = {
    saas: ['software', 'app', 'platform', 'tool', 'saas', 'b2b'],
    coaching: ['coaching', 'coach', 'mentor', 'course', 'training', 'consulting'],
    ecommerce: ['product', 'shop', 'store', 'buy', 'cart', 'ecommerce'],
    agency: ['agency', 'studio', 'services', 'creative', 'design agency'],
    newsletter: ['newsletter', 'subscribe', 'email list', 'content'],
    event: ['event', 'webinar', 'conference', 'workshop', 'summit']
  };
  
  for (const [industry, words] of Object.entries(keywords)) {
    if (words.some(w => prompt.toLowerCase().includes(w))) {
      return industry;
    }
  }
  return undefined;
}

function extractAestheticsFromPrompt(prompt: string): string[] {
  const aesthetics = ['minimal', 'premium', 'bold', 'playful', 'cinematic', 'glassmorphism'];
  return aesthetics.filter(a => prompt.toLowerCase().includes(a));
}
```

### Prompt Assembly

The final system prompt is assembled dynamically:

```typescript
function assembleSystemPrompt(task: string, context: EnhancedPageContext, userPrompt: string): string {
  let prompt = BASE_PROMPT;
  
  // Add core knowledge
  prompt += getRelevantKnowledge(task, context);
  
  // Add industry-specific guidance
  if (context.detectedIndustry) {
    prompt += getIndustryGuidance(context.detectedIndustry);
  }
  
  // Add aesthetic rules
  if (context.detectedAesthetics?.length) {
    prompt += getAestheticRules(context.detectedAesthetics);
  }
  
  // Add pattern template
  if (context.requestedPattern) {
    prompt += getPromptPattern(context.requestedPattern);
  }
  
  // Add anti-patterns
  prompt += getAntiPatternsForTask(task);
  
  // Add quality validation
  prompt += QUALITY_VALIDATION_PROMPT;
  
  return prompt;
}
```

---

## Summary

This enhancement transforms your AI Copilot from a "generic design assistant" into an "industry-aware design expert" that:

1. **Understands aesthetic vocabulary** - "premium," "bold," "minimal" become concrete design tokens
2. **Knows industry patterns** - SaaS vs coaching vs e-commerce generate different designs
3. **Thinks in atoms** - Precise component specifications for consistency
4. **Validates quality** - Self-checks before outputting
5. **Provides templates** - Reusable patterns users can invoke

The result: AI-generated designs that feel professionally crafted for the specific use case, not generic templates.

