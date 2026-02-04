// Core Funnel Types
export type StepType = 'capture' | 'sell' | 'book' | 'educate' | 'result';

export type BlockType = 
  // Core Components
  | 'heading'
  | 'text'
  | 'image'
  | 'list'
  | 'divider'
  | 'logo-bar'
  | 'reviews'
  // Media Elements
  | 'video'
  | 'slider'
  | 'graphic'
  | 'testimonial-slider'
  // Informative Blocks
  | 'webinar'
  | 'accordion'
  | 'countdown'
  | 'loader'
  // Embed Blocks
  | 'embed'
  // Conversion (internal use)
  | 'button'
  | 'form'
  | 'email-capture'
  | 'phone-capture'
  | 'calendar'
  // Layout
  | 'columns'
  | 'card'
  | 'spacer'
  // Advanced
  | 'quiz'
  | 'social-proof'
  // Interactive - Questions
  | 'multiple-choice'
  | 'choice'
  | 'image-quiz'
  | 'video-question'
  // Interactive - Forms
  | 'upload'
  | 'message'
  | 'date-picker'
  | 'dropdown'
  | 'payment'
  // Popup
  | 'popup-form';

export type ViewportType = 'mobile' | 'tablet' | 'desktop';

// Animation type with all supported animations
export type AnimationType = 
  | 'none'
  | 'fade-in'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'scale-in'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'bounce'
  | 'pop'
  | 'blur-in';

export type AnimationDuration = 'fast' | 'normal' | 'slow';
export type AnimationEasing = 'ease' | 'ease-in' | 'ease-out' | 'spring';
export type AnimationTrigger = 'load' | 'scroll';

export interface BlockStyles {
  padding?: { top: number; right: number; bottom: number; left: number };
  margin?: { top: number; right: number; bottom: number; left: number };
  backgroundColor?: string;
  backgroundGradient?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shadowColor?: string; // Custom shadow color (e.g., '#000000', 'rgba(0,0,0,0.5)')
  textAlign?: 'left' | 'center' | 'right';
  animation?: AnimationType;
  animationDuration?: AnimationDuration; // Legacy - kept for backwards compatibility
  animationDurationMs?: number; // New: duration in milliseconds (100-2000)
  animationDelay?: number;
  animationEasing?: AnimationEasing;
  animationTrigger?: AnimationTrigger;
  animationLoop?: boolean; // Legacy - kept for backwards compatibility
  animationRepeat?: 1 | 2 | 3 | 'infinite'; // How many times to play (default: 1)
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
}

export interface TextStyles {
  fontSize?: number;
  fontWeight?: 300 | 400 | 500 | 600 | 700 | 800;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  color?: string;
  textGradient?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  linkUrl?: string;
  linkTarget?: '_self' | '_blank';
}

// Block Content Types
export interface HeadingContent {
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  styles?: TextStyles;
}

export interface TextContent {
  text: string;
  styles?: TextStyles;
}

export interface ImageContent {
  src: string;
  alt: string;
  aspectRatio?: '1:1' | '4:3' | '16:9' | 'auto';
  borderRadius?: number;
}

export interface VideoContent {
  src: string;
  type: 'youtube' | 'vimeo' | 'wistia' | 'loom' | 'hosted';
  autoplay?: boolean;
  controls?: boolean;
  aspectRatio?: '16:9' | '9:16' | '4:3' | '1:1';
  muted?: boolean;
  loop?: boolean;
}

export interface ButtonContent {
  text: string;
  variant: 'primary' | 'secondary' | 'ghost' | 'outline';
  size: 'sm' | 'md' | 'lg';
  action: 'next-step' | 'url' | 'scroll' | 'submit' | 'webhook';
  actionValue?: string; // URL for 'url' action, webhook URL for 'webhook' action
  fullWidth?: boolean;
  fontSize?: number;
  styles?: TextStyles;
  backgroundColor?: string;
  backgroundGradient?: string;
  color?: string;
  textGradient?: string;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  icon?: string;
  iconPosition?: 'left' | 'right';
  trackingId?: string;
}

