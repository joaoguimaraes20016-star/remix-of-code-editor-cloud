/**
 * Funnel Type Detector
 * 
 * Analyzes page structure to infer what type of funnel this is,
 * enabling the AI to generate more contextually appropriate content.
 */

import type { Page, Block, Element, Step } from '@/flow-canvas/types/infostack';

export type FunnelType = 'vsl' | 'webinar' | 'optin' | 'sales' | 'booking' | 'quiz' | 'application' | 'checkout' | 'thank-you' | 'general';

export interface FunnelTypeResult {
  type: FunnelType;
  confidence: number; // 0-1
  signals: string[]; // What led to this conclusion
  /** True if confidence was below threshold but we found some signals */
  isUncertain?: boolean;
  /** The type we would have returned if confidence was high enough */
  rawType?: FunnelType;
}

/**
 * Extract all blocks from a step's frames
 */
function extractBlocksFromStep(step: Step): Block[] {
  if (!step.frames) return [];
  return step.frames.flatMap(frame => 
    frame.stacks?.flatMap(stack => stack.blocks || []) || []
  );
}

/**
 * Detect funnel type from page structure
 */
/**
 * Minimum confidence threshold to avoid false positives.
 * Below this, we return "general" to avoid misleading the AI.
 */
const CONFIDENCE_THRESHOLD = 0.5;

/**
 * Minimum number of signals required to classify as a specific funnel type.
 * This prevents single weak signals from triggering false classifications.
 */
const MIN_SIGNALS_FOR_CLASSIFICATION = 2;

/**
 * Detect funnel type from page structure with enhanced accuracy.
 * 
 * PHASE 14 FIXES:
 * - Added confidence threshold (0.5) to prevent false positives
 * - Requires at least 2 signals for non-general classification
 * - Tracks which signals contributed to avoid phantom detections
 */
export function detectFunnelType(page: Page): FunnelTypeResult {
  const signals: string[] = [];
  const signalDetails: Map<FunnelType, string[]> = new Map();
  
  const scores: Record<FunnelType, number> = {
    'vsl': 0,
    'webinar': 0,
    'optin': 0,
    'sales': 0,
    'booking': 0,
    'quiz': 0,
    'application': 0,
    'checkout': 0,
    'thank-you': 0,
    'general': 0.1, // Base score for general
  };

  // Helper to add score and track signal
  const addScore = (type: FunnelType, score: number, signal: string) => {
    scores[type] += score;
    signals.push(signal);
    const existing = signalDetails.get(type) || [];
    existing.push(signal);
    signalDetails.set(type, existing);
  };

  // Analyze step intents (using correct StepIntent type)
  const stepIntents = page.steps.map(s => s.step_intent);
  const stepTypes = page.steps.map(s => s.step_type);
  
  // Check step types for funnel indicators (STRONG signals)
  if (stepTypes.includes('checkout')) {
    addScore('checkout', 0.8, 'Has checkout step');
  }
  
  if (stepTypes.includes('thankyou')) {
    addScore('thank-you', 0.8, 'Has thank you step');
  }
  
  if (stepTypes.includes('booking')) {
    addScore('booking', 0.6, 'Has booking step');
  }
  
  if (stepTypes.includes('quiz')) {
    addScore('quiz', 0.6, 'Has quiz step');
  }
  
  // Check step intents (MEDIUM signals)
  if (stepIntents.includes('capture')) {
    addScore('optin', 0.3, 'Has capture intent');
  }
  
  if (stepIntents.includes('convert')) {
    addScore('sales', 0.25, 'Has convert intent');
    addScore('checkout', 0.25, 'Has convert intent');
  }
  
  if (stepIntents.includes('schedule')) {
    addScore('booking', 0.4, 'Has schedule intent');
    addScore('webinar', 0.25, 'Has schedule intent');
  }

  // Analyze all blocks across all steps
  const allBlocks: Block[] = page.steps.flatMap(step => extractBlocksFromStep(step));
  const allElements: Element[] = allBlocks.flatMap(b => b.elements || []);

  // Check for video presence (VSL/Webinar indicator)
  const hasVideo = allElements.some(e => e.type === 'video') || 
                   allBlocks.some(b => b.type === 'media' && b.elements?.some(e => e.type === 'video'));
  
  if (hasVideo) {
    addScore('vsl', 0.35, 'Contains video content');
    addScore('webinar', 0.25, 'Contains video content');
  }

  // Check for forms/inputs - INCREASED threshold to prevent false positives
  const inputCount = allElements.filter(e => 
    e.type === 'input' || e.type === 'select' || e.type === 'checkbox' || e.type === 'radio'
  ).length;
  
  // Only count as opt-in signal if there are 2+ inputs (not just 1)
  if (inputCount >= 4) {
    addScore('optin', 0.35, `Has ${inputCount} form inputs`);
    addScore('application', 0.4, `Has ${inputCount} form inputs`);
  } else if (inputCount >= 2) {
    addScore('optin', 0.25, `Has ${inputCount} form inputs`);
  }
  // Single input is NOT enough to classify as opt-in (was causing false positives)

  // Check for multiple choice (Quiz indicator)
  const hasMultipleChoice = allElements.some(e => 
    e.type === 'multiple-choice' || e.type === 'single-choice'
  );
  
  if (hasMultipleChoice) {
    addScore('quiz', 0.6, 'Has multiple choice questions');
    addScore('application', 0.3, 'Has multiple choice questions');
  }

  // Check for booking/calendar (STRONG signal)
  const hasBooking = allBlocks.some(b => b.type === 'booking');
  
  if (hasBooking) {
    addScore('booking', 0.7, 'Has booking/calendar block');
  }

  // Check for application flow (STRONG signal)
  const hasApplicationFlow = allBlocks.some(b => b.type === 'application-flow');
  
  if (hasApplicationFlow) {
    addScore('application', 0.5, 'Has application flow');
    addScore('quiz', 0.3, 'Has application flow');
  }

  // Check for testimonials (Sales page indicator)
  const hasTestimonials = allBlocks.some(b => b.type === 'testimonial');
  
  if (hasTestimonials) {
    addScore('sales', 0.3, 'Has testimonials');
    addScore('vsl', 0.2, 'Has testimonials');
  }

  // Check for pricing (Sales/Checkout indicator)
  const hasPricing = allBlocks.some(b => b.type === 'pricing');
  
  if (hasPricing) {
    addScore('sales', 0.4, 'Has pricing block');
    addScore('checkout', 0.2, 'Has pricing block');
  }

  // Check for hero sections (weak signal)
  const hasHero = allBlocks.some(b => b.type === 'hero');
  
  if (hasHero) {
    // Don't add signal - too generic
    scores['sales'] += 0.05;
    scores['optin'] += 0.05;
  }

  // Check for FAQ (Sales indicator)
  const hasFAQ = allBlocks.some(b => b.type === 'faq');
  
  if (hasFAQ) {
    addScore('sales', 0.2, 'Has FAQ section');
  }

  // Check step count (multi-step = quiz/application)
  if (page.steps.length >= 4) {
    addScore('quiz', 0.25, `Has ${page.steps.length} steps`);
    addScore('application', 0.25, `Has ${page.steps.length} steps`);
  } else if (page.steps.length >= 3) {
    scores['quiz'] += 0.1;
    scores['application'] += 0.1;
  }

  // VSL specific: Video + minimal form + urgency copy
  if (hasVideo && inputCount <= 1) {
    addScore('vsl', 0.3, 'Video-focused with minimal form (VSL pattern)');
  }

  // Webinar specific: Video + registration form
  if (hasVideo && inputCount >= 2 && inputCount <= 4) {
    addScore('webinar', 0.3, 'Video with registration form (Webinar pattern)');
  }

  // Find the highest scoring type
  let maxType: FunnelType = 'general';
  let maxScore = 0;
  
  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxType = type as FunnelType;
    }
  }

  // Normalize confidence to 0-1 range (cap at 1)
  const confidence = Math.min(maxScore, 1);

  // PHASE 14 FIX: Apply confidence threshold and signal count requirement
  // If confidence is too low OR we don't have enough signals, default to "general"
  const typeSignals = signalDetails.get(maxType) || [];
  const shouldDefaultToGeneral = 
    maxType !== 'general' && (
      confidence < CONFIDENCE_THRESHOLD || 
      typeSignals.length < MIN_SIGNALS_FOR_CLASSIFICATION
    );

  if (shouldDefaultToGeneral) {
    return {
      type: 'general',
      confidence: confidence,
      signals: signals,
      isUncertain: true,
      rawType: maxType, // The type we would have returned if confident
    } as FunnelTypeResult;
  }

  return {
    type: maxType,
    confidence,
    signals,
  };
}

