/**
 * UI/UX Knowledge Base
 * 
 * Comprehensive design knowledge for the AI Copilot to generate
 * world-class, high-converting UI layouts.
 */

// ============================================================
// VISUAL HIERARCHY
// ============================================================
export const VISUAL_HIERARCHY = `
=== VISUAL HIERARCHY PRINCIPLES ===

Priority signals (in order of impact):
1. SIZE: Larger elements demand attention first
2. WEIGHT: Bolder text signals importance
3. COLOR: High contrast elements pop forward
4. POSITION: Top-left receives first eye contact (F-pattern)
5. WHITESPACE: Isolated elements feel more important
6. DEPTH: Shadows and layers elevate importance

Reading patterns:
- F-PATTERN: For text-heavy pages. Users scan top horizontal, then down left side
- Z-PATTERN: For minimal pages. Eye moves: top-left → top-right → bottom-left → bottom-right
- GUTENBERG: Terminal area (bottom-right) is prime CTA placement

Application rules:
- One focal point per section (usually the headline or CTA)
- Headlines should be 2-3x the size of body text
- CTAs must be the highest-contrast element in their section
- Use visual weight to guide the eye: headline → supporting text → CTA
`;

// ============================================================
// TYPOGRAPHY SCALE
// ============================================================
export const TYPOGRAPHY_SCALE = `
=== TYPOGRAPHY SYSTEM (1.25 RATIO) ===

Size scale (mobile → desktop):
- DISPLAY: 36-72px, 800 weight, for hero headlines only
- H1: 28-48px, 700 weight, page titles
- H2: 24-36px, 600 weight, section headers
- H3: 20-28px, 600 weight, subsection headers
- H4: 18-24px, 500 weight, card titles
- BODY: 16-18px, 400 weight, paragraphs
- SMALL: 14px, 400 weight, secondary text
- CAPTION: 12px, 500 weight, metadata, badges

Line height rules:
- Headlines: 1.1-1.3 (tighter)
- Body text: 1.5-1.7 (looser for readability)
- Buttons: 1.2 (snug)

Max line width:
- Body text: 65-75 characters (optimal reading)
- Headlines: No limit, but break at natural phrases

Font pairing principles:
- Contrast serif with sans-serif
- Use max 2 font families (heading + body)
- Display fonts for headlines only, never body
`;

// ============================================================
// SPACING SYSTEM
// ============================================================
export const SPACING_SYSTEM = `
=== SPACING SYSTEM (8px GRID) ===

Token scale:
- 4px (xs): Icon padding, tight inline spacing
- 8px (sm): Related element groups
- 12px: Button internal padding (vertical)
- 16px (md): Default component gaps
- 24px (lg): Subsection spacing
- 32px (xl): Section internal padding
- 48px (2xl): Major section breaks
- 64px (3xl): Section padding (mobile)
- 96px (4xl): Section padding (desktop)
- 128px+: Hero section padding

Proximity principle:
- Related items: 8-16px apart
- Grouped sections: 24-32px apart
- Unrelated sections: 48-96px apart

Content density rules:
- Headlines need breathing room (24-32px below)
- CTAs need isolation (32-48px vertical margin)
- Body text groups: 16-24px between paragraphs
- Form fields: 16-24px vertical gap
`;

// ============================================================
// COLOR PSYCHOLOGY
// ============================================================
export const COLOR_PSYCHOLOGY = `
=== COLOR PSYCHOLOGY & USAGE ===

Color meanings:
- BLUE: Trust, security, professionalism → Finance, SaaS, B2B
- GREEN: Growth, health, success, confirmation → Health, eco, finance
- RED: Urgency, passion, energy, warnings → Sales, food, entertainment
- ORANGE: Friendly, confident, action → CTAs, creative industries
- PURPLE: Luxury, creativity, wisdom → Premium products, education
- YELLOW: Optimism, attention, caution → Highlights, warnings
- BLACK: Luxury, power, sophistication → High-end, fashion
- WHITE: Clean, minimal, space → Tech, healthcare

The 60-30-10 rule:
- 60%: Dominant color (background, large areas)
- 30%: Secondary color (cards, sections)
- 10%: Accent color (CTAs, highlights, icons)

Contrast requirements (WCAG AA):
- Normal text: 4.5:1 minimum contrast ratio
- Large text (24px+): 3:1 minimum
- Interactive elements: 3:1 against adjacent colors

Dark mode adjustments:
- Reduce saturation by 10-20%
- Never use pure black (#000) → use #0a0a0a or #111
- Increase shadow opacity
- Soften whites to #f5f5f5 or #e5e5e5
`;

