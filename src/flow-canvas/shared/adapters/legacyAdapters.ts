// Legacy Adapters - Convert old type systems to unified ApplicationStep
// These allow gradual migration while maintaining backward compatibility

import { 
  ApplicationStep, 
  ApplicationStepType, 
  ApplicationStepSettings,
  ApplicationStepNavigation,
  ApplicationStepChoice,
} from '../types/applicationEngine';
import type { CaptureNode, CaptureNodeType } from '@/flow-canvas/types/captureFlow';
import type { ApplicationFlowStep, ApplicationStepType as LegacyStepType } from '@/flow-canvas/types/infostack';

// ============ CAPTURE NODE → APPLICATION STEP ============

const captureNodeTypeMap: Record<CaptureNodeType, ApplicationStepType> = {
  'open-ended': 'open-ended',
  'single-choice': 'single-choice',
  'multi-choice': 'multi-choice',
  'email': 'email',
  'phone': 'phone',
  'name': 'name',
  'date': 'date',
  'scale': 'scale',
  'yes-no': 'yes-no',
};

export function captureNodeToApplicationStep(node: CaptureNode): ApplicationStep {
  const type = captureNodeTypeMap[node.type] || 'open-ended';
  
  const settings: ApplicationStepSettings = {
    title: node.settings.title,
    description: node.settings.description,
    placeholder: node.settings.placeholder,
    buttonText: node.settings.buttonText,
    align: node.settings.align,
    spacing: node.settings.spacing,
    inputStyle: node.settings.inputStyle,
    titleSize: node.settings.titleSize,
    buttonPreset: node.settings.buttonPreset,
    // Scale
    scaleMin: node.settings.scaleMin,
    scaleMax: node.settings.scaleMax,
    scaleMinLabel: node.settings.scaleMinLabel,
    scaleMaxLabel: node.settings.scaleMaxLabel,
    // Name
    splitName: node.settings.splitName,
    // Choices
    choices: node.settings.choices?.map(c => ({
      id: c.id,
      label: c.label,
      emoji: c.emoji,
      imageUrl: c.imageUrl,
      goToStepId: c.goToNodeId,
    })),
    randomizeOrder: node.settings.randomizeOrder,
    allowMultiple: node.settings.allowMultiple,
  };

  // Map CaptureNode navigation actions to ApplicationStep navigation actions
  const actionMap: Record<string, 'next' | 'go-to-step' | 'submit' | 'redirect'> = {
    'next': 'next',
    'go-to-node': 'go-to-step',
    'submit': 'submit',
    'conditional': 'next', // Conditional routing still uses next as base action
  };

  const navigation: ApplicationStepNavigation = {
    action: actionMap[node.navigation.action] || 'next',
    targetStepId: node.navigation.targetNodeId,
    conditionalRoutes: node.navigation.conditionalRoutes?.map(r => ({
      choiceId: r.choiceId,
      targetStepId: r.targetNodeId,
    })),
  };

  return {
    id: node.id,
    type,
    fieldKey: node.fieldKey,
    settings,
    validation: node.validation,
    navigation,
  };
}

// ============ APPLICATION FLOW STEP → APPLICATION STEP ============

const legacyStepTypeMap: Record<LegacyStepType, ApplicationStepType> = {
  'welcome': 'welcome',
  'question': 'single-choice', // Default, may be overridden by questionType
  'capture': 'full-identity',
  'booking': 'ending', // Booking is treated as ending for now
  'ending': 'ending',
};

