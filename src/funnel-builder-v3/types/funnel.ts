/**
 * Funnel Builder v3 - Clean Type System
 * 
 * Mental Model (Perspective Parity):
 * Funnel → Screens[] → Blocks[] → Properties{}
 * 
 * That's it. No Steps, Frames, Stacks, Elements, or Flow Containers.
 */

// =============================================================================
// CORE TYPES
// =============================================================================

export interface Funnel {
  id: string;
  name: string;
  slug: string;
  screens: Screen[];
  settings: FunnelSettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface Screen {
  id: string;
  name: string;
  type: ScreenType;
  blocks: Block[];
  background?: ScreenBackground;
}

export type ScreenType = 
  | 'content'   // Display only - text, images, buttons
  | 'form'      // Collects identity - name, email, phone
  | 'choice'    // Collects selection - single or multiple choice
  | 'calendar'  // Booking widget
  | 'thankyou'; // End screen / confirmation

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  props: BlockProps;
}

export type BlockType = 
  | 'text'
  | 'heading'
  | 'image'
  | 'video'
  | 'button'
  | 'divider'
  | 'spacer'
  | 'input'      // Single field (name/email/phone/custom)
  | 'choice'     // Single or multiple selection
  | 'embed';     // Calendar, HTML, etc.

// =============================================================================
// ANIMATION & GRADIENT TYPES (imported from shared)
// =============================================================================

// Re-export from shared for convenience
export type { 
  AnimationSettings, 
  AnimationEffect, 
  AnimationTrigger, 
  AnimationEasing,
  GradientValue,
  GradientStop,
} from '../shared';

// =============================================================================
// BLOCK PROPERTIES
// =============================================================================

export interface BlockProps {
  // Text/Heading
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  align?: 'left' | 'center' | 'right';
  color?: string;
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  
  // Image/Video
  src?: string;
  alt?: string;
  aspectRatio?: 'auto' | '16:9' | '4:3' | '1:1' | '9:16';
  objectFit?: 'cover' | 'contain' | 'fill';
  
  // Button
  action?: ButtonAction;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  buttonSize?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  
  // Input
  inputType?: 'text' | 'email' | 'phone' | 'name' | 'textarea';
  placeholder?: string;
  required?: boolean;
  fieldKey?: string;  // Key for form data
  label?: string;
  
  // Choice
  options?: ChoiceOption[];
  multiSelect?: boolean;
  layout?: 'vertical' | 'horizontal' | 'grid';
  showImages?: boolean;
  
  // Embed
  embedType?: 'calendar' | 'html' | 'video';
  embedCode?: string;
  calendarUrl?: string;
  
  // Spacer
  height?: number;
  
  // Universal
  hidden?: boolean;
  className?: string;
  
  // Animation (uses AnimationSettings from shared)
  animation?: import('../shared').AnimationSettings;
  
  // Advanced styling
  gradient?: import('../shared').GradientValue;
  useGradient?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'glow';
  borderRadius?: number;
  hoverEffect?: 'none' | 'glow' | 'lift' | 'pulse' | 'shine';
}

export interface ChoiceOption {
  id: string;
  label: string;
  value: string;
  imageUrl?: string;
  description?: string;
}

// =============================================================================
// BUTTON ACTIONS
// =============================================================================

export type ButtonAction = 
  | { type: 'next-screen' }
  | { type: 'previous-screen' }
  | { type: 'go-to-screen'; screenId: string }
  | { type: 'submit' }
  | { type: 'url'; url: string; openInNewTab?: boolean };

// =============================================================================
// FUNNEL SETTINGS
// =============================================================================

export interface FunnelSettings {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  showProgress?: boolean;
  progressStyle?: 'bar' | 'dots' | 'steps';
  logoUrl?: string;
  faviconUrl?: string;
  customCss?: string;
  meta?: {
    title?: string;
    description?: string;
    ogImage?: string;
  };
}

export interface ScreenBackground {
  type: 'solid' | 'gradient' | 'image' | 'video' | 'pattern';
  color?: string;
  gradient?: {
    from: string;
    to: string;
    angle: number;
  };
  // Advanced gradient (uses GradientValue from shared)
  gradientValue?: import('../shared').GradientValue;
  image?: string;
  video?: string;
  pattern?: {
    type: 'dots' | 'grid' | 'lines';
    color: string;
    opacity: number;
    size?: number;
  };
  overlay?: 'none' | 'dark' | 'light' | 'gradient-dark' | 'gradient-light';
  overlayOpacity?: number;
}

