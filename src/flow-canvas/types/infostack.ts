// Stackit Data Contract - The single source of truth for the builder

// Import shared types
import type { ButtonAction } from '@/flow-canvas/shared/types/buttonAction';
import type { StyleTokens } from '@/builder/tokens';

export type StepIntent = 'capture' | 'qualify' | 'schedule' | 'convert' | 'complete';
export type StepType = 'form' | 'content' | 'quiz' | 'booking' | 'checkout' | 'thankyou';
export type SubmitMode = 'next' | 'submit' | 'redirect' | 'custom';

// Element types - primary types used by canvas renderer
export type ElementType = 
  | 'text' 
  | 'heading' 
  | 'button' 
  | 'input' 
  | 'select' 
  | 'checkbox' 
  | 'radio' 
  | 'image' 
  | 'video' 
  | 'divider'
  | 'spacer'
  | 'icon'
  | 'link'
  // Extended types for flexibility
  | 'multiple-choice'
  | 'single-choice'
  // Premium elements for high-converting funnels
  | 'gradient-text'      // Text with gradient fill (bold accent phrases)
  | 'underline-text'     // Text with custom styled underline
  | 'stat-number'        // Large animated numbers (9,943+)
  | 'avatar-group'       // Overlapping avatar circles for social proof
  | 'ticker'             // Scrolling marquee text
  | 'badge'              // Pill badge with optional icon
  | 'icon-text'          // Icon + text pair
  | 'process-step'       // Step in a process visualization
  | 'video-thumbnail'    // Video with styled play overlay
  // Functional elements (fully interactive)
  | 'countdown'          // Live countdown timer with expiration actions
  | 'loader'             // Animated loading/progress indicator
  | 'carousel'           // Image carousel with navigation
  | 'logo-marquee'       // Animated scrolling logo bar
  | 'map-embed'          // Google Maps embed
  | 'html-embed'         // Custom HTML/code embed
  | 'trustpilot';        // Trustpilot review widget

// Block types - core types actively used in builder
export type BlockType = 
  | 'hero' 
  | 'form-field' 
  | 'cta' 
  | 'testimonial' 
  | 'media'
  | 'text-block'
  | 'custom'
  | 'booking'
  | 'application-flow'  // Flow Container: Typeform-style multi-step experience (SINGLE SOURCE OF TRUTH)
  | 'capture-flow-embed' // @deprecated - Use 'application-flow' instead. Kept for backwards compatibility only.
  // Extended types for section templates
  | 'feature'
  | 'pricing'
  | 'faq'
  | 'about'
  | 'team'
  | 'trust'
  | 'logo-bar'
  | 'footer'
  | 'contact'
  | 'spacer'
  | 'divider'
  // Premium block types for high-converting funnels
  | 'credibility-bar'    // Avatar group + "From the team who..." text
  | 'stats-row'          // Row of large stat numbers
  | 'process-flow'       // Step 1 → Step 2 → Step 3 visualization
  | 'urgency-banner'     // Top banner with countdown or promo
  | 'ticker-bar'         // Scrolling marquee with key points
  | 'video-hero'         // Hero section centered on video
  | 'split-hero'         // Left text, right media layout
  | 'guarantee';         // Risk reversal / guarantee section

/**
 * @deprecated Use ApplicationStepType from '@/flow-canvas/shared/types/applicationEngine' instead.
 * 
 * MIGRATION: The unified Flow Container system uses ApplicationEngine.
 * Import { ApplicationStepType } from '@/flow-canvas/shared/types/applicationEngine';
 */
export type ApplicationStepType = 'welcome' | 'question' | 'capture' | 'booking' | 'ending';

/**
 * @deprecated Use choice types from ApplicationEngine instead.
 * MIGRATION: See ApplicationStepChoice in '@/flow-canvas/shared/types/applicationEngine'.
 */
export type QuestionType = 'multiple-choice' | 'text' | 'dropdown' | 'scale' | 'yes-no';

// Capture field icon types - Lucide icons
export type CaptureIconType = 'user' | 'user-circle' | 'mail' | 'at-sign' | 'phone' | 'smartphone' | 'none';