// ============================================================
// BUTTON DESIGN
// ============================================================
export const BUTTON_RULES = `
=== BUTTON DESIGN RULES ===

Button hierarchy:
- PRIMARY: High contrast, solid fill, main action
- SECONDARY: Outline or muted fill, alternative action
- GHOST/TERTIARY: Text-only, minimal actions

Sizing requirements:
- Touch target: Minimum 44x44px (mobile), 48x48px ideal
- Padding ratio: Horizontal = 2-3x vertical
- Desktop: 12-16px vertical, 24-48px horizontal
- Mobile: 14-18px vertical, 24-40px horizontal

Border radius guide:
- 4-8px: Professional, corporate
- 12-16px: Friendly, approachable
- 999px (pill): Modern, playful

CTA copy patterns:
✓ DO: Action verb + benefit
  "Get Your Free Audit"
  "Start Saving Today"
  "Unlock Premium Access"
  "Join 10,000+ Marketers"

✗ DON'T:
  "Submit"
  "Click Here"
  "Learn More" (too vague)
  "Send"

State styling:
- Hover: Darken 8-12% OR lift with shadow
- Active/Pressed: Darken 12-15% AND scale 98%
- Disabled: 50% opacity, cursor: not-allowed
- Loading: Show spinner, disable interaction
`;

// ============================================================
// FORM PATTERNS
// ============================================================
export const FORM_PATTERNS = `
=== FORM UX PATTERNS ===

Label rules:
- Always visible, positioned ABOVE the field
- Never rely on placeholder as the only label
- Use sentence case, not ALL CAPS
- Include required indicator if applicable

Field design:
- Width should match expected input length
- Email: 280-320px
- Phone: 200-240px
- Name: 200-280px
- Full address: 100% width

Error handling:
- Red border (#EF4444 or similar)
- Error icon inside or beside field
- Error message below field, 14px, red
- Don't rely on color alone (add icon)

Success states:
- Green check icon on valid input
- Subtle green border (optional)

Layout:
- Single column on mobile (always)
- 2 columns max on desktop for related fields
- Group related fields (name + email, address fields)
- Progress indicator for multi-step forms

Friction reduction:
- Ask only what you absolutely need
- Provide smart defaults
- Use proper input types (email, tel, number)
- Enable autofill with correct autocomplete attributes
`;

// ============================================================
// CONVERSION PSYCHOLOGY
// ============================================================
export const CONVERSION_PSYCHOLOGY = `
=== CONVERSION PSYCHOLOGY (CIALDINI + UX) ===

The 6 Principles of Persuasion:

1. RECIPROCITY: Give value first
   → Free guides, tools, templates before asking
   → "Get your free X" before "Buy now"

2. SCARCITY: Limited availability creates urgency
   → "Only 5 spots left"
   → "Offer ends in 24 hours"
   → Countdown timers

3. AUTHORITY: Expert positioning builds trust
   → Credentials, certifications, media logos
   → "Featured in Forbes, TechCrunch..."
   → Years of experience, client count

4. CONSISTENCY: Small commits lead to big ones
   → Quiz → Results → Offer (commitment ladder)
   → Free trial → Paid plan
   → Newsletter → Webinar → Call

5. LIKING: People buy from those they like
   → Relatable founder stories
   → Casual, friendly tone
   → Photos of real people

6. SOCIAL PROOF: Others' actions guide decisions
   → Testimonials with photos and results
   → "Join 50,000+ subscribers"
   → Real-time notifications ("John just bought...")

Cognitive load rules:
- HICK'S LAW: Fewer choices = faster decisions
  → One primary CTA per section
  → Max 3-4 pricing tiers

- FITT'S LAW: Bigger + closer = easier to click
  → CTAs should be prominent size
  → Keep CTAs in thumb zone on mobile

- MILLER'S LAW: 7±2 items in working memory
  → Max 5-7 feature bullets
  → Max 6 navigation items
`;