// Popup/Modal settings for interactive blocks
export interface PopupSettings {
  enabled: boolean;
  trigger: 'on-load' | 'on-click' | 'on-delay';
  delay?: number; // seconds for on-delay trigger
  required?: boolean; // must complete before continuing
  triggerElementId?: string; // for on-click trigger
}

export interface FormFieldConfig {
  id: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For select fields
  trackingId?: string;
}

// Privacy consent settings for forms
export interface ConsentSettings {
  enabled: boolean;
  text: string; // e.g., "I have read and accept the"
  linkText: string; // e.g., "privacy policy"
  linkUrl: string; // URL to privacy policy page
  required: boolean;
  textColor?: string; // Color for consent text (contrast-aware)
}

export interface FormContent {
  title?: string; // Optional form heading (e.g., "Where can we reach you?")
  titleStyles?: TextStyles; // Styling for the title
  fields: FormFieldConfig[];
  // Submit button - uses ButtonContent for consistency (action includes webhook option)
  submitButton?: ButtonContent;
  // Privacy consent checkbox
  consent?: ConsentSettings;
  // Popup/Modal settings
  popupSettings?: PopupSettings;
  // Color properties for contrast awareness
  labelColor?: string; // Color for field labels
}

export interface EmailCaptureContent {
  placeholder: string;
  subtitle?: string;
  subtitleColor?: string;
  // Submit button - uses ButtonContent for consistency
  submitButton?: ButtonContent;
  // Privacy consent checkbox
  consent?: ConsentSettings;
  // Popup/Modal settings
  popupSettings?: PopupSettings;
}

// Country code configuration for phone inputs
export interface CountryCode {
  id: string;
  code: string; // e.g., "+1"
  name: string; // e.g., "United States"
  flag: string; // emoji flag, e.g., "🇺🇸"
}

export interface PhoneCaptureContent {
  placeholder: string;
  // Submit button - uses ButtonContent for consistency
  submitButton?: ButtonContent;
  // Privacy consent checkbox
  consent?: ConsentSettings;
  // Popup/Modal settings
  popupSettings?: PopupSettings;
  // Note: countryCodes are now global (stored in Funnel.countryCodes)
  // Color properties for contrast awareness
  subtitleColor?: string; // Color for subtitle/description text
}

// Compact social proof badge with overlapping avatars and rating
export interface ReviewsContent {
  avatars: string[]; // Array of avatar image URLs
  rating: number; // e.g., 4.8
  reviewCount: string; // e.g., "200+"
  // Style options
  starColor?: string;
  textColor?: string;
}

// Image slider testimonials with quote overlay
export interface TestimonialSliderContent {
  testimonials: {
    id: string;
    quote: string;
    authorName: string;
    authorTitle?: string;
    backgroundImage: string;
  }[];
  autoPlay?: boolean;
  interval?: number; // seconds between slides
}

export interface LogoBarContent {
  logos: { id: string; src: string; alt: string }[];
  title?: string;
  titleStyles?: TextStyles;
  // Animation properties for marquee effect
  animated?: boolean;
  speed?: 'slow' | 'medium' | 'fast';
  direction?: 'left' | 'right';
  pauseOnHover?: boolean;
  grayscale?: boolean;
}

export interface SocialProofContent {
  items: {
    id: string;
    value: number;
    label: string;
    suffix?: string;
  }[];
  // Style properties
  valueColor?: string;
  valueGradient?: string;
  valueFontSize?: number;
  labelColor?: string;
  labelGradient?: string;
  labelFontSize?: number;
  layout?: 'horizontal' | 'vertical';
  gap?: number;
}

export interface CountdownContent {
  endDate: string;
  showDays?: boolean;
  expiredText?: string;
  backgroundColor?: string;
  backgroundGradient?: string;
  textColor?: string;
  textGradient?: string;
}