export function applicationFlowStepToApplicationStep(step: ApplicationFlowStep): ApplicationStep {
  let type: ApplicationStepType = legacyStepTypeMap[step.type] || 'open-ended';
  
  // Override based on questionType if it's a question
  if (step.type === 'question' && step.settings?.questionType) {
    switch (step.settings.questionType) {
      case 'multiple-choice': type = 'single-choice'; break;
      case 'text': type = 'open-ended'; break;
      case 'dropdown': type = 'single-choice'; break;
      case 'scale': type = 'scale'; break;
      case 'yes-no': type = 'yes-no'; break;
    }
  }

  // Override for capture type based on what's being collected
  if (step.type === 'capture') {
    const { collectEmail, collectPhone, collectName } = step.settings || {};
    const count = [collectEmail, collectPhone, collectName].filter(Boolean).length;
    
    if (count === 1) {
      if (collectEmail) type = 'email';
      else if (collectPhone) type = 'phone';
      else if (collectName) type = 'name';
    } else {
      type = 'full-identity';
    }
  }

  const settings: ApplicationStepSettings = {
    title: step.settings?.title,
    description: step.settings?.description,
    placeholder: step.settings?.placeholder,
    buttonText: step.settings?.buttonText,
    buttonPreset: step.settings?.buttonPreset,
    align: step.settings?.align,
    spacing: step.settings?.spacing,
    inputStyle: step.settings?.inputStyle,
    titleSize: step.settings?.titleSize,
    // Scale
    scaleMax: step.settings?.scaleMax,
    scaleMinLabel: step.settings?.scaleMinLabel,
    scaleMaxLabel: step.settings?.scaleMaxLabel,
    // Full identity
    collectName: step.settings?.collectName,
    collectEmail: step.settings?.collectEmail,
    collectPhone: step.settings?.collectPhone,
    // Choices (converted from options array)
    choices: step.settings?.options?.map((opt, i) => ({
      id: `opt_${i}`,
      label: opt,
    })),
  };

  const navigation: ApplicationStepNavigation = {
    action: step.navigation.action === 'go-to-step' ? 'go-to-step' : step.navigation.action,
    targetStepId: step.navigation.targetStepId,
    redirectUrl: step.navigation.redirectUrl,
  };

  return {
    id: step.id,
    type,
    fieldKey: getFieldKeyFromLegacyStep(step),
    settings,
    validation: step.settings?.required ? { required: true } : undefined,
    navigation,
  };
}

function getFieldKeyFromLegacyStep(step: ApplicationFlowStep): string {
  if (step.type === 'capture') {
    return 'identity';
  }
  if (step.type === 'question') {
    return `q_${step.id}`;
  }
  return step.id;
}

// ============ APPLICATION STEP → CAPTURE NODE ============

export function applicationStepToCaptureNode(step: ApplicationStep): CaptureNode {
  const typeMap: Record<ApplicationStepType, CaptureNodeType> = {
    'open-ended': 'open-ended',
    'single-choice': 'single-choice',
    'multi-choice': 'multi-choice',
    'email': 'email',
    'phone': 'phone',
    'name': 'name',
    'full-identity': 'email', // Fallback - full-identity doesn't exist in CaptureNode
    'date': 'date',
    'scale': 'scale',
    'yes-no': 'yes-no',
    'welcome': 'open-ended', // Fallback
    'ending': 'open-ended',  // Fallback
  };

  return {
    id: step.id,
    type: typeMap[step.type] || 'open-ended',
    fieldKey: step.fieldKey,
    settings: {
      title: step.settings.title,
      description: step.settings.description,
      placeholder: step.settings.placeholder,
      buttonText: step.settings.buttonText,
      align: step.settings.align,
      spacing: step.settings.spacing,
      inputStyle: step.settings.inputStyle as any,
      titleSize: step.settings.titleSize,
      buttonPreset: step.settings.buttonPreset,
      scaleMin: step.settings.scaleMin,
      scaleMax: step.settings.scaleMax,
      scaleMinLabel: step.settings.scaleMinLabel,
      scaleMaxLabel: step.settings.scaleMaxLabel,
      splitName: step.settings.splitName,
      choices: step.settings.choices?.map(c => ({
        id: c.id,
        label: c.label,
        emoji: c.emoji,
        imageUrl: c.imageUrl,
        goToNodeId: c.goToStepId,
      })),
      randomizeOrder: step.settings.randomizeOrder,
      allowMultiple: step.settings.allowMultiple,
    },
    validation: step.validation,
    navigation: {
      action: step.navigation.action === 'go-to-step' ? 'go-to-node' : step.navigation.action as any,
      targetNodeId: step.navigation.targetStepId,
      conditionalRoutes: step.navigation.conditionalRoutes?.map(r => ({
        choiceId: r.choiceId,
        targetNodeId: r.targetStepId,
      })),
    },
  };
}