// =============================================================================
// EDITOR STATE
// =============================================================================

export interface EditorSelection {
  screenId: string | null;
  blockId: string | null;
}

export interface EditorState {
  funnel: Funnel;
  selection: EditorSelection;
  previewMode: boolean;
  isDirty: boolean;
  isSaving: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createScreen(type: ScreenType, name: string): Screen {
  return {
    id: createId(),
    name,
    type,
    blocks: [],
  };
}

export function createBlock(type: BlockType, content: string = '', props: Partial<BlockProps> = {}): Block {
  return {
    id: createId(),
    type,
    content,
    props,
  };
}

export function createDefaultFunnel(name: string, slug: string): Funnel {
  return {
    id: createId(),
    name,
    slug,
    screens: [
      {
        id: createId(),
        name: 'Welcome',
        type: 'content',
        blocks: [
          createBlock('heading', 'Welcome to Your Funnel', { size: '2xl', align: 'center' }),
          createBlock('text', 'Start building your funnel by adding blocks', { align: 'center' }),
          createBlock('button', 'Get Started', { action: { type: 'next-screen' }, variant: 'primary' }),
        ],
      },
    ],
    settings: {
      primaryColor: 'hsl(262, 83%, 58%)',
      fontFamily: 'Inter',
      showProgress: true,
    },
  };
}

// =============================================================================
// SCREEN TYPE HELPERS
// =============================================================================

export const SCREEN_TYPE_CONFIG: Record<ScreenType, { 
  label: string; 
  description: string; 
  icon: string;
  allowedBlocks: BlockType[];
}> = {
  content: {
    label: 'Content',
    description: 'Display text, images, and buttons',
    icon: 'FileText',
    allowedBlocks: ['heading', 'text', 'image', 'video', 'button', 'divider', 'spacer'],
  },
  form: {
    label: 'Form',
    description: 'Collect contact information',
    icon: 'FormInput',
    allowedBlocks: ['heading', 'text', 'input', 'button', 'divider', 'spacer'],
  },
  choice: {
    label: 'Choice',
    description: 'Let users select options',
    icon: 'ListChecks',
    allowedBlocks: ['heading', 'text', 'choice', 'button', 'divider', 'spacer'],
  },
  calendar: {
    label: 'Calendar',
    description: 'Book appointments',
    icon: 'Calendar',
    allowedBlocks: ['heading', 'text', 'embed', 'divider', 'spacer'],
  },
  thankyou: {
    label: 'Thank You',
    description: 'Confirmation screen',
    icon: 'CheckCircle',
    allowedBlocks: ['heading', 'text', 'image', 'button', 'divider', 'spacer'],
  },
};

export const BLOCK_TYPE_CONFIG: Record<BlockType, {
  label: string;
  description: string;
  icon: string;
  category: 'content' | 'input' | 'layout';
}> = {
  heading: {
    label: 'Heading',
    description: 'Large title text',
    icon: 'Heading',
    category: 'content',
  },
  text: {
    label: 'Text',
    description: 'Paragraph text',
    icon: 'Type',
    category: 'content',
  },
  image: {
    label: 'Image',
    description: 'Display an image',
    icon: 'Image',
    category: 'content',
  },
  video: {
    label: 'Video',
    description: 'Embed a video',
    icon: 'Video',
    category: 'content',
  },
  button: {
    label: 'Button',
    description: 'Clickable button',
    icon: 'MousePointer',
    category: 'content',
  },
  divider: {
    label: 'Divider',
    description: 'Horizontal line',
    icon: 'Minus',
    category: 'layout',
  },
  spacer: {
    label: 'Spacer',
    description: 'Empty space',
    icon: 'Space',
    category: 'layout',
  },
  input: {
    label: 'Input',
    description: 'Text input field',
    icon: 'TextCursor',
    category: 'input',
  },
  choice: {
    label: 'Choice',
    description: 'Selection options',
    icon: 'ListChecks',
    category: 'input',
  },
  embed: {
    label: 'Embed',
    description: 'External content',
    icon: 'Code',
    category: 'content',
  },
};