// ============================================================
// SECTION ARCHETYPES
// ============================================================
export const SECTION_ARCHETYPES = `
=== SECTION DESIGN PATTERNS ===

HERO SECTION:
- Purpose: Capture attention, communicate value
- Structure: Badge → Headline → Subheadline → CTA(s) → Social proof
- Height: 80-100vh for impact, 60vh minimum
- Rules: ONE clear CTA, benefit-focused headline

CREDIBILITY/TRUST BAR:
- Purpose: Build trust before the ask
- Elements: Logo row, "As seen in", avatar groups
- Placement: After hero, before main content
- Keep it scannable, not readable

FEATURES/BENEFITS:
- Layout: 3-4 column grid (desktop), stacked (mobile)
- Structure: Icon + Title + Description
- Copy rule: Benefits > Features
  Bad: "256-bit encryption"
  Good: "Your data stays safe"

TESTIMONIALS:
- Essential elements: Photo, Quote, Name, Title, Company
- Specificity wins: Include measurable results
  Bad: "Great product!"
  Good: "Increased revenue 47% in 3 months"
- Use real photos, not stock

PRICING:
- Standard: 3 tiers (Good-Better-Best)
- Highlight recommended tier visually
- Anchor effect: Show higher tier first
- Include "Most Popular" badge on middle tier
- Show savings for annual billing

FAQ:
- Use accordion for space efficiency
- Anticipate and overcome objections
- Include question about pricing, guarantees, support
- 5-8 questions is optimal

FINAL CTA:
- Repeat the main offer
- Add urgency element
- Include guarantee/risk reversal
- Remove all distractions
- One button, maximum contrast
`;

// ============================================================
// ACCESSIBILITY
// ============================================================
export const ACCESSIBILITY = `
=== ACCESSIBILITY GUIDELINES (WCAG 2.1 AA) ===

Color contrast:
- Text: 4.5:1 minimum (3:1 for large text 24px+)
- Interactive elements: 3:1 against adjacent colors
- Never use color alone to convey meaning

Focus states:
- Visible focus ring on all interactive elements
- 2px minimum outline, high contrast
- Don't remove outline; style it better

Touch targets:
- Minimum: 44x44px
- Ideal: 48x48px
- Spacing between targets: 8px minimum

Text:
- Minimum body size: 16px
- Line height: 1.5 for paragraphs
- Max width: 80 characters
- Left-align body text (not center or justify)

Images:
- Alt text for informational images
- Empty alt="" for decorative images
- Describe content, not appearance

Interactive elements:
- Buttons look like buttons
- Links look like links (underlined or distinct color)
- Clear hover/active states
- Keyboard navigable
`;

// ============================================================
// RESPONSIVE DESIGN
// ============================================================
export const RESPONSIVE_DESIGN = `
=== RESPONSIVE DESIGN RULES ===

Mobile-first breakpoints:
- Base: 320px-639px (mobile)
- sm: 640px+ (large mobile)
- md: 768px+ (tablet)
- lg: 1024px+ (desktop)
- xl: 1280px+ (large desktop)

Mobile priorities:
- Touch targets: 44px minimum
- Font size: 16px base (prevents zoom on iOS)
- Stack elements vertically
- Full-width CTAs
- Thumb-zone friendly navigation

Scaling patterns:
- Headlines: ~60% of desktop size on mobile
- Body: Same or slightly smaller
- Spacing: ~60-70% of desktop values
- Images: Maintain aspect ratio, fill width

Navigation:
- Desktop: Horizontal menu, all items visible
- Mobile: Hamburger menu (three lines)
- Sticky headers: Slim on scroll, hide on down-scroll

Grid adaptation:
- 4 columns (desktop) → 2 columns (tablet) → 1 column (mobile)
- Card grids stack gracefully
- Never horizontal scroll on mobile
`;

// ============================================================
// MICRO-INTERACTIONS
// ============================================================
export const MICRO_INTERACTIONS = `
=== MICRO-INTERACTIONS & MOTION ===

Timing principles:
- Instant feedback: 0-100ms (button clicks)
- Quick animations: 150-300ms (hovers, toggles)
- Complex transitions: 300-500ms (modals, pages)
- Never exceed 700ms for UI animations

Easing:
- ease-out: For elements entering
- ease-in: For elements leaving
- ease-in-out: For position changes
- spring: For playful, bouncy UI

Hover effects (priority order):
1. Background color shift (simple, performant)
2. Subtle lift with shadow
3. Scale (1.02-1.05x)
4. Underline/border reveal
5. Icon animation

Button states:
- Hover: Transform or color in 150ms
- Active: Immediate scale down (0.98)
- Loading: Spinner, disable, maintain width

Scroll-triggered:
- Fade up: elements appear as they scroll in
- Stagger: children animate sequentially (50-100ms delay)
- Parallax: background moves slower than foreground

Reduce motion:
- Respect prefers-reduced-motion
- Provide fallback static states
`;