/**
 * Get funnel type description for AI context
 */
export function getFunnelTypeDescription(type: FunnelType): string {
  const descriptions: Record<FunnelType, string> = {
    'vsl': 'Video Sales Letter - Focus on urgency, scarcity, video-centric CTAs, emotional triggers',
    'webinar': 'Webinar Registration - Date/time focused, social proof, registration language, educational value',
    'optin': 'Opt-in/Lead Capture - Value exchange, benefit headlines, minimal friction, clear offer',
    'sales': 'Sales/Landing Page - Feature-benefit, testimonials, objection handling, trust building',
    'booking': 'Booking/Scheduling - Calendar-focused, availability, confirmation, next steps',
    'quiz': 'Quiz/Survey - Progressive disclosure, personalization, curiosity-driven, results-focused',
    'application': 'Application Flow - Qualification questions, multi-step, commitment building',
    'checkout': 'Checkout/Payment - Security, urgency, order summary, payment options',
    'thank-you': 'Thank You/Confirmation - Gratitude, next steps, upsell opportunity, social share',
    'general': 'General Landing Page - Balanced approach, clear value proposition, strong CTA',
  };
  
  return descriptions[type];
}

/**
 * Extract existing block types from page (for coherence)
 */
export function extractExistingBlockTypes(page: Page): string[] {
  const allBlocks: Block[] = page.steps.flatMap(step => extractBlocksFromStep(step));
  return [...new Set(allBlocks.map(b => b.type))];
}

/**
 * Check if page has specific content types
 */
export function analyzePageContent(page: Page): {
  hasVideo: boolean;
  hasForm: boolean;
  hasCTA: boolean;
  hasTestimonials: boolean;
  hasPricing: boolean;
} {
  const allBlocks: Block[] = page.steps.flatMap(step => extractBlocksFromStep(step));
  const allElements: Element[] = allBlocks.flatMap(b => b.elements || []);

  return {
    hasVideo: allElements.some(e => e.type === 'video'),
    hasForm: allElements.some(e => ['input', 'select', 'checkbox', 'radio'].includes(e.type)),
    hasCTA: allElements.some(e => e.type === 'button'),
    hasTestimonials: allBlocks.some(b => b.type === 'testimonial'),
    hasPricing: allBlocks.some(b => b.type === 'pricing'),
  };
}
