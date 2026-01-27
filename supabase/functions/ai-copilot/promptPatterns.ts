/**
 * Prompt Pattern Templates
 * 
 * Reusable section and layout templates that users can invoke.
 * These provide structured guidance for common design patterns.
 */

// ============================================================
// HERO SECTION PATTERNS
// ============================================================
export const HERO_PATTERNS = {
  hero_split: `
CREATE A SPLIT HERO SECTION:
Layout:
- Left column (55-60%): Text content, stacked vertically
- Right column (40-45%): Product image, video, or illustration
- Min-height: 80vh, vertically centered content

Left Column Structure:
1. Eyebrow badge (optional): Small pill badge with icon ("🚀 New Feature" → badge with rocket icon)
2. H1 Headline: Large, benefit-focused, max 10 words
3. Subheadline: 2 lines max, supports headline, explains value
4. CTA Button Group: Primary + optional secondary button
5. Social proof row: Avatar group with text ("Join 5,000+ marketers")

Right Column:
- Placeholder image or video thumbnail
- Subtle shadow/glow effect for depth
- Slightly overlapping container edge (modern)

Background: Subtle gradient or pattern, not solid white
`,

  hero_centered: `
CREATE A CENTERED HERO SECTION:
Layout:
- Center-aligned content
- Max-width: 800px for text
- Full viewport height (100vh)

Content Stack (top to bottom):
1. Eyebrow badge with icon
2. H1 Headline: Can include gradient-text for accent phrase
3. Subheadline: Single paragraph, 2 lines max, center-aligned
4. Single prominent CTA button (large, high contrast)
5. Trust bar below: Logo row or stats row

Spacing:
- 24px between badge and headline
- 16px between headline and subheadline
- 32px between subheadline and CTA
- 48px between CTA and trust bar
`,

  hero_video: `
CREATE A VIDEO-CENTRIC HERO:
Layout:
- Video thumbnail takes 60-70% of hero area
- Text content above or beside video
- Full-width section, edge-to-edge

Structure:
1. Headline + Subheadline (centered above video)
2. Video thumbnail with play overlay (placeholder)
3. CTA below video
4. Credibility bar (logos or avatars)

Video Thumbnail:
- Large play button overlay
- Gradient overlay on image
- 16:9 aspect ratio
`
};

// ============================================================
// FEATURE SECTION PATTERNS
// ============================================================
export const FEATURE_PATTERNS = {
  feature_grid: `
CREATE A FEATURE GRID SECTION:
Layout:
- Section header: Eyebrow + H2 + optional subtext (centered)
- Grid: 3-4 columns on desktop, 2 on tablet, 1 on mobile

Each Feature Card:
- Icon: 36-48px, solid color or gradient background
- Title: 18-20px, semibold
- Description: 14-16px, 2-3 lines max
- Spacing: 16px icon-to-title, 8px title-to-description

Card Styling:
- Subtle shadows, lift on hover
- Consistent border radius (12-16px)
- Icons use consistent style (all outline OR all filled)

Copy Rule: Benefits > Features
- BAD: "256-bit encryption"
- GOOD: "Your data stays completely private"
`,

  feature_bento: `
CREATE A BENTO GRID FEATURE SECTION:
Layout:
- Asymmetrical grid with varied card sizes
- Mix of 1x1, 2x1 (wide), 1x2 (tall) cards
- Creates visual interest and hierarchy

Card Types:
1. Large Feature Card (2x1): Headline + description + image/icon
2. Medium Card (1x1): Icon + title + short description
3. Stat Card (1x1): Large number + label
4. Image Card (1x2): Full image with overlay text

Highlight primary feature with largest card size
`,

  feature_icons: `
CREATE AN ICON-BASED FEATURE LIST:
Layout:
- Vertical stack of feature items
- Max-width: 600px, centered or left-aligned

Each Item:
- Icon (24px) + Text on same line
- Title bold, description normal weight
- OR: icon-text element with props.icon

Spacing:
- 16-24px between items
- Icon and text: 12-16px apart
`
};

// ============================================================
// TESTIMONIAL PATTERNS
// ============================================================
export const TESTIMONIAL_PATTERNS = {
  testimonial_grid: `
CREATE A TESTIMONIAL GRID SECTION:
Layout:
- Section header: H2 + social proof count ("What 2,500+ customers say")
- Grid: 3 columns desktop, 2 tablet, 1 mobile

Each Testimonial Card:
1. Quote text: 16-18px, italicized or larger
2. Star rating (optional): 5 filled stars
3. Avatar: 48-64px
4. Name: 16px, semibold
5. Title/Company: 14px, muted color

Quote Guidelines:
- Include specific results ("47% increase", "saved 10 hours")
- Real-sounding names and companies
- Varied quote lengths for visual interest
`,

  testimonial_featured: `
CREATE A FEATURED TESTIMONIAL SECTION:
Layout:
- Single large testimonial, center-aligned
- Quote marks or quotation icon
- Large avatar (96px)

Structure:
1. Large quotation mark icon (decorative)
2. Quote text: 20-24px, centered
3. Avatar + Name + Title below quote
4. Optional: Company logo

Best for: High-impact social proof from recognizable person
`,

  testimonial_carousel: `
CREATE A TESTIMONIAL CAROUSEL:
Layout:
- Horizontal scroll on mobile
- 3 visible on desktop, navigation arrows
- Dot indicators below

Each Card:
- Full testimonial card (quote, avatar, name, title)
- Equal height cards
- Smooth transition between slides
`
};

