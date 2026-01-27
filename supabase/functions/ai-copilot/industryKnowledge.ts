/**
 * Industry-Specific Knowledge Base
 * 
 * Provides vertical-aware design patterns and recommendations.
 * Different industries require different visual languages, trust signals,
 * and conversion patterns.
 */

export interface IndustryPattern {
  name: string;
  heroStyle: string;
  colorPsychology: string;
  trustSignals: string[];
  ctaPatterns: string[];
  keyElements: string[];
  avoidElements: string[];
  socialProof: string;
  pricingStyle: string;
  toneOfVoice: string;
  typography: string;
  commonSections: string[];
}

export const INDUSTRY_PATTERNS: Record<string, IndustryPattern> = {
  // ============================================================
  // TECHNOLOGY & SOFTWARE
  // ============================================================
  
  saas: {
    name: "SaaS / Software",
    heroStyle: "Split layout - text left (60%), product screenshot right (40%). Clean, functional feel.",
    colorPsychology: "Blue for trust, purple for innovation. Avoid red (signals error in tech).",
    trustSignals: [
      "Logo bar of enterprise clients (AWS, Google, Microsoft-level)",
      "Uptime/performance statistics (99.9% uptime)",
      "Security badges (SOC2, GDPR, ISO)",
      "Integration partner logos",
      "G2/Capterra review badges"
    ],
    ctaPatterns: [
      '"Start free trial"',
      '"Get started free"',
      '"See demo"',
      '"Talk to sales"',
      '"Try for free - no credit card"'
    ],
    keyElements: [
      "Feature grid (3-4 columns)",
      "Pricing table with annual toggle",
      "Integration logos row",
      "Product screenshots/GIFs",
      "Comparison table vs competitors"
    ],
    avoidElements: [
      "Heavy emotional imagery",
      "Long paragraphs of text",
      "Stock photos of people pointing at laptops",
      "Vague benefit statements"
    ],
    socialProof: "Customer logos > individual testimonials. Show recognizable brands.",
    pricingStyle: "3-tier table (Good/Better/Best), annual discount prominent, feature comparison",
    toneOfVoice: "Professional but approachable, focus on outcomes and efficiency",
    typography: "Clean sans-serif (Inter, SF Pro), code fonts for technical sections",
    commonSections: ["Hero", "Logo bar", "Features", "How it works", "Pricing", "FAQ", "CTA"]
  },
  
  // ============================================================
  // COACHING & PERSONAL BRANDS
  // ============================================================
  
  coaching: {
    name: "Coaching / Personal Brand",
    heroStyle: "Center-aligned with personal photo prominent. Face builds trust. Split OK for video-first.",
    colorPsychology: "Warm tones (orange, gold) for approachability OR dark premium (black/gold) for high-ticket.",
    trustSignals: [
      "Media logos (Forbes, Inc, CNN)",
      "Certifications and credentials",
      "Transformation testimonials with before/after",
      "Years of experience / clients served",
      "Author, speaker, podcast badges"
    ],
    ctaPatterns: [
      '"Book your free strategy call"',
      '"Apply to work with me"',
      '"Get the free guide"',
      '"Watch the free training"',
      '"Join the community"'
    ],
    keyElements: [
      "Personal about/story section",
      "Transformation testimonials (with results)",
      "Video content (VSL, training)",
      "Program/offer breakdown",
      "Guarantee section"
    ],
    avoidElements: [
      "Generic stock photos",
      "Tech jargon",
      "Corporate language",
      "Hidden pricing",
      "Complex navigation"
    ],
    socialProof: "Transformation testimonials with specific results. Video testimonials strongest.",
    pricingStyle: "Application-based OR single high-ticket offer. Rarely shows price upfront.",
    toneOfVoice: "Personal, empathetic, authority. First-person 'I' language.",
    typography: "Warm fonts, mix of serif headlines and sans-serif body. Readable, not flashy.",
    commonSections: ["Hero", "About", "Problem/Agitation", "Solution", "Testimonials", "Offer", "FAQ", "Guarantee", "CTA"]
  },
  
  // ============================================================
  // E-COMMERCE & PRODUCTS
  // ============================================================
  
  ecommerce: {
    name: "E-commerce / Product",
    heroStyle: "Product-centric with lifestyle imagery. Hero image should show product in use or aspirational context.",
    colorPsychology: "Matches product/brand colors. Clean white backgrounds for product focus.",
    trustSignals: [
      "Star ratings and review count",
      "Units sold / bestseller badges",
      "Secure payment badges (PayPal, Visa, etc)",
      "Free shipping indicators",
      "Money-back guarantee badges"
    ],
    ctaPatterns: [
      '"Add to cart"',
      '"Buy now"',
      '"Shop now"',
      '"Get yours"',
      '"Claim your [product]"'
    ],
    keyElements: [
      "High-quality product gallery",
      "Size/variant selectors",
      "Urgency indicators (stock, countdown)",
      "Customer reviews section",
      "Cross-sell recommendations"
    ],
    avoidElements: [
      "Long-form sales copy",
      "Multiple CTAs per product card",
      "Slow-loading images",
      "Hidden shipping costs"
    ],
    socialProof: "Star ratings (4.8/5) + review count. User-generated photos valuable.",
    pricingStyle: "Clear price display, strikethrough for sales, 'SALE' badges prominent",
    toneOfVoice: "Benefits-focused, concise, urgency without desperation",
    typography: "Clean and readable, price is always prominent",
    commonSections: ["Hero product", "Features/Benefits", "Reviews", "FAQ", "Related products"]
  },
  
  // ============================================================
  // AGENCIES & SERVICES
  // ============================================================
  
  agency: {
    name: "Agency / Services",
    heroStyle: "Bold statement headline + work showcase. Split layout or full-width dramatic.",
    colorPsychology: "Black/white with single bold accent OR fully creative palette for creative agencies.",
    trustSignals: [
      "Client logos (recognizable brands)",
      "Case study results with metrics",
      "Industry awards and recognition",
      "Team photos (real people)",
      "Years in business"
    ],
    ctaPatterns: [
      '"Start a project"',
      '"Get a quote"',
      '"Let\'s talk"',
      '"See our work"',
      '"Schedule a consultation"'
    ],
    keyElements: [
      "Portfolio/case study grid",
      "Process/how we work section",
      "Team photos and bios",
      "Services breakdown",
      "Client testimonial videos"
    ],
    avoidElements: [
      "Generic service descriptions",
      "Stock imagery",
      "Unclear pricing/process",
      "Self-congratulatory language"
    ],
    socialProof: "Case studies with measurable results > logos > testimonials",
    pricingStyle: "Quote-based / Custom. 'Starting at' ranges acceptable.",
    toneOfVoice: "Confident, creative, results-focused. Showcase expertise without arrogance.",
    typography: "Creative freedom - can be bold and expressive, matches agency style",
    commonSections: ["Hero", "Work/Portfolio", "Services", "Process", "Team", "Testimonials", "Contact"]
  },
  
  // ============================================================
  // NEWSLETTERS & CONTENT
  // ============================================================
  
  newsletter: {
    name: "Newsletter / Content",
    heroStyle: "Minimal - headline + single email capture. Focus all attention on subscribe action.",
    colorPsychology: "Clean, readable. Single accent color for CTAs. White/light backgrounds preferred.",
    trustSignals: [
      "Subscriber count ('Join 50,000+ readers')",
      "Where featured (publications, podcasts)",
      "Sample content preview",
      "Author credentials",
      "Send frequency ('Every Tuesday')"
    ],
    ctaPatterns: [
      '"Subscribe free"',
      '"Get it in your inbox"',
      '"Join [X] readers"',
      '"Start reading"',
      '"Yes, send it to me"'
    ],
    keyElements: [
      "Email input (single field preferred)",
      "Content/issue preview",
      "Benefit bullets (3-5 max)",
      "Social proof (subscriber count)",
      "Author photo/bio"
    ],
    avoidElements: [
      "Too many form fields",
      "Distracting navigation",
      "Multiple competing CTAs",
      "Vague value propositions"
    ],
    socialProof: "Subscriber count is king. Reader testimonials secondary.",
    pricingStyle: "Free OR simple paid tier. Transparent pricing always.",
    toneOfVoice: "Conversational, personal, value-focused. Like a friend recommending.",
    typography: "Highly readable, editorial feel. Content is the product.",
    commonSections: ["Hero with signup", "What you get", "Sample content", "About author", "Testimonials"]
  },
  
  // ============================================================
  // EVENTS & WEBINARS
  // ============================================================
  
  event: {
    name: "Event / Webinar",
    heroStyle: "Date-prominent with countdown timer. Event name large, registration form visible.",
    colorPsychology: "Energetic, urgent. Orange/red accents for urgency. Purple/blue for professional events.",
    trustSignals: [
      "Speaker credentials and photos",
      "Attendee count ('2,500+ registered')",
      "Company logos of past attendees",
      "Past event testimonials",
      "Sponsor logos"
    ],
    ctaPatterns: [
      '"Register now"',
      '"Save your spot"',
      '"Claim your seat"',
      '"Join live"',
      '"Reserve your spot free"'
    ],
    keyElements: [
      "Countdown timer (prominent)",
      "Agenda/schedule breakdown",
      "Speaker bios with credentials",
      "What you'll learn section",
      "Registration form (minimal fields)"
    ],
    avoidElements: [
      "Buried registration form",
      "Unclear date/time/timezone",
      "Too much content before CTA",
      "No speaker credentials"
    ],
    socialProof: "Past attendee testimonials, registration count, sponsor logos",
    pricingStyle: "Free OR early bird discount. Clear what's included.",
    toneOfVoice: "Urgent but not pushy, educational, FOMO-inducing",
    typography: "Bold headlines, clear date/time display, easy scanning",
    commonSections: ["Hero with timer", "Speakers", "Agenda", "What you'll learn", "Register"]
  },
  
  // ============================================================
  // HEALTH & FITNESS
  // ============================================================
  
  health: {
    name: "Health / Fitness",
    heroStyle: "Aspirational imagery (transformations, active lifestyle). Split or full-width image.",
    colorPsychology: "Green for health, blue for trust, orange for energy. Avoid clinical white.",
    trustSignals: [
      "Before/after transformations",
      "Certifications (personal training, nutrition)",
      "Client count and results",
      "Media features",
      "Duration in industry"
    ],
    ctaPatterns: [
      '"Start your transformation"',
      '"Get your free plan"',
      '"Begin your journey"',
      '"Claim your spot"',
      '"Start today"'
    ],
    keyElements: [
      "Transformation stories/photos",
      "Program breakdown",
      "Trainer/coach credentials",
      "Results guarantee",
      "Community/support emphasis"
    ],
    avoidElements: [
      "Before/after that looks fake",
      "Unrealistic claims",
      "Generic gym stock photos",
      "Technical jargon"
    ],
    socialProof: "Transformation photos with stories. Video testimonials very effective.",
    pricingStyle: "Program-based pricing, payment plans common, money-back guarantee",
    toneOfVoice: "Motivational, empowering, supportive. 'You can do this.'",
    typography: "Strong, energetic headlines. Clean body text. Action-oriented.",
    commonSections: ["Hero", "Transformations", "Program details", "About coach", "Testimonials", "Pricing", "Guarantee"]
  },
  
  // ============================================================
  // REAL ESTATE
  // ============================================================
  
  realestate: {
    name: "Real Estate",
    heroStyle: "Property-centric with stunning visuals. Full-width hero image of featured property.",
    colorPsychology: "Navy/dark blue for trust, gold for luxury. Clean whites for property focus.",
    trustSignals: [
      "Listings sold / volume stats",
      "Years in business",
      "Local market knowledge",
      "Awards and recognition",
      "Client testimonials"
    ],
    ctaPatterns: [
      '"Schedule a viewing"',
      '"Get a free valuation"',
      '"Explore listings"',
      '"Contact us today"',
      '"Find your home"'
    ],
    keyElements: [
      "Property search/filter",
      "Featured listings grid",
      "Agent profiles",
      "Neighborhood guides",
      "Market stats"
    ],
    avoidElements: [
      "Low-quality property photos",
      "Cluttered property cards",
      "Hidden contact info",
      "Too much text on listings"
    ],
    socialProof: "Sales volume, client testimonials, properties sold count",
    pricingStyle: "Property-specific. Clear price display on all listings.",
    toneOfVoice: "Professional, trustworthy, local expertise emphasized",
    typography: "Clean and professional. Property details highly readable.",
    commonSections: ["Hero search", "Featured listings", "Services", "About agent", "Testimonials", "Contact"]
  },
  
  // ============================================================
  // EDUCATION & COURSES
  // ============================================================
  
  education: {
    name: "Education / Courses",
    heroStyle: "Outcome-focused headline with course preview or instructor. Video-first for courses.",
    colorPsychology: "Blue/purple for wisdom, green for growth. Warm tones for accessibility.",
    trustSignals: [
      "Student count and success stories",
      "Instructor credentials",
      "Completion/satisfaction rates",
      "Platform badges (Udemy, Coursera level)",
      "Media features"
    ],
    ctaPatterns: [
      '"Enroll now"',
      '"Start learning free"',
      '"Get instant access"',
      '"Join the course"',
      '"Watch the free lesson"'
    ],
    keyElements: [
      "Curriculum breakdown",
      "Instructor bio and credentials",
      "Student testimonials with results",
      "Module/lesson preview",
      "Certificate/outcome information"
    ],
    avoidElements: [
      "Vague course descriptions",
      "No curriculum preview",
      "Stock classroom photos",
      "Unclear time commitment"
    ],
    socialProof: "Student count, success stories with specific outcomes, completion rate",
    pricingStyle: "One-time OR subscription. Payment plans. Often free preview/trial.",
    toneOfVoice: "Educational, encouraging, outcome-focused. 'By the end, you'll be able to...'",
    typography: "Clear, readable. Curriculum/module hierarchy important.",
    commonSections: ["Hero", "What you'll learn", "Curriculum", "Instructor", "Testimonials", "Pricing", "FAQ", "Guarantee"]
  }
};