export interface QuizContent {
  question: string;
  options: {
    id: string;
    text: string;
    // Button-like actions
    action?: 'next-step' | 'url' | 'submit';
    actionValue?: string; // URL for 'url' action, step ID for 'next-step'
    // DEPRECATED but keep for backwards compatibility
    nextStepId?: string; // Maps to action: 'next-step', actionValue: stepId
    // Per-option styling
    backgroundColor?: string;
    textColor?: string;
    trackingId?: string;
  }[];
  multiSelect?: boolean;
  
  // Submit Button - uses full ButtonContent for consistency
  showSubmitButton?: boolean;
  submitButton?: ButtonContent;
  
  // Style properties
  optionStyle?: 'outline' | 'filled';
  questionColor?: string;
  optionTextColor?: string;
  selectedOptionColor?: string;
  questionStyles?: TextStyles;
  
  // Popup/Modal settings
  popupSettings?: PopupSettings;
}

export interface ColumnsContent {
  columns: 2 | 3 | 4;
  gap: number;
  blocks: Block[][];
}

export interface CardContent {
  blocks: Block[];
}

export interface AccordionContent {
  items: {
    id: string;
    title: string;
    content: string;
    defaultOpen?: boolean;
  }[];
  // Style properties
  itemStyle?: 'outline' | 'filled';
  titleColor?: string;
  contentColor?: string;
  titleStyles?: TextStyles;
}

export interface DividerContent {
  style: 'solid' | 'dashed' | 'dotted';
  color?: string;
  thickness?: number;
}

export interface CalendarContent {
  title?: string;
  placeholder?: string;
  buttonText?: string;
  accentColor?: string;
  provider?: 'native' | 'calendly';
  url?: string;
  height?: number;
  // Color properties for contrast awareness
  titleColor?: string; // Color for title text
}

export interface SpacerContent {
  height: number;
}

// New Block Content Types
export interface ListItemIcon {
  mode: 'icon' | 'emoji' | 'image';
  iconName?: string;   // e.g., 'check', 'star', 'zap'
  emoji?: string;      // e.g., '✅', '⭐', '🚀'
  imageSrc?: string;   // custom image URL
  size?: number;       // per-item icon size override
}

export interface ListItem {
  id: string;
  text: string;
  icon?: ListItemIcon;  // Per-item icon customization
}

export interface ListContent {
  items: ListItem[];
  style: 'bullet' | 'numbered' | 'icon';
  // Style properties
  iconColor?: string;
  textColor?: string;
  fontSize?: number;
  iconSize?: number;    // Icon size in pixels (default 40)
  showIconBackground?: boolean;  // Show circle/background behind icon (default true)
  // Default icon (used when item doesn't have its own)
  defaultIconMode?: 'icon' | 'emoji' | 'image';
  defaultIconName?: string;
  defaultEmoji?: string;
  defaultImageSrc?: string;
  // Legacy (deprecated)
  iconType?: 'check' | 'star' | 'heart' | 'arrow';
}

export interface SliderContent {
  images: { id: string; src: string; alt: string }[];
  autoplay?: boolean;
  interval?: number; // Now stored in seconds
  showDots?: boolean;
  showArrows?: boolean;
}

export interface GraphicContent {
  type: 'emoji' | 'icon' | 'shape';
  value: string;
  size: number;
  color?: string;
}

export interface WebinarContent {
  videoSrc: string;
  videoType: 'youtube' | 'vimeo' | 'hosted';
  title: string;
  buttonText: string;
  buttonColor?: string;
  buttonGradient?: string;
  titleColor?: string;
  titleGradient?: string;
}

export interface LoaderContent {
  // Display
  text: string;
  subtext?: string;
  loaderStyle: 'circular' | 'dots' | 'bars' | 'progress' | 'pulse';
  size: 'small' | 'medium' | 'large';
  color?: string;
  backgroundColor?: string;
  
