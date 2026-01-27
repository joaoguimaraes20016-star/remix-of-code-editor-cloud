/**
 * Design Examples Bank
 * 
 * High-quality reference implementations for the AI to learn from.
 * These are structural templates, not actual generated content.
 */

// ============================================================
// HERO SECTION PATTERNS
// ============================================================
export const HERO_PATTERNS = [
  {
    name: "Split Hero",
    description: "Text on left (60%), visual on right (40%)",
    structure: `
      [Left Column - 60%]
        - Badge/eyebrow text
        - H1 headline (benefit-focused)
        - Subheadline (pain → solution)
        - CTA button group (primary + secondary)
        - Trust indicators (avatars + "Join X others")
      [Right Column - 40%]
        - Hero image OR video thumbnail
        - Optional floating elements (testimonial card, stats)
    `,
    bestFor: ["SaaS", "B2B services", "Professional products"],
    layoutClass: "grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12",
  },
  {
    name: "Center-Stack Hero",
    description: "Everything centered, stacked vertically",
    structure: `
      [Full Width, Centered]
        - Logo bar (optional, for events)
        - Badge with icon
        - H1 headline (with gradient accent word)
        - Subheadline (max 2 lines)
        - CTA button (single, prominent)
        - Stats row OR avatar group below CTA
    `,
    bestFor: ["Events", "Product launches", "Webinars", "App landing"],
    layoutClass: "text-center max-w-3xl mx-auto",
  },
  {
    name: "Video-First Hero",
    description: "Large video embed with supporting text",
    structure: `
      [Centered]
        - Badge/urgency indicator
        - H1 headline (short, punchy)
        - Video embed (16:9, 70-80% width)
        - CTA below video
        - Trust bar below CTA
    `,
    bestFor: ["VSL funnels", "Course sales", "Training programs"],
    layoutClass: "text-center max-w-4xl mx-auto",
  },
  {
    name: "Immersive Hero",
    description: "Full-screen background with overlay content",
    structure: `
      [Full Viewport]
        - Background: image/video with dark overlay (50-70% opacity)
        - Content overlay (centered):
          - H1 in white/light
          - Subheadline
          - CTA (high contrast)
        - Scroll indicator at bottom
    `,
    bestFor: ["Luxury brands", "Real estate", "Events", "Photography"],
    layoutClass: "min-h-screen flex items-center justify-center",
  },
];

// ============================================================
// SOCIAL PROOF PATTERNS
// ============================================================
export const SOCIAL_PROOF_PATTERNS = [
  {
    name: "Logo Bar",
    structure: `
      [Horizontal Row]
        - "As seen in" or "Trusted by" label
        - 4-6 company logos (grayscale on light, white on dark)
        - Optional: marquee scroll for more logos
    `,
    placement: "After hero, before features",
  },
  {
    name: "Stats Row",
    structure: `
      [3-4 Column Grid]
        - Each stat: Large number + suffix + label
        - Numbers should be specific (9,847 not 10,000)
        - Include relevant metrics: customers, revenue, growth
    `,
    placement: "Within hero or immediately after",
  },
  {
    name: "Testimonial Grid",
    structure: `
      [3-Column Grid on Desktop]
        - Each card: Quote + Photo + Name + Title + Company
        - Highlight specific results in quotes
        - Optional: star rating
    `,
    placement: "After features, before pricing",
  },
  {
    name: "Featured Testimonial",
    structure: `
      [Full Width Card]
        - Large quote (2-3 sentences with specific results)
        - Large photo (circular or rounded)
        - Name, Title, Company
        - Optional: Before/After metrics
    `,
    placement: "Between major sections for pacing",
  },
];

// ============================================================
// FEATURE SECTION PATTERNS
// ============================================================
export const FEATURE_PATTERNS = [
  {
    name: "Icon Grid",
    structure: `
      [Section Header]
        - Eyebrow text
        - H2 headline
        - Subheadline
      [3-4 Column Grid]
        - Each item: Icon + Title + Description
        - Icons should be consistent style
        - Descriptions: 1-2 sentences, benefit-focused
    `,
    bestFor: ["SaaS features", "Service offerings", "Product benefits"],
  },
  {
    name: "Alternating Rows",
    structure: `
      [Repeating Sections]
        Row 1: Image Left, Text Right
        Row 2: Text Left, Image Right
        Row 3: Image Left, Text Right
        
        Each row: Headline + 2-3 bullet points + optional CTA
    `,
    bestFor: ["Detailed feature explanations", "How it works"],
  },
  {
    name: "Bento Grid",
    structure: `
      [Asymmetrical Grid]
        - 1 large card (2x2)
        - 2-3 medium cards (1x2 or 2x1)
        - 2-4 small cards (1x1)
        
        Each card: Icon/visual + Title + Short description
    `,
    bestFor: ["Modern SaaS", "Creative portfolios", "Feature showcases"],
  },
  {
    name: "Process Steps",
    structure: `
      [Horizontal or Vertical Flow]
        Step 1 → Step 2 → Step 3 (max 4)
        
        Each step: Number + Title + Description + Icon
        Connected by arrows or lines
    `,
    bestFor: ["How it works", "Getting started", "Methodology"],
  },
];