// Settings for individual Application Flow steps
export interface ApplicationFlowStepSettings {
  title?: string;
  description?: string;
  buttonText?: string;
  // Button preset - references shared Button system (primary, secondary, outline, ghost)
  buttonPreset?: 'primary' | 'secondary' | 'outline' | 'ghost';
  questionType?: QuestionType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  collectName?: boolean;
  collectEmail?: boolean;
  collectPhone?: boolean;
  align?: 'left' | 'center' | 'right';
  spacing?: 'compact' | 'normal' | 'relaxed';
  inputStyle?: 'default' | 'minimal' | 'rounded' | 'square' | 'pill';
  titleSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  titleColor?: string;
  titleColorType?: 'solid' | 'gradient';
  titleGradient?: {
    type: 'linear' | 'radial';
    angle: number;
    stops: Array<{ color: string; position: number }>;
  };
  descriptionSize?: 'xs' | 'sm' | 'base' | 'lg';
  descriptionColor?: string;
  descriptionColorType?: 'solid' | 'gradient';
  descriptionGradient?: {
    type: 'linear' | 'radial';
    angle: number;
    stops: Array<{ color: string; position: number }>;
  };
  // Scale question type settings
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  // Answer/option styling
  answerBgColor?: string;
  answerBorderColor?: string;
  answerSelectedColor?: string;
  // Background gradient support
  backgroundType?: 'solid' | 'gradient';
  backgroundColor?: string;
  backgroundGradient?: {
    type: 'linear' | 'radial';
    angle: number;
    stops: Array<{ color: string; position: number }>;
  };
  // Popup opt-in settings (for Contact Info Opt-In blocks)
  showAsPopup?: boolean;
  requireCompletion?: boolean;
  popupHeadline?: string;
  popupSubtext?: string;
  // Button action configuration - uses shared ButtonAction type
  buttonAction?: ButtonAction;
  // Capture step per-field customization
  captureNamePlaceholder?: string;
  captureEmailPlaceholder?: string;
  capturePhonePlaceholder?: string;
  captureNameIcon?: CaptureIconType;
  captureEmailIcon?: CaptureIconType;
  capturePhoneIcon?: CaptureIconType;
  // Privacy checkbox settings
  showPrivacyCheckbox?: boolean;
  privacyText?: string;
  privacyUrl?: string;
}

export interface ApplicationFlowStep {
  id: string;
  name: string;
  type: ApplicationStepType;
  elements: Element[];
  settings?: ApplicationFlowStepSettings;
  /**
   * @deprecated Use settings.buttonAction instead for button navigation.
   * This property is kept for backwards compatibility.
   */
  navigation: {
    action: 'next' | 'go-to-step' | 'submit' | 'redirect';
    targetStepId?: string;
    redirectUrl?: string;
  };
}

// Background value type for Application Flow (same structure as BackgroundValue)
export interface ApplicationFlowBackground {
  type: 'solid' | 'gradient' | 'image' | 'video';
  color?: string;
  gradient?: {
    type: 'linear' | 'radial';
    angle: number;
    stops: Array<{ color: string; position: number }>;
  };
  imageUrl?: string;
  videoUrl?: string;
  videoAutoplay?: boolean;
  videoLoop?: boolean;
  videoMuted?: boolean;
  videoOpacity?: number; // 0-100, default 100
}

export interface ApplicationFlowSettings {
  displayMode: 'one-at-a-time' | 'all-visible';
  showProgress: boolean;
  steps: ApplicationFlowStep[];
  // Independent styling (not affected by global light/dark theme)
  background?: ApplicationFlowBackground;
  textColor?: string;
  inputBackground?: string;
  inputBorderColor?: string;
  // Design preset - provides default styling (user can override everything)
  designPreset?: 'none' | 'minimal' | 'card' | 'glass' | 'full-bleed';
  // Container styling
  contentWidth?: 'sm' | 'md' | 'lg' | 'full';
  contentAlign?: 'left' | 'center' | 'right';
  containerPadding?: number;
  containerRadius?: number;
  containerBorderColor?: string;
  containerShadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  // Glass-specific
  backdropBlur?: number;
}

// Conditional visibility rule
export interface ConditionalRule {
  field: string;       // Field key of input element
  operator: 'equals' | 'notEquals' | 'contains' | 'notEmpty' | 'isEmpty' | 'greaterThan' | 'lessThan';
  value: string;       // Expected value
  action: 'show' | 'hide';
}

// Visibility settings for conditional logic
export interface VisibilitySettings {
  conditions: ConditionalRule[];
  logic: 'and' | 'or';
}

// Animation settings for scroll-triggered animations
export interface AnimationSettings {
  effect: string;           // 'fade-in', 'slide-up', etc.
  trigger: 'load' | 'scroll' | 'hover';
  delay: number;            // ms
  duration: number;         // ms
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' | 'spring';
  threshold: number;        // 0-1, for scroll trigger
  // Phase 6: Custom spring physics
  springStiffness?: number;   // 50-500, default 300
  springDamping?: number;     // 5-50, default 30
  springMass?: number;        // 0.5-5, default 1
  // Scroll animation enhancements
  scrollOffset?: number;      // px offset before trigger
  exitAnimation?: boolean;    // animate on exit
  repeat?: boolean;           // repeat on re-entry
  // Phase 2: Scroll Transform Binding
  scrollTransform?: {
    enabled: boolean;
    property: 'opacity' | 'scale' | 'translateY' | 'translateX' | 'rotate';
    startValue: number;       // Value at bottom of viewport
    endValue: number;         // Value at top of viewport
  };
}