// ============================================================
// INDUSTRY DETECTION & FORMATTING
// ============================================================

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  saas: ['software', 'app', 'platform', 'tool', 'saas', 'b2b', 'startup', 'api', 'dashboard', 'automation'],
  coaching: ['coaching', 'coach', 'mentor', 'consultant', 'consulting', 'course', 'training', 'transformation', 'mindset'],
  ecommerce: ['product', 'shop', 'store', 'buy', 'cart', 'ecommerce', 'dropshipping', 'physical product', 'merch'],
  agency: ['agency', 'studio', 'services', 'creative', 'design agency', 'marketing agency', 'branding', 'web development'],
  newsletter: ['newsletter', 'subscribe', 'email list', 'content', 'blog', 'publication', 'weekly', 'daily digest'],
  event: ['event', 'webinar', 'conference', 'workshop', 'summit', 'live', 'masterclass', 'bootcamp', 'training'],
  health: ['fitness', 'health', 'gym', 'workout', 'nutrition', 'wellness', 'weight loss', 'personal trainer', 'yoga'],
  realestate: ['real estate', 'property', 'house', 'apartment', 'realtor', 'listings', 'home', 'mortgage'],
  education: ['course', 'learn', 'education', 'online course', 'bootcamp', 'certification', 'students', 'curriculum']
};