// ============ FUNNEL STEP → APPLICATION STEPS ============

// Minimal shape for funnel step content that may contain application flow
interface FunnelStepContent {
  steps?: Array<{
    id: string;
    type: string;
    name?: string;
    settings?: Record<string, any>;
    navigation?: { action?: string; targetStepId?: string; redirectUrl?: string };
    elements?: any[];
  }>;
  displayMode?: string;
  showProgress?: boolean;
  [key: string]: any;
}

interface FunnelStep {
  id: string;
  step_type: string;
  content: FunnelStepContent;
}

/**
 * Converts a funnel step containing application-flow content to ApplicationSteps.
 * Returns null if the step is not an application-flow type.
 */
export function funnelStepToApplicationSteps(funnelStep: FunnelStep): ApplicationStep[] | null {
  if (funnelStep.step_type !== 'application_flow' && funnelStep.step_type !== 'application-flow') {
    return null;
  }

  const content = funnelStep.content;
  const steps = content.steps || [];

  return steps.map((step): ApplicationStep => {
    let type: ApplicationStepType = 'open-ended';

    // Map step type
    switch (step.type) {
      case 'welcome':
        type = 'welcome';
        break;
      case 'question':
        // Determine question type
        switch (step.settings?.questionType) {
          case 'multiple-choice': type = 'single-choice'; break;
          case 'text': type = 'open-ended'; break;
          case 'scale': type = 'scale'; break;
          case 'yes-no': type = 'yes-no'; break;
          default: type = 'single-choice';
        }
        break;
      case 'capture':
        const { collectEmail, collectPhone, collectName } = step.settings || {};
        const fieldCount = [collectEmail, collectPhone, collectName].filter(Boolean).length;
        if (fieldCount === 1) {
          if (collectEmail) type = 'email';
          else if (collectPhone) type = 'phone';
          else if (collectName) type = 'name';
        } else {
          type = 'full-identity';
        }
        break;
      case 'ending':
      case 'booking':
        type = 'ending';
        break;
      default:
        type = 'open-ended';
    }

    const settings = step.settings || {};

    return {
      id: step.id,
      type,
      fieldKey: step.type === 'capture' ? 'identity' : `q_${step.id}`,
      settings: {
        title: settings.title,
        description: settings.description,
        placeholder: settings.placeholder,
        buttonText: settings.buttonText,
        buttonPreset: settings.buttonPreset,
        align: settings.align,
        spacing: settings.spacing,
        // Identity
        collectName: settings.collectName,
        collectEmail: settings.collectEmail,
        collectPhone: settings.collectPhone,
        // Choices
        choices: settings.options?.map((opt: string, i: number) => ({
          id: `opt_${i}`,
          label: opt,
        })),
        // Scale
        scaleMax: settings.scaleMax,
        scaleMinLabel: settings.scaleMinLabel,
        scaleMaxLabel: settings.scaleMaxLabel,
      },
      navigation: {
        action: step.navigation?.action === 'submit' ? 'submit' : 'next',
        targetStepId: step.navigation?.targetStepId,
        redirectUrl: step.navigation?.redirectUrl,
      },
    };
  });
}

/**
 * Extracts application flow config from funnel step content.
 */
export function getApplicationFlowConfig(funnelStep: FunnelStep): {
  displayMode: 'one-at-a-time' | 'all-at-once';
  showProgress: boolean;
} | null {
  if (funnelStep.step_type !== 'application_flow' && funnelStep.step_type !== 'application-flow') {
    return null;
  }

  return {
    displayMode: (funnelStep.content.displayMode as 'one-at-a-time' | 'all-at-once') || 'one-at-a-time',
    showProgress: funnelStep.content.showProgress ?? true,
  };
}