// State-based styling for Framer-like control
export type ElementState = 'base' | 'hover' | 'active' | 'disabled' | 'focus';

// Transition easing presets
export type TransitionEasing = 
  | 'ease' 
  | 'ease-in' 
  | 'ease-out' 
  | 'ease-in-out' 
  | 'linear'
  | 'spring'      // cubic-bezier(0.175, 0.885, 0.32, 1.275)
  | 'bounce'      // cubic-bezier(0.68, -0.55, 0.265, 1.55)
  | 'smooth';     // cubic-bezier(0.4, 0, 0.2, 1)

export interface ElementStateStyles {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: string;
  opacity?: string;
  transform?: string;
  shadow?: string;
  scale?: string;
  // Transition settings for smooth state changes
  transitionDuration?: string;    // e.g., '300ms', '0.3s'
  transitionEasing?: TransitionEasing;
  transitionDelay?: string;       // e.g., '0ms', '100ms'
}

export interface ElementStyles {
  base: ElementStateStyles;
  hover?: ElementStateStyles;
  active?: ElementStateStyles;
  disabled?: ElementStateStyles;
  focus?: ElementStateStyles;
}

// Responsive styling per device
export type DeviceModeType = 'desktop' | 'tablet' | 'mobile';

// Comprehensive responsive overrides for all style properties
export interface ResponsiveStyleOverrides {
  // Typography
  fontSize?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: string;
  fontWeight?: string;
  
  // Colors (from ElementStateStyles)
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  opacity?: number | string;
  
  // Sizing
  width?: string;
  height?: string;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;
  
  // Spacing - Padding
  padding?: string;
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
  
  // Spacing - Margin
  margin?: string;
  marginTop?: string;
  marginBottom?: string;
  marginLeft?: string;
  marginRight?: string;
  
  // Layout - Flexbox
  display?: string;
  flexDirection?: string;
  flexWrap?: string;
  justifyContent?: string;
  alignItems?: string;
  gap?: string;
  flexGrow?: number;
  flexShrink?: number;
  
  // Layout - Grid
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  columnGap?: string;
  rowGap?: string;
  justifyItems?: string;
  
  // Borders
  borderWidth?: string;
  borderRadius?: string;
  borderStyle?: string;
  
  // Position
  position?: string;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  zIndex?: number;
  
  // Transform
  transform?: string;
  scale?: number;
  
  // Allow arbitrary additional properties
  [key: string]: unknown;
}

// Legacy alias for backward compatibility
export type ResponsiveTypography = Pick<ResponsiveStyleOverrides, 'fontSize' | 'lineHeight' | 'letterSpacing'>;

export interface ResponsiveOverrides {
  desktop?: ResponsiveStyleOverrides;
  tablet?: ResponsiveStyleOverrides;
  mobile?: ResponsiveStyleOverrides;
}

// Background pattern configuration for premium designs
export interface BackgroundPattern {
  type: 'grid' | 'dots' | 'noise' | 'lines';
  color: string;
  opacity: number;
  size?: number;  // Pattern size in px
}

// Page background settings (Framer-level control)
export interface PageBackground {
  type: 'solid' | 'gradient' | 'image' | 'pattern' | 'video';
  color?: string;
  gradient?: {
    type: 'linear' | 'radial';
    angle: number;
    stops: Array<{ color: string; position: number }>;
  };
  image?: string;
  blur?: number;
  overlay?: string;
  overlayOpacity?: number;
  // Premium pattern overlay
  pattern?: BackgroundPattern;
  // Video background settings
  video?: string;
  videoAutoplay?: boolean;
  videoLoop?: boolean;
  videoMuted?: boolean;
  videoOpacity?: number; // 0-100, default 100
}

// Block animation with stagger support
export interface BlockAnimationSettings {
  effect: string;
  trigger: 'load' | 'scroll';
  delay: number;
  duration: number;
  stagger?: {
    enabled: boolean;
    delay: number;
  };
}