/**
 * Detects industry from prompt text
 */
export function extractIndustryFromPrompt(prompt: string): string | undefined {
  const lowerPrompt = prompt.toLowerCase();
  
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (keywords.some(kw => lowerPrompt.includes(kw))) {
      return industry;
    }
  }
  
  return undefined;
}

/**
 * Returns formatted industry guidance for the AI prompt
 */
export function getIndustryGuidance(industry: string): string {
  const pattern = INDUSTRY_PATTERNS[industry.toLowerCase()];
  if (!pattern) return '';
  
  return `
=== INDUSTRY-SPECIFIC DESIGN: ${pattern.name.toUpperCase()} ===

HERO STYLE: ${pattern.heroStyle}

COLOR PSYCHOLOGY: ${pattern.colorPsychology}

TRUST SIGNALS (include these):
${pattern.trustSignals.map(t => `• ${t}`).join('\n')}

RECOMMENDED CTAs:
${pattern.ctaPatterns.map(c => `• ${c}`).join('\n')}

KEY ELEMENTS TO INCLUDE:
${pattern.keyElements.map(e => `• ${e}`).join('\n')}

ELEMENTS TO AVOID:
${pattern.avoidElements.map(a => `• ${a}`).join('\n')}

SOCIAL PROOF STYLE: ${pattern.socialProof}

PRICING APPROACH: ${pattern.pricingStyle}

TONE OF VOICE: ${pattern.toneOfVoice}

TYPOGRAPHY: ${pattern.typography}

TYPICAL SECTION ORDER:
${pattern.commonSections.map((s, i) => `${i + 1}. ${s}`).join('\n')}
`;
}

/**
 * Returns condensed industry context for token-limited prompts
 */
export function getIndustrySummary(industry: string): string {
  const pattern = INDUSTRY_PATTERNS[industry.toLowerCase()];
  if (!pattern) return '';
  
  return `Industry: ${pattern.name}. ${pattern.heroStyle} CTAs: ${pattern.ctaPatterns.slice(0, 2).join(', ')}. Trust: ${pattern.trustSignals[0]}.`;
}
