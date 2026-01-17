/**
 * AI Copilot Type Definitions
 * 
 * Expanded types for full-funnel generation support.
 */

import type { 
  PageBackground,
  StepIntent,
  BlockType,
  ElementType
} from '@/flow-canvas/types/infostack';

// ============================================
// GENERATION MODES
// ============================================

export type GenerationMode = 'funnel' | 'block' | 'settings';

// ============================================
// BRAND KIT
// ============================================

export interface BrandKit {
  theme: 'light' | 'dark';
  primaryColor: string;
  accentColor?: string;
  backgroundColor: string;
  backgroundType: 'solid' | 'gradient';
  backgroundGradient?: {
    type: 'linear' | 'radial';
    angle: number;
    stops: Array<{ color: string; position: number }>;
  };
  fontFamily: string;
  headingFont?: string;
}

// ============================================
// AI GENERATED STRUCTURES
// ============================================

export interface AIElement {
  type: ElementType | string;
  content?: string;
  props?: Record<string, unknown>;
  placeholder?: boolean;  // For images/videos
  placeholderContext?: 'hero' | 'testimonial' | 'feature' | 'avatar';
  aspectRatio?: '16:9' | '4:3' | '1:1' | '3:4';
}

export interface AIBlock {
  type: BlockType | string;
  label: string;
  elements: AIElement[];
  props?: Record<string, unknown>;
}

export interface AIFrame {
  layout: 'contained' | 'full-width';
  blocks: AIBlock[];
  designPreset?: 'minimal' | 'card' | 'glass' | 'full-bleed';
  label?: string;
}

export interface AIStep {
  name: string;
  intent: StepIntent;
  frames: AIFrame[];
}

export interface AIFunnel {
  name: string;
  funnelType: string;
  brandKit: BrandKit;
  steps: AIStep[];
}

// ============================================
// AI RESPONSE TYPES
// ============================================

export interface AIFunnelResponse {
  // Full funnel mode - creates multi-step funnel
  funnel?: AIFunnel;
  
  // Single block mode (existing behavior)
  block?: {
    type: string;
    label: string;
    elements: Array<{
      type: string;
      content?: string;
      props?: Record<string, unknown>;
    }>;
    props?: Record<string, unknown>;
  };
  
  // Page settings update mode
  pageSettings?: {
    theme?: 'light' | 'dark';
    primary_color?: string;
    page_background?: PageBackground;
    font_family?: string;
  };
}

// ============================================
// FUNNEL TEMPLATES (for guidance)
// ============================================

export const FUNNEL_STRUCTURES: Record<string, { steps: Array<{ name: string; intent: StepIntent; description: string }> }> = {
  vsl: {
    steps: [
      { name: 'Watch Video', intent: 'capture', description: 'Video + urgency headline + main CTA' },
      { name: 'Get Started', intent: 'convert', description: 'Lead capture form + value proposition' },
    ]
  },
  webinar: {
    steps: [
      { name: 'Register', intent: 'capture', description: 'Registration form + countdown + social proof' },
      { name: 'Confirmation', intent: 'complete', description: 'Calendar add + share + next steps' },
    ]
  },
  optin: {
    steps: [
      { name: 'Get Access', intent: 'capture', description: 'Hook headline + value stack + lead form' },
      { name: 'Thank You', intent: 'complete', description: 'Confirmation + next steps + upsell hint' },
    ]
  },
  sales: {
    steps: [
      { name: 'Sales Page', intent: 'convert', description: 'Full sales page with hero, features, testimonials, pricing, FAQ, CTA' },
    ]
  },
  quiz: {
    steps: [
      { name: 'Start Quiz', intent: 'qualify', description: 'Welcome + curiosity hook + start button' },
      { name: 'Questions', intent: 'qualify', description: 'Progressive questions with engagement' },
      { name: 'Results', intent: 'convert', description: 'Personalized results + offer + CTA' },
    ]
  },
  booking: {
    steps: [
      { name: 'Book Call', intent: 'schedule', description: 'Value proposition + calendar embed + testimonials' },
      { name: 'Confirmed', intent: 'complete', description: 'Confirmation + prep instructions + next steps' },
    ]
  },
};

// ============================================
// DETECTION HELPERS
// ============================================

const FUNNEL_KEYWORDS = ['funnel', 'vsl', 'webinar', 'opt-in', 'optin', 'sales page', 'landing page', 'quiz funnel', 'build me', 'create a', 'make me a', 'generate a'];
const SETTINGS_KEYWORDS = ['background', 'theme', 'dark mode', 'light mode', 'colors', 'brand', 'style', 'gradient'];

export function detectGenerationMode(prompt: string): GenerationMode {
  const lowerPrompt = prompt.toLowerCase();
  
  if (FUNNEL_KEYWORDS.some(kw => lowerPrompt.includes(kw))) {
    return 'funnel';
  }
  if (SETTINGS_KEYWORDS.some(kw => lowerPrompt.includes(kw)) && !lowerPrompt.includes('section') && !lowerPrompt.includes('block')) {
    return 'settings';
  }
  return 'block';
}
