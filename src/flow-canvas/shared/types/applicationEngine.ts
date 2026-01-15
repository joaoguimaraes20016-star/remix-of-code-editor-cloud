// ============ APPLICATION ENGINE TYPES ============
// Single source of truth for ALL interactive data collection in InfoStack
// 
// ARCHITECTURAL PRINCIPLE:
// - There are only TWO concepts: Sections (layout only) and Interactive Blocks (data + logic)
// - This file defines the UNIFIED engine for all interactive blocks
// - Presentation mode (inline vs flow) is a PROPERTY, not a separate system
// - CaptureFlow and legacy ApplicationFlow types are DEPRECATED adapters only
//
// See: docs/architecture/interactive-system.md

// ============ PRESENTATION MODE ============
// How the interactive content is rendered - NOT a separate system

export type PresentationMode = 'inline' | 'flow';

// ============ STEP TYPES ============

export type ApplicationStepType =
  | 'open-ended'      // Free text input
  | 'single-choice'   // Radio buttons / single select
  | 'multi-choice'    // Checkboxes / multi select
  | 'email'           // Email capture with validation
  | 'phone'           // Phone capture with validation
  | 'name'            // Name capture (first/last or full)
  | 'full-identity'   // Name + Email + Phone combined
  | 'date'            // Date picker
  | 'scale'           // 1-10 scale rating
  | 'yes-no'          // Binary choice
  | 'welcome'         // Welcome screen (no input)
  | 'ending';         // Thank you screen (no input)

/** @deprecated Use PresentationMode instead */
export type ApplicationMode = PresentationMode;

// ============ STEP SETTINGS ============

export interface ApplicationStepChoice {
  id: string;
  label: string;
  emoji?: string;
  imageUrl?: string;
  goToStepId?: string;    // For conditional navigation
}

export interface ApplicationStepValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;       // Regex pattern
  customMessage?: string; // Validation error message
}

export interface ApplicationStepSettings {
  // Content
  title?: string;
  description?: string;
  placeholder?: string;
  buttonText?: string;
  
  // Choice-specific
  choices?: ApplicationStepChoice[];
  allowMultiple?: boolean;
  randomizeOrder?: boolean;
  
  // Scale-specific
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  
  // Name-specific
  splitName?: boolean;    // Split into first/last name
  
  // Full identity specific
  collectName?: boolean;
  collectEmail?: boolean;
  collectPhone?: boolean;
  namePlaceholder?: string;
  emailPlaceholder?: string;
  phonePlaceholder?: string;
  
  // Appearance
  align?: 'left' | 'center' | 'right';
  spacing?: 'compact' | 'normal' | 'relaxed';
  inputStyle?: 'default' | 'minimal' | 'rounded' | 'square';
  titleSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  buttonStyle?: 'solid' | 'outline' | 'minimal' | 'primary';
  buttonColor?: string;
}

export interface ApplicationStepNavigation {
  action: 'next' | 'go-to-step' | 'submit' | 'redirect';
  targetStepId?: string;
  redirectUrl?: string;
  conditionalRoutes?: Array<{
    choiceId: string;
    targetStepId: string;
  }>;
}

// ============ APPLICATION STEP ============

export interface ApplicationStep {
  id: string;
  type: ApplicationStepType;
  fieldKey: string;           // Key used to store answer (e.g., 'email', 'q1_budget')
  settings: ApplicationStepSettings;
  validation?: ApplicationStepValidation;
  navigation: ApplicationStepNavigation;
}

// ============ APPLICATION ENGINE ============

export interface ApplicationEngineAppearance {
  background?: {
    type: 'solid' | 'gradient' | 'image';
    color?: string;
    gradient?: {
      type: 'linear' | 'radial';
      angle: number;
      stops: Array<{ color: string; position: number }>;
    };
    imageUrl?: string;
  };
  textColor?: string;
  inputBackground?: string;
  inputBorderColor?: string;
  inputTextColor?: string;
  accentColor?: string;
  showProgress?: boolean;
  progressStyle?: 'bar' | 'dots' | 'fraction' | 'none';
  transition?: 'slide-up' | 'slide-left' | 'fade' | 'none';
}

export interface ApplicationEngineSubmitBehavior {
  action: 'redirect' | 'show-message' | 'trigger-webhook' | 'close-modal' | 'next-step';
  redirectUrl?: string;
  successMessage?: string;
  webhookUrl?: string;
}

