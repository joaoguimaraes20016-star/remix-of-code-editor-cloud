/**
 * Component Atoms Library
 * 
 * Atomic design primitives that ensure consistency and proper sizing
 * across all generated components. These are the building blocks.
 */

// ============================================================
// INPUT ATOMS
// ============================================================
export const INPUT_ATOMS = {
  email: {
    width: "280-320px (or full-width on mobile)",
    placeholder: "you@example.com",
    autocomplete: "email",
    inputType: "email",
    validation: "email format required",
    label: "Email address",
    errorMessage: "Please enter a valid email"
  },
  
  name: {
    width: "200-280px (or full-width on mobile)",
    placeholder: "Jane Smith",
    autocomplete: "name",
    inputType: "text",
    label: "Full name",
    errorMessage: "Please enter your name"
  },
  
  firstName: {
    width: "140-180px",
    placeholder: "Jane",
    autocomplete: "given-name",
    inputType: "text",
    label: "First name"
  },
  
  lastName: {
    width: "140-180px",
    placeholder: "Smith",
    autocomplete: "family-name",
    inputType: "text",
    label: "Last name"
  },
  
  phone: {
    width: "200-240px",
    placeholder: "+1 (555) 000-0000",
    autocomplete: "tel",
    inputType: "tel",
    label: "Phone number",
    errorMessage: "Please enter a valid phone number"
  },
  
  company: {
    width: "220-280px",
    placeholder: "Acme Inc.",
    autocomplete: "organization",
    inputType: "text",
    label: "Company name"
  },
  
  website: {
    width: "280-320px",
    placeholder: "https://example.com",
    autocomplete: "url",
    inputType: "url",
    label: "Website URL"
  },
  
  message: {
    width: "100%",
    rows: "4-6",
    placeholder: "Tell us about your project...",
    inputType: "textarea",
    label: "Message"
  }
};

// ============================================================
// BUTTON ATOMS
// ============================================================
export const BUTTON_ATOMS = {
  primary: {
    minHeight: "48px",
    minWidth: "120px",
    padding: {
      vertical: "12-16px",
      horizontal: "24-48px"
    },
    fontWeight: "600-700",
    fontSize: "16-18px",
    textTransform: "none (or uppercase for short CTAs)",
    borderRadius: "8-12px (or full pill)",
    states: {
      default: "solid fill, high contrast",
      hover: "darken 8-10% OR lift with shadow (0 4px 12px)",
      active: "darken 12%, scale(0.98)",
      disabled: "50% opacity, cursor: not-allowed",
      loading: "spinner icon, maintain width"
    }
  },
  
  secondary: {
    style: "outline OR muted fill (10-20% opacity of primary)",
    usage: "Alternative actions, back buttons",
    contrast: "Lower visual weight than primary",
    borderWidth: "1-2px for outline variant"
  },
  
  ghost: {
    style: "Text-only, minimal or no background",
    padding: "8-12px vertical, 16-24px horizontal",
    usage: "Tertiary actions, skip links, cancel",
    hover: "Subtle background on hover (5-10% opacity)"
  },
  
  icon: {
    size: "40-48px square",
    iconSize: "20-24px",
    borderRadius: "50% (circle) or 8px",
    usage: "Social links, close buttons, toggles"
  }
};

// ============================================================
// CARD ATOMS
// ============================================================
export const CARD_ATOMS = {
  basic: {
    padding: "24-32px",
    borderRadius: "12-16px",
    shadow: "0 4px 12px rgba(0,0,0,0.08)",
    border: "1px solid rgba(0,0,0,0.06) or none",
    hover: "lift with enhanced shadow, optional scale(1.02)"
  },
  
  feature: {
    structure: "icon → title → description",
    iconSize: "36-48px",
    iconStyle: "solid color or gradient background",
    titleSize: "18-20px, weight 600",
    descriptionSize: "14-16px, weight 400",
    spacing: {
      iconToTitle: "16px",
      titleToDescription: "8-12px"
    }
  },
  
  testimonial: {
    structure: "quote → rating (optional) → avatar + name + title",
    quoteSize: "16-18px",
    quoteStyle: "italic or normal, larger than body",
    avatarSize: "48-64px",
    nameSize: "16px, weight 600",
    titleSize: "14px, weight 400, muted color",
    spacing: {
      quoteToMeta: "16-24px"
    }
  },
  
  pricing: {
    structure: "tier name → price → tagline → features → CTA",
    highlighted: {
      scale: "1.05",
      border: "2px accent color",
      badge: "Most Popular"
    },
    priceSize: "36-48px",
    pricePeriod: "14px, muted (/month)",
    featureList: {
      items: "5-8 features",
      icon: "check or checkmark",
      iconColor: "success green"
    }
  },
  
  stat: {
    structure: "number → label",
    numberSize: "36-48px, weight 700-800",
    labelSize: "12-14px, uppercase, weight 500-600",
    spacing: "8px between number and label"
  }
};

