// InfoStack Data Contract - The single source of truth for the builder

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
  | 'single-choice';

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
  | 'divider';

// Conditional visibility rule
export interface ConditionalRule {
  field: string;       // Field key of input element
  operator: 'equals' | 'notEquals' | 'contains' | 'notEmpty' | 'isEmpty';
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
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  threshold: number;        // 0-1, for scroll trigger
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

// Extended responsive overrides with typography
export interface ResponsiveTypography {
  fontSize?: string;
  lineHeight?: string;
  letterSpacing?: string;
}

export interface ResponsiveOverrides {
  desktop?: Partial<ElementStateStyles> & ResponsiveTypography;
  tablet?: Partial<ElementStateStyles> & ResponsiveTypography;
  mobile?: Partial<ElementStateStyles> & ResponsiveTypography;
}

// Page background settings (Framer-level control)
export interface PageBackground {
  type: 'solid' | 'gradient' | 'image';
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

export type FrameBackgroundType = 'transparent' | 'white' | 'dark' | 'glass' | 'custom' | 'gradient' | 'image';

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
  };
}

export interface Page {
  id: string;
  name: string;
  slug: string;
  steps: Step[];
  settings: {
    theme?: 'light' | 'dark';
    font_family?: string;
    primary_color?: string;
    page_background?: PageBackground;
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
  type: 'page' | 'step' | 'frame' | 'stack' | 'block' | 'element' | null;
  id: string | null;
  path: string[];
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
  fontSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
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
}

// Block action operations
export interface BlockAction {
  type: 'move-up' | 'move-down' | 'duplicate' | 'delete' | 'add-above' | 'add-below';
  blockId: string;
  stackId?: string;
}
