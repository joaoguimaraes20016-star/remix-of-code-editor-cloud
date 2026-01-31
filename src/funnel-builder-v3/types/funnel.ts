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
  | 'testimonial'
  | 'slider'
  | 'graphic'
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
  | 'payment';

export type ViewportType = 'mobile' | 'tablet' | 'desktop';

// Animation type with all supported animations
export type AnimationType = 
  | 'none'
  | 'fade-in'
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'scale-in'
  | 'scale-up'
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
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  animation?: AnimationType;
  animationDuration?: AnimationDuration;
  animationDelay?: number;
  animationEasing?: AnimationEasing;
  animationTrigger?: AnimationTrigger;
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
  type: 'youtube' | 'vimeo' | 'hosted';
  autoplay?: boolean;
  controls?: boolean; // Only applies to hosted videos
}

export interface ButtonContent {
  text: string;
  variant: 'primary' | 'secondary' | 'ghost' | 'outline';
  size: 'sm' | 'md' | 'lg';
  action: 'next-step' | 'url' | 'scroll' | 'submit';
  actionValue?: string;
  fullWidth?: boolean;
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
}

export interface FormFieldConfig {
  id: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For select fields
}

export interface FormContent {
  fields: FormFieldConfig[];
  submitText: string;
  submitAction: 'next-step' | 'webhook';
  webhookUrl?: string;
  submitButtonColor?: string;
  submitButtonGradient?: string;
  // Button text styling
  submitButtonTextColor?: string;
  submitButtonTextGradient?: string;
}

export interface EmailCaptureContent {
  placeholder: string;
  buttonText: string;
  subtitle?: string;
  buttonColor?: string;
  buttonGradient?: string;
  // Button text styling
  buttonTextColor?: string;
  buttonTextGradient?: string;
}

export interface PhoneCaptureContent {
  placeholder: string;
  buttonText: string;
  defaultCountry?: string;
  buttonColor?: string;
  buttonGradient?: string;
  // Button text styling
  buttonTextColor?: string;
  buttonTextGradient?: string;
}

export interface TestimonialContent {
  quote: string;
  authorName: string;
  authorTitle?: string;
  authorImage?: string;
  rating?: number;
  // Style properties
  cardStyle?: 'outline' | 'filled';
  quoteColor?: string;
  authorColor?: string;
  quoteStyles?: TextStyles;
}

export interface ReviewsContent {
  reviews: {
    id: string;
    text: string;
    author: string;
    rating: number; // Supports half-stars (e.g., 4.5)
    avatar?: string; // URL to avatar image
  }[];
  // Style properties
  cardStyle?: 'outline' | 'filled';
  reviewTextColor?: string;
  authorColor?: string;
  starColor?: string;
  showAvatars?: boolean;
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
    nextStepId?: string;
  }[];
  multiSelect?: boolean;
  // Style properties
  optionStyle?: 'outline' | 'filled';
  questionColor?: string;
  optionTextColor?: string;
  selectedOptionColor?: string;
  questionStyles?: TextStyles;
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
}

export interface SpacerContent {
  height: number;
}

// New Block Content Types
export interface ListContent {
  items: { id: string; text: string }[];
  style: 'bullet' | 'numbered' | 'check';
  // Style properties
  iconColor?: string;
  textColor?: string;
  fontSize?: number;
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
  progress: number;
  showPercentage: boolean;
  color?: string;
  trackColor?: string;
  label?: string;
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
    nextStepId?: string;
  }[];
  // Style properties
  optionStyle?: 'outline' | 'filled';
  questionColor?: string;
  optionTextColor?: string;
  selectedOptionColor?: string;
  questionStyles?: TextStyles;
}

export interface VideoQuestionContent {
  videoSrc: string;
  videoType: 'youtube' | 'vimeo' | 'hosted';
  question: string;
  options: {
    id: string;
    text: string;
    nextStepId?: string;
  }[];
  // Style properties
  optionStyle?: 'outline' | 'filled';
  questionColor?: string;
  optionTextColor?: string;
  selectedOptionColor?: string;
  questionStyles?: TextStyles;
}

// Interactive - Forms Content Types
export interface UploadContent {
  label: string;
  acceptedTypes: string[];
  maxSize: number;
  buttonText: string;
}

export interface MessageContent {
  label: string;
  placeholder: string;
  minRows: number;
  maxLength?: number;
}

export interface DatePickerContent {
  label: string;
  placeholder: string;
  minDate?: string;
  maxDate?: string;
}

export interface DropdownContent {
  label: string;
  placeholder: string;
  options: {
    id: string;
    value: string;
    label: string;
  }[];
}

export interface PaymentContent {
  amount: number;
  currency: string;
  buttonText: string;
  description?: string;
  url?: string;
  height?: number;
  stripeUrl?: string;
  // Style properties
  buttonColor?: string;
  buttonGradient?: string;
  amountColor?: string;
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
  | TestimonialContent
  | ReviewsContent
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
  };
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
