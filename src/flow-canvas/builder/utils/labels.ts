// Human-readable labels for all builder types
// This file maps internal developer terminology to user-friendly display text
//
// ARCHITECTURE NOTE:
// - Frame = "Section" in UI (visual container)
// - Block = Content group that holds Elements
// - Element = Atomic content unit (text, button, input, etc.)
//
// Section-level types (hero, footer, etc.) are FRAME TEMPLATES.
// spacer, divider, faq are ELEMENTS - use a 'custom' block to contain them.

import { BlockType, ElementType, StepIntent, StepType, SubmitMode, FrameTemplateType } from '../../types/infostack';

// Frame template types - these create full sections (Frames)
// Used for "Add Section" UI but stored as BlockType for backwards compatibility
const frameTemplateTypes = new Set<string>([
  'hero', 'cta', 'about', 'testimonial', 'feature', 'pricing', 'faq',
  'team', 'trust', 'footer', 'contact', 'custom',
  'credibility-bar', 'stats-row', 'process-flow', 'urgency-banner',
  'ticker-bar', 'video-hero', 'split-hero', 'guarantee'
]);

// Content block types - these go inside Frames
const contentBlockTypes = new Set<string>([
  'form-field', 'cta', 'testimonial', 'media', 'text-block', 
  'custom', 'booking', 'application-flow', 'logo-bar'
]);

// Block type labels - NO "Section" in content block names
export const blockTypeLabels: Record<BlockType, string> = {
  // Core content blocks
  'form-field': 'Input Fields',
  cta: 'Call to Action',
  testimonial: 'Testimonial',
  media: 'Media',
  'text-block': 'Text',
  custom: 'Content Block',
  booking: 'Booking',
  'application-flow': 'Multi-Step',
  'capture-flow-embed': 'Multi-Step',  // @deprecated
  // Section template types (Frame templates)
  hero: 'Hero',
  feature: 'Feature',
  pricing: 'Pricing',
  faq: 'FAQ',
  about: 'About',
  team: 'Team',
  trust: 'Trust Badges',
  'logo-bar': 'Logo Bar',
  footer: 'Footer',
  contact: 'Contact',
  // Premium section templates
  'credibility-bar': 'Credibility Bar',
  'stats-row': 'Stats Row',
  'process-flow': 'Process Flow',
  'urgency-banner': 'Urgency Banner',
  'ticker-bar': 'Ticker Bar',
  'video-hero': 'Video Hero',
  'split-hero': 'Split Hero',
  guarantee: 'Guarantee',
};

// Check if a block type is a Frame template (section) vs content block
export const isFrameTemplate = (type: BlockType): boolean => frameTemplateTypes.has(type);

// Legacy alias for backwards compatibility
export const isSectionType = isFrameTemplate;

// Get the category for a block type
// "Section" for frame templates, "Content" for content blocks
export const getBlockCategory = (type: BlockType): 'Section' | 'Content' => {
  return frameTemplateTypes.has(type) ? 'Section' : 'Content';
};

// Content blocks should NOT show layout controls (Direction, Justify, Align, etc.)
// Layout controls belong at the Frame (Section) level, not Block level
export const shouldShowLayoutControls = (type: BlockType): boolean => {
  // Only show layout controls for actual content container blocks
  // Pure content blocks like text-block, media, form-field don't need them
  const contentOnlyTypes = new Set(['text-block', 'media', 'form-field', 'cta', 'testimonial']);
  return !contentOnlyTypes.has(type);
};