// ============================================================
// PRICING PATTERNS
// ============================================================
export const PRICING_PATTERNS = [
  {
    name: "Three-Tier Standard",
    structure: `
      [3-Column Grid]
        Tier 1: Basic (cheapest)
        Tier 2: Pro (highlighted, "Most Popular")
        Tier 3: Enterprise (highest)
        
        Each tier:
          - Tier name
          - Price + billing period
          - Short description
          - Feature list (5-8 items)
          - CTA button
          
        Middle tier: Larger, border/shadow, badge
    `,
    psychology: "Anchor on expensive, highlight middle value",
  },
  {
    name: "Toggle Pricing",
    structure: `
      [Toggle at Top]
        Monthly / Annual (show savings)
        
      [Pricing Cards Below]
        Same as three-tier, with dynamic pricing
    `,
    psychology: "Show savings to encourage annual commitment",
  },
  {
    name: "Comparison Table",
    structure: `
      [Full-Width Table]
        Header: Feature | Basic | Pro | Enterprise
        Rows: Each feature with checkmarks or values
        
        Sticky header on scroll
        Highlighted column for recommended tier
    `,
    psychology: "Detailed comparison for considered purchases",
  },
];

// ============================================================
// CTA SECTION PATTERNS
// ============================================================
export const CTA_PATTERNS = [
  {
    name: "Simple CTA Band",
    structure: `
      [Full-Width Background]
        - H2 headline (repeat value prop)
        - Subheadline (urgency or guarantee)
        - Single CTA button (large, high contrast)
    `,
    placement: "End of page, after all content",
  },
  {
    name: "CTA with Form",
    structure: `
      [Split Layout]
        Left: Headline + bullet benefits + guarantee
        Right: Simple form (2-4 fields) + submit button
    `,
    placement: "Lead capture sections, opt-in pages",
  },
  {
    name: "Urgency CTA",
    structure: `
      [Centered, Prominent]
        - Countdown timer (if real deadline)
        - Scarcity message ("Only X spots left")
        - Headline reminding of benefit
        - CTA button
        - Guarantee/risk reversal below
    `,
    placement: "High-ticket offers, limited-time promotions",
  },
];

// ============================================================
// FAQ PATTERNS
// ============================================================
export const FAQ_PATTERNS = [
  {
    name: "Accordion FAQ",
    structure: `
      [Section Header]
        - "Frequently Asked Questions"
        
      [Accordion List]
        - 5-8 questions
        - Click to expand answer
        - Plus/minus or arrow icons
        
      Questions to include:
        - Pricing/cost
        - Timeline/delivery
        - Guarantee/refund
        - Support/help
        - Getting started
    `,
    placement: "Before final CTA, after pricing",
  },
  {
    name: "Two-Column FAQ",
    structure: `
      [2-Column Grid]
        - All questions visible (no accordion)
        - Short, direct answers
        - Good for 6-8 questions
    `,
    placement: "Simple products with common questions",
  },
];

// ============================================================
// FUNNEL FLOW TEMPLATES
// ============================================================
export const FUNNEL_TEMPLATES = {
  vsl: {
    name: "VSL Funnel",
    steps: [
      {
        name: "Watch Video",
        sections: [
          "Credibility bar (avatars + stats)",
          "Headline with gradient accent",
          "Video embed (center)",
          "CTA below video",
          "Trust indicators",
        ],
      },
      {
        name: "Get Access",
        sections: [
          "Summary of offer",
          "Form (name, email)",
          "Guarantee",
          "Testimonial",
        ],
      },
    ],
  },
  webinar: {
    name: "Webinar Registration",
    steps: [
      {
        name: "Register",
        sections: [
          "Ticker bar (date/time)",
          "Hero with event details",
          "Host bio",
          "What you'll learn",
          "Registration form",
          "Social proof",
        ],
      },
      {
        name: "Confirmation",
        sections: [
          "Thank you message",
          "Add to calendar buttons",
          "What to expect",
          "Share with friends",
        ],
      },
    ],
  },
  optin: {
    name: "Lead Magnet Opt-in",
    steps: [
      {
        name: "Get Your Free [X]",
        sections: [
          "Headline (value prop)",
          "What's included (3-5 bullets)",
          "Lead magnet preview image",
          "Simple form (email only)",
          "Trust badges",
        ],
      },
      {
        name: "Thank You",
        sections: [
          "Confirmation",
          "Download/access instructions",
          "Next steps",
          "Bonus offer (optional)",
        ],
      },
    ],
  },
  sales: {
    name: "Sales Page",
    steps: [
      {
        name: "Sales Page",
        sections: [
          "Hero (headline + CTA)",
          "Trust bar",
          "Problem agitation",
          "Solution introduction",
          "Features/benefits",
          "Social proof",
          "Pricing",
          "FAQ",
          "Final CTA",
          "Guarantee",
        ],
      },
    ],
  },
};

// ============================================================
// EXPORT UTILITIES
// ============================================================

/**
 * Get example patterns for a specific section type
 */
export function getExamplesForSection(sectionType: string): object | undefined {
  switch (sectionType.toLowerCase()) {
    case 'hero':
      return HERO_PATTERNS;
    case 'testimonial':
    case 'social-proof':
      return SOCIAL_PROOF_PATTERNS;
    case 'feature':
    case 'features':
      return FEATURE_PATTERNS;
    case 'pricing':
      return PRICING_PATTERNS;
    case 'cta':
      return CTA_PATTERNS;
    case 'faq':
      return FAQ_PATTERNS;
    default:
      return undefined;
  }
}

/**
 * Get funnel template for a specific type
 */
export function getFunnelTemplate(funnelType: string): object | undefined {
  return FUNNEL_TEMPLATES[funnelType as keyof typeof FUNNEL_TEMPLATES];
}

/**
 * Format examples as context string for injection
 */
export function formatExamplesAsContext(examples: object[]): string {
  return examples.map((ex: any, i) => `
Pattern ${i + 1}: ${ex.name}
${ex.description || ''}
Structure:
${ex.structure}
Best for: ${ex.bestFor?.join(', ') || 'General use'}
`).join('\n---\n');
}