// ============================================================
// PRICING PATTERNS
// ============================================================
export const PRICING_PATTERNS = {
  pricing_table: `
CREATE A PRICING TABLE SECTION:
Layout:
- Toggle at top: Monthly / Annual (show savings %)
- 3 tiers side by side
- Middle tier highlighted

Header Section:
- H2: "Simple, transparent pricing"
- Subtext: "No hidden fees. Cancel anytime."

Each Tier Card:
1. Tier name: "Starter", "Professional", "Enterprise"
2. Price: Large number + period (/month)
3. Tagline: One line describing tier
4. Feature list: 5-8 items with check icons
5. CTA button

Middle Tier Highlighting:
- "Most Popular" badge
- Larger scale (1.05)
- Border accent color
- Primary button (others secondary)

Feature List Tips:
- Alternate checked/x to show differences
- Most important features first
- "Everything in [previous tier], plus..."
`,

  pricing_simple: `
CREATE A SIMPLE PRICING SECTION:
Layout:
- Single offer, centered
- Large price display
- Feature list + CTA

Structure:
1. H2: "One simple price"
2. Price: Very large (48-64px)
3. What's included list
4. CTA button
5. Guarantee badge below

Best for: Single product, no tiers
`,

  pricing_comparison: `
CREATE A PRICING COMPARISON TABLE:
Layout:
- Full-width table
- Features in rows, plans in columns
- Sticky header with plan names and prices

Columns:
- Feature name (left, sticky)
- Each plan tier (with price in header)

Cells:
- Check for included
- X for not included
- Text for limits ("5 users", "Unlimited")
`
};

// ============================================================
// FAQ PATTERNS
// ============================================================
export const FAQ_PATTERNS = {
  faq_accordion: `
CREATE AN FAQ ACCORDION SECTION:
Layout:
- H2: "Frequently Asked Questions" or "Got questions?"
- Accordion items, 5-8 questions

Each Item:
- Question (clickable, expands)
- Answer (hidden until clicked)
- Plus/minus or chevron icon

Questions to Include:
- Pricing/cost question
- How it works / getting started
- Guarantee / refund policy
- Support / help options
- Time commitment / results timeline
- Technical requirements (if applicable)

Optional: Contact CTA below for unaddressed questions
`,

  faq_two_column: `
CREATE A TWO-COLUMN FAQ:
Layout:
- Left column: First half of questions
- Right column: Second half
- Section header above

Each Q&A:
- Question: Bold, larger text
- Answer: Regular text below
- 24-32px spacing between items
`
};

// ============================================================
// CTA PATTERNS
// ============================================================
export const CTA_PATTERNS = {
  cta_final: `
CREATE A FINAL CTA SECTION:
Layout:
- Full-width background (gradient or contrasting color)
- Centered content, max-width 600px
- Remove all navigation distractions

Structure:
1. H2: Repeat main value proposition
2. Urgency element: Countdown, "Limited spots", bonus
3. Single large CTA button
4. Small guarantee/trust text below button

Design:
- High contrast from previous sections
- Dark background for light sites (or vice versa)
- Single focus on the button
`,

  cta_banner: `
CREATE A CTA BANNER:
Layout:
- Horizontal bar, full-width
- Content centered, single line

Structure:
- Icon or emoji + Text + Button (all inline)
- Example: "🎉 New: We just launched X — Check it out →"

Use for: Announcements, promotions, sticky headers
`,

  cta_split: `
CREATE A SPLIT CTA SECTION:
Layout:
- Left: Text content (60%)
- Right: Image or illustration (40%)

Left Content:
1. H2 headline
2. 2-3 bullet points of benefits
3. CTA button

Right: Supporting image/illustration
`
};

