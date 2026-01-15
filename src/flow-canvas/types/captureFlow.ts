// CaptureFlow Types - Unified lead capture system
// This is the single source of truth for all capture-related logic

// ============ NODE TYPES ============

export type CaptureNodeType = 
  | 'open-ended'      // Free text input
  | 'single-choice'   // Radio buttons / single select
  | 'multi-choice'    // Checkboxes / multi select
  | 'email'           // Email capture with validation
  | 'phone'           // Phone capture with validation
  | 'name'            // Name capture (first/last or full)
  | 'date'            // Date picker
  | 'scale'           // 1-10 scale rating
  | 'yes-no';         // Binary choice

export type CaptureNodeNavigationAction = 
  | 'next'            // Go to next node
  | 'go-to-node'      // Jump to specific node
  | 'submit'          // Submit the entire flow
  | 'conditional';    // Navigate based on answer

// ============ NODE SETTINGS ============

export interface CaptureNodeValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;       // Regex pattern
  customMessage?: string; // Validation error message
}

export interface CaptureNodeChoice {
  id: string;
  label: string;
  emoji?: string;
  imageUrl?: string;
  goToNodeId?: string;    // For conditional navigation
}

export interface CaptureNodeSettings {
  // Content
  title?: string;
  description?: string;
  placeholder?: string;
  buttonText?: string;
  
  // Choice-specific
  choices?: CaptureNodeChoice[];
  allowMultiple?: boolean;
  randomizeOrder?: boolean;
  
  // Scale-specific
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  
  // Name-specific
  splitName?: boolean;    // Split into first/last name
  
  // Appearance
  align?: 'left' | 'center' | 'right';
  spacing?: 'compact' | 'normal' | 'relaxed';
  inputStyle?: 'default' | 'minimal' | 'rounded' | 'square';
  titleSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  buttonStyle?: 'solid' | 'outline' | 'minimal' | 'primary';
  buttonColor?: string;
}

export interface CaptureNodeNavigation {
  action: CaptureNodeNavigationAction;
  targetNodeId?: string;
  conditionalRoutes?: Array<{
    choiceId: string;
    targetNodeId: string;
  }>;
}

// ============ CAPTURE NODE ============

export interface CaptureNode {
  id: string;
  type: CaptureNodeType;
  fieldKey: string;           // Key used to store answer (e.g., 'email', 'q1_budget')
  settings: CaptureNodeSettings;
  validation?: CaptureNodeValidation;
  navigation: CaptureNodeNavigation;
}

// ============ CAPTURE FLOW ============

export type CaptureFlowRenderMode = 'inline' | 'modal' | 'fullpage';

export interface CaptureFlowBackground {
  type: 'solid' | 'gradient' | 'image';
  color?: string;
  gradient?: {
    type: 'linear' | 'radial';
    angle: number;
    stops: Array<{ color: string; position: number }>;
  };
  imageUrl?: string;
}

export interface CaptureFlowAppearance {
  background?: CaptureFlowBackground;
  textColor?: string;
  inputBackground?: string;
  inputBorderColor?: string;
  inputTextColor?: string;
  accentColor?: string;
  showProgress?: boolean;
  progressStyle?: 'bar' | 'dots' | 'fraction' | 'none';
  transition?: 'slide-up' | 'slide-left' | 'fade' | 'none';
}

export interface CaptureFlowSubmitBehavior {
  action: 'redirect' | 'show-message' | 'trigger-webhook' | 'close-modal';
  redirectUrl?: string;
  successMessage?: string;
  webhookUrl?: string;
}

export interface CaptureFlow {
  id: string;
  name: string;
  nodes: CaptureNode[];
  appearance: CaptureFlowAppearance;
  submitBehavior: CaptureFlowSubmitBehavior;
  createdAt: string;
  updatedAt: string;
}

// ============ CAPTURE FLOW STATE (Runtime) ============

export interface CaptureFlowAnswers {
  [fieldKey: string]: string | string[] | number | boolean | null;
}