export interface Element {
  id: string;
  type: ElementType;
  content?: string;
  props: Record<string, unknown>;
  styles?: Record<string, string>;
  visibility?: VisibilitySettings;
  animation?: AnimationSettings;
  stateStyles?: ElementStyles;
  responsive?: ResponsiveOverrides;
  /**
   * Style tokens for guaranteed 1:1 style mapping.
   * When set, these take precedence over legacy prop-based styling.
   */
  tokens?: StyleTokens;
}

export interface Block {
  id: string;
  type: BlockType;
  label: string;
  elements: Element[];
  props: Record<string, unknown>;
  styles?: Record<string, string>;
  animation?: BlockAnimationSettings;
}

export interface Stack {
  id: string;
  label: string;
  direction: 'vertical' | 'horizontal';
  blocks: Block[];
  props: Record<string, unknown>;
  styles?: Record<string, string>;
}

export type FrameBackgroundType = 'transparent' | 'white' | 'dark' | 'glass' | 'custom' | 'gradient' | 'image' | 'video';

// Frame layout width options
export type FrameLayout = 'contained' | 'full-width';

// Glassmorphism settings
export interface GlassmorphismSettings {
  backdropBlur?: number;         // 0-30 px
  glassTint?: string;            // color with alpha
  glassTintOpacity?: number;     // 0-100
}

// Custom shadow settings for Figma-like control
export interface ShadowLayer {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  inset?: boolean;
}

export interface CustomShadowSettings {
  layers: ShadowLayer[];
}

export interface Frame {
  id: string;
  label: string;
  stacks: Stack[];
  props: Record<string, unknown>;
  styles?: Record<string, string>;
  // Frame layout - contained (centered box) or full-width (edge-to-edge)
  layout?: FrameLayout;
  // Spacing controls
  paddingVertical?: number;      // 16-64px, default 32
  paddingHorizontal?: number;    // 16-64px, default 32
  blockGap?: number;             // 8-32px, default 12
  maxWidth?: number;             // 400-800px, default 520 (only applies when contained)
  // Frame-specific background settings
  background?: FrameBackgroundType;
  backgroundColor?: string;
  backgroundGradient?: {
    type: 'linear' | 'radial';
    angle: number;
    stops: Array<{ color: string; position: number }>;
  };
  backgroundImage?: string;
  // Video background settings
  backgroundVideo?: string;
  backgroundVideoAutoplay?: boolean;
  backgroundVideoLoop?: boolean;
  backgroundVideoMuted?: boolean;
  backgroundVideoOpacity?: number;
  // Glassmorphism
  glass?: GlassmorphismSettings;
  // Custom shadows
  customShadow?: CustomShadowSettings;
}

export interface Step {
  id: string;
  name: string;
  step_type: StepType;
  step_intent: StepIntent;
  submit_mode: SubmitMode;
  frames: Frame[];
  // Per-step background (overrides page background)
  background?: PageBackground;
  settings: {
    redirect_url?: string;
    validation_rules?: Record<string, unknown>;
    // Phase 14: Content area settings
    maxWidth?: string;
    minHeight?: string;
    verticalAlign?: 'top' | 'center' | 'bottom';
    // Phase 14: Background overlay
    overlayEnabled?: boolean;
    overlayColor?: string;
    overlayOpacity?: number;
    // Phase 14: Glass effects
    glassEnabled?: boolean;
    glassBlur?: number;
    glassTint?: string;
    // Phase 14: Scroll animation
    scrollAnimation?: 'none' | 'fade-in' | 'slide-up' | 'slide-left' | 'slide-right' | 'scale' | 'parallax';
    scrollDelay?: string;
    scrollDuration?: string;
  };
}

export interface Page {
  id: string;
  name: string;
  slug: string;
  steps: Step[];
  settings: {
    // Theme & styling
    theme?: 'light' | 'dark';
    font_family?: string;
    primary_color?: string;
    page_background?: PageBackground;
    
    // Branding
    logo_url?: string;
    favicon_url?: string;
    
    // SEO
    seo_title?: string;
    seo_description?: string;
    seo_image?: string;
    
    // Progress
    show_progress_bar?: boolean;
    
    // Pop-Up Gate
    popup_optin_enabled?: boolean;
    popup_optin_headline?: string;
    popup_optin_subtext?: string;
    popup_optin_fields?: ('name' | 'email' | 'phone')[];
    popup_optin_button_text?: string;
    
    // Tracking
    meta_pixel_id?: string;
    google_analytics_id?: string;
    google_ads_id?: string;
    tiktok_pixel_id?: string;
    
    // Integrations
    ghl_webhook_url?: string;
    zapier_webhook_url?: string;
    webhook_urls?: string[];
    
    // Misc
    button_text?: string;
    privacy_policy_url?: string;
    
    // Legacy
    meta?: {
      title?: string;
      description?: string;
      og_image?: string;
    };
  };
  created_at: string;
  updated_at: string;
}