export interface ApplicationEngine {
  id: string;
  name: string;
  /** 
   * Presentation mode controls HOW the interactive content is rendered:
   * - 'inline': Embedded directly in a section, looks like normal page content
   * - 'flow': One question per screen with animated transitions
   * Both modes use the SAME steps, data, and logic - just different UI
   */
  presentationMode: PresentationMode;
  /** @deprecated Use presentationMode instead */
  mode?: PresentationMode;
  steps: ApplicationStep[];
  appearance: ApplicationEngineAppearance;
  submitBehavior: ApplicationEngineSubmitBehavior;
  /** For flow mode: show progress indicator */
  showProgress?: boolean;
  /** For flow mode: animation between steps */
  transition?: 'slide-up' | 'slide-left' | 'fade' | 'none';
}

// ============ RUNTIME STATE ============

export type ApplicationAnswerValue = string | string[] | number | boolean | null | {
  name?: string;
  email?: string;
  phone?: string;
};

export interface ApplicationAnswers {
  [fieldKey: string]: ApplicationAnswerValue;
}

export interface ApplicationEngineState {
  currentStepId: string | null;
  answers: ApplicationAnswers;
  validationErrors: Record<string, string>;
  isSubmitting: boolean;
  isComplete: boolean;
  consentAccepted: boolean;
}

// ============ CONSENT ============

export interface ConsentMetadata {
  accepted: boolean;
  acceptedAt: string;
  privacyPolicyUrl?: string;
  consentMode: 'explicit' | 'implicit';
  emailConsent?: boolean;
  smsConsent?: boolean;
}

// ============ HELPERS ============

export const applicationStepTypeLabels: Record<ApplicationStepType, string> = {
  'open-ended': 'Open-Ended Question',
  'single-choice': 'Single Choice',
  'multi-choice': 'Multiple Choice',
  'email': 'Email',
  'phone': 'Phone',
  'name': 'Name',
  'full-identity': 'Full Contact Info',
  'date': 'Date Picker',
  'scale': 'Scale Rating',
  'yes-no': 'Yes/No',
  'welcome': 'Welcome Screen',
  'ending': 'Thank You Screen',
};

export const IDENTITY_STEP_TYPES: ApplicationStepType[] = [
  'email',
  'phone',
  'name',
  'full-identity',
];

export function isIdentityStep(type: ApplicationStepType): boolean {
  return IDENTITY_STEP_TYPES.includes(type);
}

export function requiresConsent(steps: ApplicationStep[]): boolean {
  return steps.some(step => isIdentityStep(step.type));
}

// ============ FACTORY FUNCTIONS ============

export function createApplicationStep(
  type: ApplicationStepType,
  overrides?: Partial<ApplicationStep>
): ApplicationStep {
  const baseStep: ApplicationStep = {
    id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    fieldKey: getDefaultFieldKey(type),
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
  if (type === 'single-choice' || type === 'multi-choice' || type === 'yes-no') {
    baseStep.settings.choices = type === 'yes-no'
      ? [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }]
      : [
          { id: 'opt_1', label: 'Option 1' },
          { id: 'opt_2', label: 'Option 2' },
          { id: 'opt_3', label: 'Option 3' },
        ];
  }

  if (type === 'scale') {
    baseStep.settings.scaleMin = 1;
    baseStep.settings.scaleMax = 10;
    baseStep.settings.scaleMinLabel = 'Not likely';
    baseStep.settings.scaleMaxLabel = 'Very likely';
  }

  if (type === 'full-identity') {
    baseStep.settings.collectName = true;
    baseStep.settings.collectEmail = true;
    baseStep.settings.collectPhone = true;
    baseStep.settings.namePlaceholder = 'Your name';
    baseStep.settings.emailPlaceholder = 'Your email';
    baseStep.settings.phonePlaceholder = 'Your phone number';
  }

  return { ...baseStep, ...overrides };
}

function getDefaultFieldKey(type: ApplicationStepType): string {
  switch (type) {
    case 'email': return 'email';
    case 'phone': return 'phone';
    case 'name': return 'name';
    case 'full-identity': return 'identity';
    default: return `field_${Date.now()}`;
  }
}

function getDefaultTitle(type: ApplicationStepType): string {
  switch (type) {
    case 'open-ended': return 'Tell us more about your needs';
    case 'single-choice': return 'Which option best describes you?';
    case 'multi-choice': return 'Select all that apply';
    case 'email': return "What's your email?";
    case 'phone': return "What's your phone number?";
    case 'name': return "What's your name?";
    case 'full-identity': return 'Enter your contact information';
    case 'date': return 'Select a date';
    case 'scale': return 'How likely are you to recommend us?';
    case 'yes-no': return 'Are you ready to get started?';
    case 'welcome': return 'Welcome';
    case 'ending': return 'Thank you!';
  }
}
