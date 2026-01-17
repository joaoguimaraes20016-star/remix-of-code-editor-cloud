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
export function detectFunnelType(page: Page): FunnelTypeResult {
  const signals: string[] = [];
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

  // Analyze step intents (using correct StepIntent type)
  const stepIntents = page.steps.map(s => s.step_intent);
  const stepTypes = page.steps.map(s => s.step_type);
  
  // Check step types for funnel indicators
  if (stepTypes.includes('checkout')) {
    scores['checkout'] += 0.8;
    signals.push('Has checkout step');
  }
  
  if (stepTypes.includes('thankyou')) {
    scores['thank-you'] += 0.8;
    signals.push('Has thank you step');
  }
  
  if (stepTypes.includes('booking')) {
    scores['booking'] += 0.6;
    signals.push('Has booking step');
  }
  
  if (stepTypes.includes('quiz')) {
    scores['quiz'] += 0.6;
    signals.push('Has quiz step');
  }
  
  // Check step intents
  if (stepIntents.includes('capture')) {
    scores['optin'] += 0.4;
    signals.push('Has capture intent');
  }
  
  if (stepIntents.includes('convert')) {
    scores['sales'] += 0.3;
    scores['checkout'] += 0.3;
    signals.push('Has convert intent');
  }
  
  if (stepIntents.includes('schedule')) {
    scores['booking'] += 0.5;
    scores['webinar'] += 0.3;
    signals.push('Has schedule intent');
  }

  // Analyze all blocks across all steps
  const allBlocks: Block[] = page.steps.flatMap(step => extractBlocksFromStep(step));
  const allElements: Element[] = allBlocks.flatMap(b => b.elements || []);

  // Check for video presence (VSL/Webinar indicator)
  const hasVideo = allElements.some(e => e.type === 'video') || 
                   allBlocks.some(b => b.type === 'media' && b.elements?.some(e => e.type === 'video'));
  
  if (hasVideo) {
    scores['vsl'] += 0.4;
    scores['webinar'] += 0.3;
    signals.push('Contains video content');
  }

  // Check for forms/inputs
  const inputCount = allElements.filter(e => 
    e.type === 'input' || e.type === 'select' || e.type === 'checkbox' || e.type === 'radio'
  ).length;
  
  if (inputCount >= 3) {
    scores['optin'] += 0.3;
    scores['application'] += 0.4;
    signals.push(`Has ${inputCount} form inputs`);
  } else if (inputCount >= 1) {
    scores['optin'] += 0.2;
    signals.push('Has form input');
  }

  // Check for multiple choice (Quiz indicator)
  const hasMultipleChoice = allElements.some(e => 
    e.type === 'multiple-choice' || e.type === 'single-choice'
  );
  
  if (hasMultipleChoice) {
    scores['quiz'] += 0.6;
    scores['application'] += 0.3;
    signals.push('Has multiple choice questions');
  }

  // Check for booking/calendar
  const hasBooking = allBlocks.some(b => b.type === 'booking');
  
  if (hasBooking) {
    scores['booking'] += 0.7;
    signals.push('Has booking/calendar block');
  }

  // Check for application flow
  const hasApplicationFlow = allBlocks.some(b => b.type === 'application-flow');
  
  if (hasApplicationFlow) {
    scores['application'] += 0.6;
    signals.push('Has application flow');
  }

  // Check for testimonials (Sales page indicator)
  const hasTestimonials = allBlocks.some(b => b.type === 'testimonial');
  
  if (hasTestimonials) {
    scores['sales'] += 0.3;
    scores['vsl'] += 0.2;
    signals.push('Has testimonials');
  }

  // Check for pricing (Sales/Checkout indicator)
  const hasPricing = allBlocks.some(b => b.type === 'pricing');
  
  if (hasPricing) {
    scores['sales'] += 0.4;
    scores['checkout'] += 0.2;
    signals.push('Has pricing block');
  }

  // Check for hero sections
  const hasHero = allBlocks.some(b => b.type === 'hero');
  
  if (hasHero) {
    scores['sales'] += 0.1;
    scores['optin'] += 0.1;
    signals.push('Has hero section');
  }

  // Check for FAQ
  const hasFAQ = allBlocks.some(b => b.type === 'faq');
  
  if (hasFAQ) {
    scores['sales'] += 0.2;
    signals.push('Has FAQ section');
  }

  // Check step count (multi-step = quiz/application)
  if (page.steps.length >= 3) {
    scores['quiz'] += 0.2;
    scores['application'] += 0.2;
    signals.push(`Has ${page.steps.length} steps`);
  }

  // VSL specific: Video + minimal form + urgency copy
  if (hasVideo && inputCount <= 2) {
    scores['vsl'] += 0.3;
    signals.push('Video-focused with minimal form (VSL pattern)');
  }

  // Webinar specific: Video + registration form
  if (hasVideo && inputCount >= 2) {
    scores['webinar'] += 0.3;
    signals.push('Video with registration form (Webinar pattern)');
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
