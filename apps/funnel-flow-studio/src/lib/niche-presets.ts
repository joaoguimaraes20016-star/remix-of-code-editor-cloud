// ============================================
// NICHE-SPECIFIC PRESETS FOR INFO BUSINESS FUNNELS
// Trading, Marketing Agency, Consulting, Coaching
// ============================================

export type NicheType = 'trading' | 'marketing' | 'consulting' | 'coaching';

export interface NicheColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  muted: string;
}

export interface NichePreset {
  id: string;
  name: string;
  config: Record<string, any>;
}

export interface NicheConfig {
  name: string;
  description: string;
  colors: NicheColors;
  buttons: NichePreset[];
  headings: NichePreset[];
  text: NichePreset[];
  copy: {
    headlines: string[];
    subheadlines: string[];
    ctas: string[];
    socialProof: string[];
  };
}

// ========== TRADING NICHE ==========
export const tradingPresets: NicheConfig = {
  name: 'Trading',
  description: 'Dark theme with gold accents for wealth and premium feel',
  colors: {
    primary: '#ffd700',
    secondary: '#1a1a2e',
    accent: '#10b981',
    background: '#0f0f1a',
    text: '#ffffff',
    muted: '#6b7280',
  },
  buttons: [
    { 
      id: 'cta-gold', 
      name: 'Gold CTA', 
      config: { backgroundColor: '#ffd700', color: '#000000', borderRadius: 8, size: 'lg' } 
    },
    { 
      id: 'cta-dark', 
      name: 'Dark Premium', 
      config: { backgroundColor: '#1a1a2e', color: '#ffd700', borderRadius: 4, size: 'lg' } 
    },
    { 
      id: 'cta-profit', 
      name: 'Profit Green', 
      config: { backgroundColor: '#10b981', color: '#ffffff', borderRadius: 8, size: 'lg' } 
    },
    { 
      id: 'cta-urgency', 
      name: 'Urgency Red', 
      config: { backgroundColor: '#dc2626', color: '#ffffff', borderRadius: 4, size: 'lg' } 
    },
  ],
  headings: [
    { 
      id: 'profit-hero', 
      name: 'Profit Hero', 
      config: { level: 1, styles: { fontSize: 48, fontWeight: 800, color: '#ffd700', textAlign: 'center' } } 
    },
    { 
      id: 'dark-section', 
      name: 'Dark Section', 
      config: { level: 2, styles: { fontSize: 32, fontWeight: 700, color: '#ffffff', textAlign: 'left' } } 
    },
    { 
      id: 'stats-number', 
      name: 'Stats Number', 
      config: { level: 2, styles: { fontSize: 56, fontWeight: 900, color: '#10b981', textAlign: 'center' } } 
    },
  ],
  text: [
    { 
      id: 'body-light', 
      name: 'Body Light', 
      config: { styles: { fontSize: 16, color: '#e5e7eb', lineHeight: 1.7 } } 
    },
    { 
      id: 'disclaimer', 
      name: 'Disclaimer', 
      config: { styles: { fontSize: 12, color: '#6b7280', textAlign: 'center' } } 
    },
  ],
  copy: {
    headlines: [
      'Learn the Exact Strategy I Used to Turn $5K into $50K',
      'Stop Losing Money in the Markets',
      'The 3-Step System Pro Traders Don\'t Want You to Know',
      'Master the Art of Profitable Trading',
    ],
    subheadlines: [
      'Download the same strategy that helped 2,847 traders achieve consistent profits',
      'A proven, risk-managed approach to building wealth through the markets',
      'No experience needed. Works in any market condition.',
    ],
    ctas: [
      'Get Free Trading Blueprint',
      'Claim Your Spot Now',
      'Start Trading Profitably',
      'Download Free Strategy',
      'Join The Trading Academy',
    ],
    socialProof: [
      '2,847+ profitable students',
      '89% win rate verified',
      '$14.2M in student profits',
      'Featured on TradingView',
    ],
  },
};