  // Behavior
  duration: number; // in seconds (1-10)
  action: {
    type: 'next-step' | 'specific-step' | 'external-url' | 'reveal-content';
    stepId?: string;
    url?: string;
    blockIds?: string[];
  };
  
  // Text styling
  textStyles?: TextStyles;
  subtextStyles?: TextStyles;
}

export type EmbedProvider = 'kununu' | 'trustpilot' | 'provenexpert' | 'googlemaps' | 'html';

export interface EmbedContent {
  provider: EmbedProvider;
  embedCode?: string;
  url?: string;
  height?: number;
}

// Interactive - Questions Content Types
export interface ImageQuizContent {
  question: string;
  options: {
    id: string;
    image: string;
    text: string;
    // Button-like actions
    action?: 'next-step' | 'url' | 'submit';
    actionValue?: string; // URL for 'url' action, step ID for 'next-step'
    // DEPRECATED but keep for backwards compatibility
    nextStepId?: string; // Maps to action: 'next-step', actionValue: stepId
    // Per-option styling
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    trackingId?: string;
  }[];
  multiSelect?: boolean;
  
  // Submit Button - uses full ButtonContent for consistency
  showSubmitButton?: boolean;
  submitButton?: ButtonContent;
  
  // Style properties
  optionStyle?: 'outline' | 'filled';
  questionColor?: string;
  optionTextColor?: string;
  selectedOptionColor?: string;
  questionStyles?: TextStyles;
}

export interface VideoQuestionContent {
  // Video properties - unified with VideoContent
  src?: string;  // New unified property
  type?: 'youtube' | 'vimeo' | 'wistia' | 'loom' | 'hosted';  // Expanded types
  autoplay?: boolean;
  controls?: boolean;
  aspectRatio?: '16:9' | '9:16' | '4:3' | '1:1';
  muted?: boolean;
  loop?: boolean;
  
  // Quiz properties
  question: string;
  options: {
    id: string;
    text: string;
    // Button-like actions
    action?: 'next-step' | 'url' | 'submit';
    actionValue?: string; // URL for 'url' action, step ID for 'next-step'
    // DEPRECATED but keep for backwards compatibility
    nextStepId?: string; // Maps to action: 'next-step', actionValue: stepId
    // Per-option styling
    backgroundColor?: string;
    textColor?: string;
    trackingId?: string;
  }[];
  multiSelect?: boolean;
  
  // Submit Button - uses full ButtonContent for consistency
  showSubmitButton?: boolean;
  submitButton?: ButtonContent;
  
  // Style properties
  optionStyle?: 'outline' | 'filled';
  questionColor?: string;
  optionTextColor?: string;
  selectedOptionColor?: string;
  questionStyles?: TextStyles;
  
  // DEPRECATED - kept for backwards compatibility (map to src/type)
  videoSrc?: string;
  videoType?: 'youtube' | 'vimeo' | 'hosted';
}

// Interactive - Forms Content Types
export interface UploadContent {
  label: string;
  acceptedTypes: string[];
  maxSize: number;
  buttonText: string;
  // Privacy consent checkbox
  consent?: ConsentSettings;
  // Color properties for contrast awareness
  labelColor?: string; // Color for label text
  helperTextColor?: string; // Color for helper/instruction text
}

export interface MessageContent {
  label: string;
  placeholder: string;
  minRows: number;
  maxLength?: number;
  
  // Question styling (like Quiz block)
  questionColor?: string;
  questionStyles?: TextStyles;
  
  // Submit Button - uses full ButtonContent for consistency
  submitButton?: ButtonContent;
  
  // Privacy consent checkbox
  consent?: ConsentSettings;
  
  // Popup/Modal settings
  popupSettings?: PopupSettings;
  // Color properties for contrast awareness
  helperTextColor?: string; // Color for helper text (e.g., character count)
}