// ============================================================
// MODERN DESIGN TRENDS
// ============================================================
export const MODERN_TRENDS = `
=== MODERN DESIGN TRENDS (2024-2025) ===

Glassmorphism:
- Semi-transparent backgrounds (rgba white/black 5-15%)
- Strong backdrop blur (12-24px)
- Subtle border (1px white/10 or white/20)
- Works best on gradient or image backgrounds

Gradient usage:
- Linear gradients for backgrounds (subtle)
- Gradient text for headlines (accent)
- Gradient overlays on images
- Gradient borders (rare, for emphasis)

Shadows & depth:
- Layered shadows for realism:
  - sm: 0 1px 2px rgba(0,0,0,0.05)
  - md: 0 4px 6px rgba(0,0,0,0.1)
  - lg: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)
- Color-tinted shadows (using primary color at 20% opacity)

Bento grid layouts:
- Asymmetrical grids with varied card sizes
- Mix of 1x1, 2x1, 1x2 cards
- Creates visual interest and hierarchy

Neomorphism (use sparingly):
- Soft shadows both directions (inset and outset)
- Same background color as parent
- Light mode only (doesn't work dark)

Typography trends:
- Variable fonts for weight animation
- Extra-bold headlines (800-900 weight)
- Sentence case over Title Case
- Accent colored words in headlines
`;

// ============================================================
// MAIN EXPORT
// ============================================================
export const UI_KNOWLEDGE = {
  VISUAL_HIERARCHY,
  TYPOGRAPHY_SCALE,
  SPACING_SYSTEM,
  COLOR_PSYCHOLOGY,
  BUTTON_RULES,
  FORM_PATTERNS,
  CONVERSION_PSYCHOLOGY,
  SECTION_ARCHETYPES,
  ACCESSIBILITY,
  RESPONSIVE_DESIGN,
  MICRO_INTERACTIONS,
  MODERN_TRENDS,
};

// ============================================================
// CONTEXT-AWARE KNOWLEDGE SELECTOR
// ============================================================

interface KnowledgeContext {
  blockType?: string;
  hasForm?: boolean;
  hasCTA?: boolean;
  hasTestimonials?: boolean;
  hasPricing?: boolean;
  funnelType?: string;
}

/**
 * Returns relevant UI knowledge based on the current task and context.
 * This prevents overwhelming the AI with irrelevant information.
 */
export function getRelevantKnowledge(task: string, context?: KnowledgeContext): string {
  const knowledge: string[] = [];
  
  // Always include core fundamentals
  knowledge.push(VISUAL_HIERARCHY);
  knowledge.push(SPACING_SYSTEM);
  knowledge.push(TYPOGRAPHY_SCALE);
  
  // Task-specific knowledge
  if (task === 'generate') {
    // Always relevant for generation
    knowledge.push(BUTTON_RULES);
    knowledge.push(SECTION_ARCHETYPES);
    
    // Context-specific additions
    if (context?.hasForm) {
      knowledge.push(FORM_PATTERNS);
    }
    
    if (context?.blockType === 'hero') {
      knowledge.push(MODERN_TRENDS);
    }
    
    if (context?.hasTestimonials || context?.hasPricing) {
      knowledge.push(CONVERSION_PSYCHOLOGY);
    }
  }
  
  if (task === 'analyze') {
    knowledge.push(CONVERSION_PSYCHOLOGY);
    knowledge.push(ACCESSIBILITY);
  }
  
  if (task === 'rewrite') {
    knowledge.push(BUTTON_RULES); // For CTA copy guidelines
    knowledge.push(CONVERSION_PSYCHOLOGY);
  }
  
  if (task === 'suggest') {
    knowledge.push(SECTION_ARCHETYPES);
    knowledge.push(CONVERSION_PSYCHOLOGY);
  }
  
  return knowledge.join('\n\n');
}