// ========== MARKETING AGENCY NICHE ==========
export const marketingPresets: NicheConfig = {
  name: 'Marketing Agency',
  description: 'Bold blue with orange accents for trust and energy',
  colors: {
    primary: '#3b82f6',
    secondary: '#1e3a8a',
    accent: '#f59e0b',
    background: '#ffffff',
    text: '#0f172a',
    muted: '#6b7280',
  },
  buttons: [
    { 
      id: 'cta-blue', 
      name: 'Agency Blue', 
      config: { backgroundColor: '#3b82f6', color: '#ffffff', borderRadius: 999, size: 'lg' } 
    },
    { 
      id: 'cta-gradient', 
      name: 'Gradient CTA', 
      config: { backgroundColor: '#6366f1', color: '#ffffff', borderRadius: 12, size: 'lg' } 
    },
    { 
      id: 'cta-orange', 
      name: 'Energy Orange', 
      config: { backgroundColor: '#f59e0b', color: '#000000', borderRadius: 8, size: 'lg' } 
    },
    { 
      id: 'cta-dark-blue', 
      name: 'Dark Blue', 
      config: { backgroundColor: '#1e3a8a', color: '#ffffff', borderRadius: 4, size: 'lg' } 
    },
  ],
  headings: [
    { 
      id: 'bold-hero', 
      name: 'Bold Hero', 
      config: { level: 1, styles: { fontSize: 48, fontWeight: 800, color: '#0f172a', textAlign: 'center' } } 
    },
    { 
      id: 'blue-accent', 
      name: 'Blue Accent', 
      config: { level: 2, styles: { fontSize: 36, fontWeight: 700, color: '#3b82f6', textAlign: 'left' } } 
    },
    { 
      id: 'roi-number', 
      name: 'ROI Number', 
      config: { level: 2, styles: { fontSize: 56, fontWeight: 900, color: '#f59e0b', textAlign: 'center' } } 
    },
  ],
  text: [
    { 
      id: 'body-dark', 
      name: 'Body Dark', 
      config: { styles: { fontSize: 18, color: '#374151', lineHeight: 1.7 } } 
    },
    { 
      id: 'feature-text', 
      name: 'Feature Text', 
      config: { styles: { fontSize: 16, color: '#6b7280', textAlign: 'center' } } 
    },
  ],
  copy: {
    headlines: [
      '10X Your Leads Without Hiring an In-House Team',
      'We\'ve Generated $47M for Clients Like You',
      'Your Competitors Are Already Using This',
      'Stop Wasting Money on Ads That Don\'t Convert',
    ],
    subheadlines: [
      'Done-for-you marketing systems that deliver predictable growth',
      'The same strategies used by 7 and 8-figure businesses',
      'Guaranteed ROI or we work for free',
    ],
    ctas: [
      'Get Your Free Growth Audit',
      'Book Strategy Call',
      'See Our Case Studies',
      'Start Scaling Today',
      'Get My Free Audit',
    ],
    socialProof: [
      '347+ businesses scaled',
      'Average 312% ROI',
      'Featured in Forbes, Inc, Entrepreneur',
      '$47M generated for clients',
    ],
  },
};

// ========== CONSULTING NICHE ==========
export const consultingPresets: NicheConfig = {
  name: 'Consulting',
  description: 'Premium dark with purple accents for authority and wisdom',
  colors: {
    primary: '#6366f1',
    secondary: '#0f172a',
    accent: '#f8fafc',
    background: '#020617',
    text: '#f8fafc',
    muted: '#94a3b8',
  },
  buttons: [
    { 
      id: 'cta-premium', 
      name: 'Premium Dark', 
      config: { backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: 4, size: 'lg' } 
    },
    { 
      id: 'cta-purple', 
      name: 'Purple CTA', 
      config: { backgroundColor: '#6366f1', color: '#ffffff', borderRadius: 6, size: 'lg' } 
    },
    { 
      id: 'cta-white', 
      name: 'White Elegant', 
      config: { backgroundColor: '#ffffff', color: '#0f172a', borderRadius: 4, size: 'lg' } 
    },
    { 
      id: 'cta-outline', 
      name: 'Outline', 
      config: { variant: 'outline', borderRadius: 4, size: 'lg' } 
    },
  ],
  headings: [
    { 
      id: 'authority-hero', 
      name: 'Authority Hero', 
      config: { level: 1, styles: { fontSize: 48, fontWeight: 700, color: '#f8fafc', textAlign: 'center' } } 
    },
    { 
      id: 'purple-section', 
      name: 'Purple Section', 
      config: { level: 2, styles: { fontSize: 32, fontWeight: 600, color: '#6366f1', textAlign: 'left' } } 
    },
    { 
      id: 'valuation-number', 
      name: 'Valuation Number', 
      config: { level: 2, styles: { fontSize: 56, fontWeight: 900, color: '#f8fafc', textAlign: 'center' } } 
    },
  ],
  text: [
    { 
      id: 'body-elegant', 
      name: 'Body Elegant', 
      config: { styles: { fontSize: 18, color: '#e2e8f0', lineHeight: 1.8 } } 
    },
    { 
      id: 'subtitle-muted', 
      name: 'Subtitle Muted', 
      config: { styles: { fontSize: 16, color: '#94a3b8', textAlign: 'center' } } 
    },
  ],
  copy: {
    headlines: [
      'Strategic Clarity for 7-Figure Business Owners',
      'The Framework Behind 23 Successful Exits',
      'Transform Your Business in 90 Days',
      'Executive Coaching for High-Performers',
    ],
    subheadlines: [
      'A proven methodology trusted by Fortune 500 executives',
      'From chaos to clarity: your roadmap to scalable growth',
      'Private, high-touch advisory for ambitious leaders',
    ],
    ctas: [
      'Apply for Strategy Session',
      'Download Executive Guide',
      'Schedule Discovery Call',
      'Request Private Consultation',
      'Get Your Roadmap',
    ],
    socialProof: [
      'Trusted by Fortune 500 executives',
      '$2.3B in client valuations',
      'Harvard Business Review featured',
      '23 successful exits guided',
    ],
  },
};