// ============================================================
// TRUST & SOCIAL PROOF PATTERNS
// ============================================================
export const TRUST_PATTERNS = {
  logo_bar: `
CREATE A LOGO BAR SECTION:
Layout:
- Single row of logos, evenly spaced
- "As seen in" or "Trusted by" text above (optional)

Logos:
- 5-7 logos maximum
- Grayscale or muted color
- Consistent height (32-48px)
- Responsive: horizontal scroll on mobile
`,

  stats_row: `
CREATE A STATS ROW SECTION:
Layout:
- 3-4 large stat numbers in a row
- Can be standalone or within hero

Each Stat:
- Large number: 36-48px (e.g., "9,943+")
- Label below: 12-14px, uppercase, muted

Examples:
- "50K+" / "HAPPY CUSTOMERS"
- "5B+" / "VIEWS GENERATED"
- "99.9%" / "UPTIME"
`,

  guarantee: `
CREATE A GUARANTEE SECTION:
Layout:
- Centered content, max-width 600px
- Badge or icon (shield, checkmark)

Structure:
1. Badge icon (shield or guarantee seal)
2. H3: "30-Day Money-Back Guarantee"
3. Description: What's covered, how it works
4. Optional: Contact info for claims

Tone: Reassuring, removes risk, builds confidence
`
};

// ============================================================
// MAIN EXPORT & HELPERS
// ============================================================
export const PROMPT_PATTERNS: Record<string, string> = {
  ...HERO_PATTERNS,
  ...FEATURE_PATTERNS,
  ...TESTIMONIAL_PATTERNS,
  ...PRICING_PATTERNS,
  ...FAQ_PATTERNS,
  ...CTA_PATTERNS,
  ...TRUST_PATTERNS
};

/**
 * Returns a specific prompt pattern by name
 */
export function getPromptPattern(patternName: string): string {
  return PROMPT_PATTERNS[patternName] || '';
}

/**
 * Lists all available pattern names
 */
export function listAvailablePatterns(): string[] {
  return Object.keys(PROMPT_PATTERNS);
}

/**
 * Detects pattern from user prompt and returns matching template
 */
export function detectPatternFromPrompt(prompt: string): string | null {
  const lowerPrompt = prompt.toLowerCase();
  
  // Hero patterns
  if (lowerPrompt.includes('hero') && lowerPrompt.includes('split')) return 'hero_split';
  if (lowerPrompt.includes('hero') && lowerPrompt.includes('center')) return 'hero_centered';
  if (lowerPrompt.includes('hero') && lowerPrompt.includes('video')) return 'hero_video';
  
  // Feature patterns
  if (lowerPrompt.includes('feature') && lowerPrompt.includes('grid')) return 'feature_grid';
  if (lowerPrompt.includes('bento')) return 'feature_bento';
  if (lowerPrompt.includes('feature') && lowerPrompt.includes('icon')) return 'feature_icons';
  
  // Testimonial patterns
  if (lowerPrompt.includes('testimonial') && lowerPrompt.includes('grid')) return 'testimonial_grid';
  if (lowerPrompt.includes('testimonial') && lowerPrompt.includes('featured')) return 'testimonial_featured';
  if (lowerPrompt.includes('testimonial') && lowerPrompt.includes('carousel')) return 'testimonial_carousel';
  
  // Pricing patterns
  if (lowerPrompt.includes('pricing') && lowerPrompt.includes('table')) return 'pricing_table';
  if (lowerPrompt.includes('pricing') && lowerPrompt.includes('simple')) return 'pricing_simple';
  if (lowerPrompt.includes('pricing') && lowerPrompt.includes('comparison')) return 'pricing_comparison';
  
  // FAQ patterns
  if (lowerPrompt.includes('faq') && lowerPrompt.includes('accordion')) return 'faq_accordion';
  if (lowerPrompt.includes('faq') && lowerPrompt.includes('column')) return 'faq_two_column';
  if (lowerPrompt.includes('faq')) return 'faq_accordion'; // default FAQ
  
  // CTA patterns
  if (lowerPrompt.includes('cta') && lowerPrompt.includes('final')) return 'cta_final';
  if (lowerPrompt.includes('cta') && lowerPrompt.includes('banner')) return 'cta_banner';
  if (lowerPrompt.includes('cta') && lowerPrompt.includes('split')) return 'cta_split';
  
  // Trust patterns
  if (lowerPrompt.includes('logo') && lowerPrompt.includes('bar')) return 'logo_bar';
  if (lowerPrompt.includes('stats') || lowerPrompt.includes('numbers')) return 'stats_row';
  if (lowerPrompt.includes('guarantee')) return 'guarantee';
  
  return null;
}

/**
 * Returns pattern guidance for the AI if a pattern is detected
 */
export function getPatternGuidanceForPrompt(userPrompt: string): string {
  const patternName = detectPatternFromPrompt(userPrompt);
  if (!patternName) return '';
  
  const pattern = PROMPT_PATTERNS[patternName];
  return `
=== DETECTED PATTERN: ${patternName.toUpperCase().replace('_', ' ')} ===
${pattern}
`;
}