// ============================================================
// BADGE ATOMS
// ============================================================
export const BADGE_ATOMS = {
  default: {
    padding: "4-6px vertical, 8-12px horizontal",
    borderRadius: "full pill (999px) or 6px",
    fontSize: "11-13px",
    fontWeight: "500-600",
    textTransform: "uppercase"
  },
  
  variants: {
    info: { 
      bg: "blue-100 (light) or blue-900/30 (dark)", 
      text: "blue-700 (light) or blue-300 (dark)", 
      icon: "info" 
    },
    success: { 
      bg: "green-100 or green-900/30", 
      text: "green-700 or green-300", 
      icon: "check" 
    },
    warning: { 
      bg: "yellow-100 or yellow-900/30", 
      text: "yellow-700 or yellow-300", 
      icon: "alert-triangle" 
    },
    error: { 
      bg: "red-100 or red-900/30", 
      text: "red-700 or red-300", 
      icon: "x-circle" 
    },
    neutral: { 
      bg: "gray-100 or gray-800", 
      text: "gray-700 or gray-300", 
      icon: null 
    },
    premium: {
      bg: "gradient (gold or purple)",
      text: "white",
      icon: "star or sparkles"
    }
  }
};

// ============================================================
// AVATAR ATOMS
// ============================================================
export const AVATAR_ATOMS = {
  sizes: {
    xs: { size: "24px", fontSize: "10px" },
    sm: { size: "32px", fontSize: "12px" },
    md: { size: "48px", fontSize: "16px" },
    lg: { size: "64px", fontSize: "20px" },
    xl: { size: "96px", fontSize: "32px" },
    "2xl": { size: "128px", fontSize: "40px" }
  },
  
  group: {
    overlap: "-8px to -12px margin",
    maxVisible: "5 avatars visible + count badge",
    border: "2-3px white ring for separation",
    countBadge: {
      bg: "primary or gray",
      text: "white",
      content: "+{remaining}"
    }
  },
  
  fallback: "Initials on colored background or generic user icon"
};

// ============================================================
// SPACING ATOMS
// ============================================================
export const SPACING_ATOMS = {
  inline: {
    tight: "2-4px (icon to text, badge items)",
    default: "8px (related inline items)",
    loose: "12-16px (separated items)"
  },
  
  stack: {
    tight: "8px (form label to input)",
    default: "16px (between related elements)",
    medium: "24px (between element groups)",
    loose: "32px (between subsections)"
  },
  
  section: {
    small: "48px (compact sections)",
    default: "64-80px (standard sections)",
    large: "96-128px (hero sections)",
    xlarge: "160px+ (dramatic breaks)"
  },
  
  container: {
    paddingX: {
      mobile: "16-24px",
      tablet: "32-48px",
      desktop: "48-64px"
    },
    maxWidth: {
      content: "720-800px (text content)",
      wide: "1200-1280px (standard)",
      full: "1400-1600px (wide layouts)"
    }
  }
};