// ========== COACHING NICHE ==========
export const coachingPresets: NicheConfig = {
  name: 'Coaching',
  description: 'Warm gradients with transformation-focused messaging',
  colors: {
    primary: '#f59e0b',
    secondary: '#dc2626',
    accent: '#fbbf24',
    background: '#fffbeb',
    text: '#1f2937',
    muted: '#6b7280',
  },
  buttons: [
    { 
      id: 'cta-warm', 
      name: 'Warm CTA', 
      config: { backgroundColor: '#f59e0b', color: '#000000', borderRadius: 12, size: 'lg' } 
    },
    { 
      id: 'cta-red', 
      name: 'Action Red', 
      config: { backgroundColor: '#dc2626', color: '#ffffff', borderRadius: 8, size: 'lg' } 
    },
    { 
      id: 'cta-gradient-warm', 
      name: 'Gradient Warm', 
      config: { backgroundColor: '#ea580c', color: '#ffffff', borderRadius: 999, size: 'lg' } 
    },
    { 
      id: 'cta-dark-warm', 
      name: 'Dark Warm', 
      config: { backgroundColor: '#1f2937', color: '#fbbf24', borderRadius: 8, size: 'lg' } 
    },
  ],
  headings: [
    { 
      id: 'transformation-hero', 
      name: 'Transformation', 
      config: { level: 1, styles: { fontSize: 48, fontWeight: 800, color: '#1f2937', textAlign: 'center' } } 
    },
    { 
      id: 'warm-accent', 
      name: 'Warm Accent', 
      config: { level: 2, styles: { fontSize: 36, fontWeight: 700, color: '#ea580c', textAlign: 'center' } } 
    },
    { 
      id: 'impact-number', 
      name: 'Impact Number', 
      config: { level: 2, styles: { fontSize: 56, fontWeight: 900, color: '#dc2626', textAlign: 'center' } } 
    },
  ],
  text: [
    { 
      id: 'body-warm', 
      name: 'Body Warm', 
      config: { styles: { fontSize: 18, color: '#374151', lineHeight: 1.8 } } 
    },
    { 
      id: 'inspiring', 
      name: 'Inspiring', 
      config: { styles: { fontSize: 20, color: '#6b7280', textAlign: 'center', fontStyle: 'italic' } } 
    },
  ],
  copy: {
    headlines: [
      'Unlock Your Full Potential in 90 Days',
      'The Breakthrough You\'ve Been Waiting For',
      'Transform Your Life, One Step at a Time',
      'Your Journey to Greatness Starts Here',
    ],
    subheadlines: [
      'A step-by-step system for lasting transformation',
      'Join thousands who\'ve already changed their lives',
      'Accountability, clarity, and results guaranteed',
    ],
    ctas: [
      'Start Your Transformation',
      'Apply for Coaching',
      'Get Free Masterclass',
      'Book Discovery Call',
      'Join The Movement',
    ],
    socialProof: [
      '5,000+ lives transformed',
      '98% recommend to friends',
      'Featured on TEDx',
      '4.9★ from 2,400+ reviews',
    ],
  },
};

// ========== COMBINED PRESETS ==========
export const nichePresets: Record<NicheType, NicheConfig> = {
  trading: tradingPresets,
  marketing: marketingPresets,
  consulting: consultingPresets,
  coaching: coachingPresets,
};