export interface DatePickerContent {
  label: string;
  placeholder: string;
  minDate?: string;
  maxDate?: string;
  // Color properties for contrast awareness
  labelColor?: string; // Color for label text
}

export interface DropdownContent {
  label: string;
  placeholder: string;
  options: {
    id: string;
    value: string;
    label: string;
  }[];
  // Color properties for contrast awareness
  labelColor?: string; // Color for label text
}

export interface PaymentContent {
  amount: number;
  currency: string;
  buttonText: string;
  description?: string;
  descriptionColor?: string;
  url?: string;
  height?: number;
  stripeUrl?: string;
  // Privacy consent checkbox
  consent?: ConsentSettings;
  // Style properties
  buttonColor?: string;
  buttonGradient?: string;
  amountColor?: string;
  // Color properties for contrast awareness
  labelColor?: string; // Color for label text (e.g., "Amount Due")
}

export type BlockContent = 
  | HeadingContent
  | TextContent
  | ImageContent
  | VideoContent
  | ButtonContent
  | FormContent
  | EmailCaptureContent
  | PhoneCaptureContent
  | ReviewsContent
  | TestimonialSliderContent
  | LogoBarContent
  | SocialProofContent
  | CountdownContent
  | QuizContent
  | ColumnsContent
  | CardContent
  | AccordionContent
  | DividerContent
  | SpacerContent
  | CalendarContent
  | ListContent
  | SliderContent
  | GraphicContent
  | WebinarContent
  | LoaderContent
  | EmbedContent
  | ImageQuizContent
  | VideoQuestionContent
  | UploadContent
  | MessageContent
  | DatePickerContent
  | DropdownContent
  | PaymentContent;

export interface Block {
  id: string;
  type: BlockType;
  content: BlockContent;
  styles: BlockStyles;
  trackingId?: string;
}

export interface FunnelStep {
  id: string;
  name: string;
  type: StepType;
  slug: string;
  blocks: Block[];
  settings: {
    backgroundColor?: string;
    backgroundImage?: string;
    conversionEvent?: string;
    nextStepId?: string;
  };
}

export interface Funnel {
  id: string;
  name: string;
  description?: string;
  steps: FunnelStep[];
  settings: {
    primaryColor: string;
    fontFamily: string;
    favicon?: string;
    showStepIndicator?: boolean; // Toggle step dots at bottom
    // Additional optional settings
    webhookUrl?: string;
    privacyPolicyUrl?: string;
    metaTitle?: string;
    metaDescription?: string;
    [key: string]: unknown; // Allow additional properties
  };
  // Global phone country codes (shared across all phone inputs)
  countryCodes?: CountryCode[];
  defaultCountryId?: string; // ID of default selected country
  createdAt: string;
  updatedAt: string;
}

// Block Library Definition
export interface BlockDefinition {
  type: BlockType;
  name: string;
  icon: string;
  category: 'content' | 'conversion' | 'trust' | 'layout' | 'advanced';
  defaultContent: BlockContent;
  defaultStyles: BlockStyles;
}

// Planning Types
export interface PlannedBlock {
  id: string;
  type: BlockType;
  description?: string;
  placeholder?: string; // e.g., "Hero heading", "CTA button"
  order: number;
}

export interface PlannedStep {
  id: string;
  name: string;
  type: StepType;
  description?: string;
  blocks: PlannedBlock[];
  order: number;
}

export interface FunnelPlan {
  id: string;
  name: string;
  description?: string;
  steps: PlannedStep[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PlannedAction {
  action: 'create-step' | 'add-block' | 'update-content' | 'generate-copy';
  description: string;
  target?: string; // step name or block type
}

export interface GeneratedPlan {
  description: string;
  steps: PlannedAction[];
  canBuild: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'message' | 'plan' | 'build-result';
  plan?: GeneratedPlan;
  timestamp: Date;
}