// Selection state for the builder
export interface SelectionState {
  type: 'page' | 'step' | 'frame' | 'stack' | 'block' | 'element' | 'interactive-step' | null;
  id: string | null;
  path: string[];
  /** ID of the ApplicationEngine being edited */
  applicationEngineId?: string;
  /** Index of the currently selected step within the engine */
  stepIndex?: number;
  /** @deprecated Use 'interactive-step' type instead */
  captureFlowId?: string;
}

// Builder props contract
export interface BuilderProps {
  initialState: Page;
  onChange: (updatedState: Page) => void;
  onSelect: (selection: SelectionState) => void;
  onPublish?: (page: Page) => void;
  readOnly?: boolean;
}

// AI Copilot types
export interface AIsuggestion {
  id: string;
  type: 'step' | 'copy' | 'layout' | 'next-action';
  title: string;
  description: string;
  preview?: Partial<Step | Block>;
  confidence: number;
}

export interface AICopilotProps {
  currentPage: Page;
  selection: SelectionState;
  onApplySuggestion: (suggestion: AIsuggestion) => void;
}

// Text styling for inline editor (extended for Framer-level features)
export interface TextStyles {
  fontSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | string;
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold' | 'black' | number;
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  textAlign: 'left' | 'center' | 'right';
  fontFamily?: string;
  textColor?: string;
  textFillType?: 'solid' | 'gradient';
  textGradient?: {
    type: 'linear' | 'radial';
    angle: number;
    stops: Array<{ color: string; position: number }>;
  };
  textShadow?: string;
  highlightColor?: string;
  highlightGradient?: {
    type: 'linear' | 'radial';
    angle: number;
    stops: Array<{ color: string; position: number }>;
  };
  highlightUseGradient?: boolean;
  // Phase 3: Advanced typography controls
  letterSpacing?: string; // e.g., '-0.02em', '0.1em'
  lineHeight?: string | number; // e.g., '1.5', '2'
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textStrokeWidth?: string; // e.g., '1px', '2px'
  textStrokeColor?: string;
}

// Block action operations
export interface BlockAction {
  type: 'move-up' | 'move-down' | 'duplicate' | 'delete' | 'add-above' | 'add-below';
  blockId: string;
  stackId?: string;
}

// ============================================================================
// LEGACY APPLICATION FLOW TYPES
// ============================================================================
// @deprecated - These types are DEPRECATED and kept ONLY for backwards compatibility.
// 
// MIGRATION GUIDE:
// ────────────────
// 1. Use ApplicationEngine from '@/flow-canvas/shared/types/applicationEngine'
// 2. The unified system is called "Flow Container" in the UI
// 3. All interactive blocks (inputs, choices, buttons) share ONE styling system
// 4. Actions are: 'next', 'go-to-step', 'submit', 'redirect'
//
// DO NOT use these types for new code.
// ============================================================================

/** @deprecated Use ApplicationStepNavigation from applicationEngine.ts */
export interface StepNavigation {
  action: 'next' | 'go-to-step' | 'submit' | 'redirect';
  targetStepId?: string;
  redirectUrl?: string;
  submitAndContinue?: boolean;
}

/** @deprecated Use ApplicationStep from applicationEngine.ts */
export interface ApplicationStep {
  id: string;
  type: ApplicationStepType;
  label: string;
  elements: Element[];
  navigation: StepNavigation;
  required?: boolean;
  skipCondition?: ConditionalRule[];
}

/** @deprecated Use ApplicationEngine from applicationEngine.ts */
export interface ApplicationFlow {
  id: string;
  type: 'application-flow';
  displayMode: 'one-at-a-time' | 'all-visible';
  showProgress: boolean;
  transitionEffect: 'slide-up' | 'slide-left' | 'fade' | 'none';
  steps: ApplicationStep[];
  progressStyle?: 'bar' | 'dots' | 'fraction' | 'none';
}

/** @deprecated Step type labels are now handled by the unified label system */
export const applicationStepTypeLabels: Record<ApplicationStepType, string> = {
  welcome: 'Welcome Screen',
  question: 'Question',
  capture: 'Contact Info',
  booking: 'Book a Call',
  ending: 'Thank You',
};

// Helper to get step type icon name
export const applicationStepTypeIcons: Record<ApplicationStepType, string> = {
  welcome: 'Sparkles',
  question: 'HelpCircle',
  capture: 'UserPlus',
  booking: 'Calendar',
  ending: 'CheckCircle2',
};