// ========== PRESET CATEGORIES FOR INSPECTOR ==========
export const allButtonPresets = [
  // Universal
  { id: 'primary', name: 'Primary', config: { backgroundColor: '#6366f1', color: '#ffffff', borderRadius: 8, size: 'lg' }, category: 'universal' },
  { id: 'success', name: 'Success', config: { backgroundColor: '#10b981', color: '#ffffff', borderRadius: 8, size: 'lg' }, category: 'universal' },
  { id: 'outline', name: 'Outline', config: { variant: 'outline', borderRadius: 8, size: 'lg' }, category: 'universal' },
  { id: 'pill', name: 'Pill', config: { backgroundColor: '#6366f1', color: '#ffffff', borderRadius: 999, size: 'lg' }, category: 'universal' },
  // Trading
  { id: 'gold-cta', name: 'Gold CTA', config: { backgroundColor: '#ffd700', color: '#000000', borderRadius: 8, size: 'lg' }, category: 'trading' },
  { id: 'profit-green', name: 'Profit Green', config: { backgroundColor: '#10b981', color: '#ffffff', borderRadius: 8, size: 'lg' }, category: 'trading' },
  // Marketing
  { id: 'agency-blue', name: 'Agency Blue', config: { backgroundColor: '#3b82f6', color: '#ffffff', borderRadius: 999, size: 'lg' }, category: 'marketing' },
  { id: 'energy-orange', name: 'Energy Orange', config: { backgroundColor: '#f59e0b', color: '#000000', borderRadius: 8, size: 'lg' }, category: 'marketing' },
  // Consulting
  { id: 'premium-dark', name: 'Premium Dark', config: { backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: 4, size: 'lg' }, category: 'consulting' },
  { id: 'purple-elegant', name: 'Purple Elegant', config: { backgroundColor: '#6366f1', color: '#ffffff', borderRadius: 6, size: 'lg' }, category: 'consulting' },
  // Coaching
  { id: 'warm-cta', name: 'Warm CTA', config: { backgroundColor: '#f59e0b', color: '#000000', borderRadius: 12, size: 'lg' }, category: 'coaching' },
  { id: 'action-red', name: 'Action Red', config: { backgroundColor: '#dc2626', color: '#ffffff', borderRadius: 8, size: 'lg' }, category: 'coaching' },
];

export const allHeadingPresets = [
  // Universal
  { id: 'hero', name: 'Hero', config: { level: 1, styles: { fontSize: 48, fontWeight: 800, textAlign: 'center' } }, category: 'universal' },
  { id: 'section', name: 'Section', config: { level: 2, styles: { fontSize: 32, fontWeight: 700, textAlign: 'left' } }, category: 'universal' },
  { id: 'subtitle', name: 'Subtitle', config: { level: 3, styles: { fontSize: 20, fontWeight: 400, color: '#6b7280' } }, category: 'universal' },
  // Trading
  { id: 'profit-hero', name: 'Profit Hero', config: { level: 1, styles: { fontSize: 48, fontWeight: 800, color: '#ffd700', textAlign: 'center' } }, category: 'trading' },
  { id: 'stats-green', name: 'Stats Green', config: { level: 2, styles: { fontSize: 56, fontWeight: 900, color: '#10b981', textAlign: 'center' } }, category: 'trading' },
  // Marketing
  { id: 'bold-blue', name: 'Bold Blue', config: { level: 1, styles: { fontSize: 48, fontWeight: 800, color: '#3b82f6', textAlign: 'center' } }, category: 'marketing' },
  { id: 'roi-orange', name: 'ROI Orange', config: { level: 2, styles: { fontSize: 56, fontWeight: 900, color: '#f59e0b', textAlign: 'center' } }, category: 'marketing' },
  // Consulting
  { id: 'authority', name: 'Authority', config: { level: 1, styles: { fontSize: 48, fontWeight: 700, color: '#f8fafc', textAlign: 'center' } }, category: 'consulting' },
  { id: 'purple-section', name: 'Purple Section', config: { level: 2, styles: { fontSize: 32, fontWeight: 600, color: '#6366f1', textAlign: 'left' } }, category: 'consulting' },
  // Coaching
  { id: 'transformation', name: 'Transformation', config: { level: 1, styles: { fontSize: 48, fontWeight: 800, color: '#1f2937', textAlign: 'center' } }, category: 'coaching' },
  { id: 'impact-red', name: 'Impact Red', config: { level: 2, styles: { fontSize: 56, fontWeight: 900, color: '#dc2626', textAlign: 'center' } }, category: 'coaching' },
];

// Helper function to get presets by niche
export function getPresetsForNiche(niche: NicheType) {
  return nichePresets[niche];
}

// Helper function to get random copy for a niche
export function getRandomCopy(niche: NicheType, type: keyof NicheConfig['copy']): string {
  const config = nichePresets[niche];
  const copies = config.copy[type];
  return copies[Math.floor(Math.random() * copies.length)];
}