// ============================================================
// TYPOGRAPHY ATOMS
// ============================================================
export const TYPOGRAPHY_ATOMS = {
  scale: {
    display: { 
      size: "48-72px", 
      weight: "700-800", 
      lineHeight: "1.1-1.2",
      usage: "Hero headlines only"
    },
    h1: { 
      size: "36-48px", 
      weight: "700", 
      lineHeight: "1.2-1.3",
      usage: "Page titles"
    },
    h2: { 
      size: "28-36px", 
      weight: "600-700", 
      lineHeight: "1.25-1.35",
      usage: "Section headers"
    },
    h3: { 
      size: "22-28px", 
      weight: "600", 
      lineHeight: "1.3-1.4",
      usage: "Subsections, card titles"
    },
    h4: { 
      size: "18-22px", 
      weight: "500-600", 
      lineHeight: "1.35-1.45",
      usage: "Minor headings"
    },
    body: { 
      size: "16-18px", 
      weight: "400", 
      lineHeight: "1.5-1.7",
      usage: "Paragraphs, main content"
    },
    small: { 
      size: "14px", 
      weight: "400-500", 
      lineHeight: "1.5",
      usage: "Secondary text, captions"
    },
    caption: { 
      size: "12px", 
      weight: "500", 
      lineHeight: "1.4",
      usage: "Labels, metadata, badges"
    }
  },
  
  maxLineWidth: {
    optimal: "65-75 characters",
    heading: "No limit, break at natural phrases",
    wide: "80-90 characters (short paragraphs)"
  }
};

// ============================================================
// ICON ATOMS
// ============================================================
export const ICON_ATOMS = {
  sizes: {
    xs: "12px",
    sm: "16px",
    md: "20px",
    lg: "24px",
    xl: "32px",
    "2xl": "48px"
  },
  
  allowed: [
    "check", "star", "rocket", "users", "clock", "shield", "zap", "target",
    "award", "heart", "thumbs-up", "trending-up", "map", "calendar", "play",
    "mail", "phone", "globe", "arrow-right", "arrow-left", "chevron-right",
    "chevron-down", "x", "menu", "search", "settings", "user", "lock",
    "credit-card", "download", "upload", "refresh", "info", "alert-triangle"
  ],
  
  strokeWidth: "2px (default) or 1.5px (light) or 2.5px (bold)"
};

// ============================================================
// MAIN EXPORT & HELPERS
// ============================================================
export const COMPONENT_ATOMS = {
  inputs: INPUT_ATOMS,
  buttons: BUTTON_ATOMS,
  cards: CARD_ATOMS,
  badges: BADGE_ATOMS,
  avatars: AVATAR_ATOMS,
  spacing: SPACING_ATOMS,
  typography: TYPOGRAPHY_ATOMS,
  icons: ICON_ATOMS
};

/**
 * Returns component guidance for a specific component type
 */
export function getComponentGuidance(componentType: string): string {
  const atomMap: Record<string, unknown> = {
    input: INPUT_ATOMS,
    button: BUTTON_ATOMS,
    card: CARD_ATOMS,
    badge: BADGE_ATOMS,
    avatar: AVATAR_ATOMS,
    spacing: SPACING_ATOMS,
    typography: TYPOGRAPHY_ATOMS,
    icon: ICON_ATOMS
  };
  
  const atoms = atomMap[componentType.toLowerCase()];
  if (!atoms) return '';
  
  return JSON.stringify(atoms, null, 2);
}

/**
 * Returns formatted atomic design rules for AI context
 */
export function getAtomicDesignRules(): string {
  return `
=== ATOMIC DESIGN SPECIFICATIONS ===

BUTTON SIZING:
- Primary: min 48px height, 12-16px vertical / 24-48px horizontal padding
- Touch target: minimum 44x44px on mobile
- Border radius: 8-12px (pro) or pill (modern)

INPUT SIZING:
- Email field: 280-320px width
- Phone field: 200-240px width
- Full-width on mobile always
- Labels ABOVE fields, never inside

CARD SIZING:
- Padding: 24-32px
- Border radius: 12-16px
- Shadow: 0 4px 12px rgba(0,0,0,0.08)

AVATAR SIZES:
- Small (32px): inline mentions
- Medium (48px): testimonials
- Large (64px): featured profiles
- Groups: -8px overlap, max 5 visible

SPACING SCALE (8px grid):
- 8px: related items (icon to text)
- 16px: component internal gaps
- 24px: between element groups
- 32px: subsection breaks
- 48-64px: section padding
- 96-128px: hero section padding

TYPOGRAPHY SCALE:
- Display: 48-72px (hero only)
- H1: 36-48px
- H2: 28-36px
- H3: 22-28px
- Body: 16-18px
- Small: 14px
- Caption: 12px
`;
}