export interface CaptureFlowState {
  currentNodeId: string | null;
  answers: CaptureFlowAnswers;
  validationErrors: Record<string, string>;
  isSubmitting: boolean;
  isComplete: boolean;
}

// ============ EMBED BLOCK ============

export interface CaptureFlowEmbedBlockProps {
  captureFlowId: string;
  renderMode: CaptureFlowRenderMode;
  // Inline mode: renders directly in the section
  // Modal mode: shows a trigger button, opens flow in modal
  // Fullpage mode: takes over the entire viewport
  triggerButtonText?: string; // For modal mode
  triggerButtonStyle?: 'solid' | 'outline' | 'minimal';
}

// ============ BUTTON ACTIONS ============

export type CaptureFlowButtonAction = 
  | 'advance-capture-flow'    // Move to next node
  | 'open-capture-flow'       // Open flow as modal
  | 'submit-capture-flow';    // Submit the flow

// ============ HELPERS ============

export const captureNodeTypeLabels: Record<CaptureNodeType, string> = {
  'open-ended': 'Open-Ended Question',
  'single-choice': 'Single Choice',
  'multi-choice': 'Multiple Choice',
  'email': 'Email Capture',
  'phone': 'Phone Capture',
  'name': 'Name Capture',
  'date': 'Date Picker',
  'scale': 'Scale Rating',
  'yes-no': 'Yes/No',
};

export const captureNodeTypeIcons: Record<CaptureNodeType, string> = {
  'open-ended': 'MessageSquare',
  'single-choice': 'CircleDot',
  'multi-choice': 'CheckSquare',
  'email': 'Mail',
  'phone': 'Phone',
  'name': 'User',
  'date': 'Calendar',
  'scale': 'Star',
  'yes-no': 'ToggleLeft',
};

// Factory function to create a new CaptureNode
export function createCaptureNode(type: CaptureNodeType, overrides?: Partial<CaptureNode>): CaptureNode {
  const baseNode: CaptureNode = {
    id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    fieldKey: type === 'email' ? 'email' : type === 'phone' ? 'phone' : type === 'name' ? 'name' : `field_${Date.now()}`,
    settings: {
      title: getDefaultTitle(type),
      buttonText: 'Continue',
      align: 'center',
      spacing: 'normal',
      inputStyle: 'default',
      titleSize: 'lg',
      buttonStyle: 'primary',
    },
    navigation: {
      action: 'next',
    },
  };
  
  // Add type-specific defaults
  if (type === 'single-choice' || type === 'multi-choice') {
    baseNode.settings.choices = [
      { id: 'opt_1', label: 'Option 1' },
      { id: 'opt_2', label: 'Option 2' },
      { id: 'opt_3', label: 'Option 3' },
    ];
  }
  
  if (type === 'scale') {
    baseNode.settings.scaleMin = 1;
    baseNode.settings.scaleMax = 10;
    baseNode.settings.scaleMinLabel = 'Not likely';
    baseNode.settings.scaleMaxLabel = 'Very likely';
  }
  
  if (type === 'yes-no') {
    baseNode.settings.choices = [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
    ];
  }
  
  return { ...baseNode, ...overrides };
}

function getDefaultTitle(type: CaptureNodeType): string {
  switch (type) {
    case 'open-ended': return 'Tell us more about your needs';
    case 'single-choice': return 'Which option best describes you?';
    case 'multi-choice': return 'Select all that apply';
    case 'email': return 'What\'s your email?';
    case 'phone': return 'What\'s your phone number?';
    case 'name': return 'What\'s your name?';
    case 'date': return 'Select a date';
    case 'scale': return 'How likely are you to recommend us?';
    case 'yes-no': return 'Are you ready to get started?';
  }
}

// Factory function to create a new CaptureFlow
export function createCaptureFlow(name?: string): CaptureFlow {
  return {
    id: `cf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: name || 'New Capture Flow',
    nodes: [
      createCaptureNode('email'),
    ],
    appearance: {
      showProgress: true,
      progressStyle: 'bar',
      transition: 'slide-up',
    },
    submitBehavior: {
      action: 'show-message',
      successMessage: 'Thank you! We\'ll be in touch soon.',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
