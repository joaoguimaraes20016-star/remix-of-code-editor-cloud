/**
 * UI Anti-Patterns
 * 
 * Explicit rules for what the AI should NEVER do.
 * These are common mistakes that hurt conversion and usability.
 */

export const UI_ANTI_PATTERNS = `
=== DESIGN ANTI-PATTERNS (NEVER DO THESE) ===

TYPOGRAPHY:
✗ Center-align body text paragraphs (use left-align for readability)
✗ Use font sizes below 14px for readable content
✗ Use more than 2-3 font families
✗ Set line-height below 1.4 for body text
✗ Create text lines longer than 80 characters
✗ Use all-caps for paragraphs (only headlines/labels)
✗ Use justified text (creates uneven spacing)

COLOR & CONTRAST:
✗ Pure black (#000000) on pure white (#FFFFFF) - too harsh
✗ Low contrast text (below 4.5:1 ratio)
✗ Rely on color alone to convey meaning
✗ Use red/green combinations (colorblind users)
✗ Saturated colors on large areas in dark mode

BUTTONS & CTAs:
✗ Buttons smaller than 44x44px on touch devices
✗ Generic labels: "Submit", "Click Here", "Send", "OK"
✗ Multiple primary CTAs in the same section
✗ Outline buttons for primary actions (too weak)
✗ Disabled-looking buttons that are actually clickable

FORMS:
✗ Placeholder text as the only label
✗ Error messages that don't explain how to fix
✗ Horizontal form layouts on mobile
✗ Required fields without indication
✗ Clearing form on error (preserve user input)

LAYOUT:
✗ Content below the fold without scroll indicator
✗ Walls of text without visual breaks
✗ Horizontal scrolling on mobile
✗ Fixed position elements covering content
✗ Modal popups immediately on page load

IMAGES & MEDIA:
✗ Auto-playing video with sound
✗ Large unoptimized images
✗ Missing alt text for informational images
✗ Text baked into images (not selectable, not translatable)
✗ Stock photos that look obviously fake

NAVIGATION:
✗ Hiding primary navigation on desktop
✗ More than 7 main navigation items
✗ Hamburger menu on desktop
✗ No way to go back/home
✗ Navigation that moves unexpectedly

TRUST & CREDIBILITY:
✗ Testimonials without real photos or names
✗ Vague claims without specifics ("Industry leader")
✗ Missing privacy policy/terms links
✗ Fake scarcity/countdown timers that reset
✗ Hidden pricing until checkout

PERFORMANCE & UX:
✗ Carousels as primary content display (low engagement)
✗ Infinite scroll without way to reach footer
✗ Disabling right-click or text selection
✗ Custom scrollbars that break native behavior
✗ Animations that can't be skipped

MOBILE:
✗ Touch targets closer than 8px apart
✗ Full-width tap areas that trigger accidentally
✗ Requiring pinch-to-zoom to read text
✗ Fixed headers taller than 60px
✗ Features that only work with hover
`;

export const COPY_ANTI_PATTERNS = `
=== COPY ANTI-PATTERNS (NEVER WRITE THESE) ===

HEADLINES:
✗ "Welcome to Our Website" (meaningless)
✗ Headlines longer than 12 words
✗ Company name as the headline
✗ Feature-focused instead of benefit-focused
✗ Jargon or internal terminology

CTAs:
✗ "Submit" (what are they submitting?)
✗ "Click Here" (obvious and vague)
✗ "Learn More" (slightly better, but weak)
✗ "Download" (missing the benefit)
✗ Negative framing: "Don't miss out"

BODY COPY:
✗ "We are a leading provider of..." (self-focused)
✗ Passive voice ("The form will be processed")
✗ Walls of text without breaks
✗ Repeating the same point multiple ways
✗ Marketing speak: "synergy", "leverage", "paradigm"

TESTIMONIALS:
✗ "Great product!" (no specifics)
✗ Anonymous quotes ("- Happy Customer")
✗ Obviously fake-sounding praise
✗ No mention of results or transformation
✗ Single-word reviews

URGENCY:
✗ Fake scarcity ("Only 2 left!" that never changes)
✗ Countdown timers that reset
✗ "Limited time" without actual deadline
✗ Fear-based manipulation

SOCIAL PROOF:
✗ Round numbers ("10,000 customers") - use specific: "9,847"
✗ Claims without evidence
✗ Logos of companies that aren't actually clients
✗ Testimonials from competitors' industries
`;

export const STRUCTURAL_ANTI_PATTERNS = `
=== STRUCTURAL ANTI-PATTERNS ===

PAGE STRUCTURE:
✗ No clear visual hierarchy (everything same size/weight)
✗ CTA appearing before value is established
✗ Multiple competing focuses per section
✗ Skipping from awareness to action (no consideration phase)
✗ Footer CTAs stronger than main content CTAs

INFORMATION ARCHITECTURE:
✗ Requiring users to read everything to find what they need
✗ Important info hidden in expandable sections
✗ Multiple paths to the same destination (confusing)
✗ Dead ends without next step
✗ Orphan pages with no navigation

CONVERSION FLOW:
✗ Asking for too much too soon (email before value)
✗ Long forms when short would work
✗ No progress indicators on multi-step flows
✗ Checkout page with full navigation (distracting)
✗ Thank you pages without next action

TRUST BUILDING:
✗ Social proof AFTER the main CTA (should be before)
✗ Testimonials on thank-you page (too late)
✗ Guarantee hidden in fine print
✗ Support contact info hard to find
`;

/**
 * Returns all anti-patterns formatted for injection into prompts
 */
export function getAllAntiPatterns(): string {
  return [
    UI_ANTI_PATTERNS,
    COPY_ANTI_PATTERNS,
    STRUCTURAL_ANTI_PATTERNS,
  ].join('\n\n');
}

/**
 * Returns anti-patterns relevant to a specific task
 */
export function getAntiPatternsForTask(task: string): string {
  switch (task) {
    case 'generate':
      return [UI_ANTI_PATTERNS, STRUCTURAL_ANTI_PATTERNS].join('\n\n');
    case 'rewrite':
      return COPY_ANTI_PATTERNS;
    case 'analyze':
      return getAllAntiPatterns();
    default:
      return UI_ANTI_PATTERNS;
  }
}