// Element type labels - atomic content units
export const elementTypeLabels: Record<ElementType, string> = {
  text: 'Text',
  heading: 'Heading',
  button: 'Button',
  input: 'Text Input',
  select: 'Select Menu',
  checkbox: 'Checkbox',
  radio: 'Radio Button',
  image: 'Image',
  video: 'Video',           // Use displayMode: 'thumbnail' for video thumbnails
  divider: 'Divider',
  spacer: 'Spacer',
  icon: 'Icon',
  link: 'Link',
  'multiple-choice': 'Multiple Choice',
  'single-choice': 'Single Choice',
  // Premium element types
  'gradient-text': 'Gradient Text',
  'underline-text': 'Underline Text',
  'stat-number': 'Stat Number',
  'avatar-group': 'Avatar Group',
  ticker: 'Ticker',
  badge: 'Badge',
  'icon-text': 'Icon Text',
  'process-step': 'Process Step',
  // Functional element types
  countdown: 'Countdown Timer',
  loader: 'Loader',
  carousel: 'Image Carousel',
  'logo-marquee': 'Logo Bar',
  'map-embed': 'Google Maps',
  'html-embed': 'HTML Embed',
  trustpilot: 'Trustpilot Widget',
  faq: 'FAQ Accordion',
};

// Step intent labels - User-friendly, not system terminology
export const stepIntentLabels: Record<StepIntent, string> = {
  capture: 'Collect Info',
  qualify: 'Questions',
  schedule: 'Booking',
  convert: 'Checkout',
  complete: 'Thank You',
};

// Step intent descriptions - Explain what users see, not system behavior
export const stepIntentDescriptions: Record<StepIntent, string> = {
  capture: 'Fields to collect contact details',
  qualify: 'Questions to learn about visitors',
  schedule: 'Calendar to book appointments',
  convert: 'Payment or signup form',
  complete: 'Confirmation message',
};

// Step type labels
export const stepTypeLabels: Record<StepType, string> = {
  form: 'Form',
  content: 'Content',
  quiz: 'Quiz',
  booking: 'Booking',
  checkout: 'Checkout',
  thankyou: 'Thank You',
};

// Button action labels - user-facing, no internal terminology
export const submitModeLabels: Record<SubmitMode, string> = {
  next: 'Next Step',
  submit: 'Submit',
  redirect: 'Open URL',
  custom: 'Custom',
};

// Device mode labels
export const deviceModeLabels = {
  desktop: 'Desktop',
  tablet: 'Tablet',
  mobile: 'Mobile',
} as const;

// Get human-readable label for any block type
export const getBlockTypeLabel = (type: BlockType): string => {
  return blockTypeLabels[type] || formatLabel(type);
};

// Get human-readable label for any element type
export const getElementTypeLabel = (type: ElementType): string => {
  return elementTypeLabels[type] || formatLabel(type);
};

// Get human-readable label for any step intent
export const getStepIntentLabel = (intent: StepIntent): string => {
  return stepIntentLabels[intent] || formatLabel(intent);
};

// Get human-readable label for any step type
export const getStepTypeLabel = (type: StepType): string => {
  return stepTypeLabels[type] || formatLabel(type);
};

// Format any string label (fallback for unknown types)
export const formatLabel = (text: string): string => {
  return text
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Format page name for display (remove slashes, capitalize)
export const formatPageName = (name: string): string => {
  if (!name) return 'Untitled Page';
  
  // Remove leading slashes
  const cleanName = name.replace(/^\/+/, '');
  
  // If empty after cleanup, return Home
  if (!cleanName) return 'Home';
  
  // Format the name
  return formatLabel(cleanName);
};

// Format timestamp to relative time
export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return then.toLocaleDateString();
};

// Cursor options with labels
export const cursorOptions = [
  { value: 'default', label: 'Default' },
  { value: 'pointer', label: 'Pointer' },
  { value: 'grab', label: 'Grab' },
  { value: 'text', label: 'Text' },
  { value: 'move', label: 'Move' },
  { value: 'not-allowed', label: 'Not Allowed' },
  { value: 'crosshair', label: 'Crosshair' },
];

// Overflow options with labels
export const overflowOptions = [
  { value: 'visible', label: 'Visible' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'scroll', label: 'Scroll' },
  { value: 'auto', label: 'Auto' },
];
