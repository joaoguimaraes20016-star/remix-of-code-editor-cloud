import React from 'react';
import { 
  Workflow, HelpCircle, UserCheck, GitBranch, X 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Block } from '@/flow-canvas/types/infostack';

const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export type CaptureFlowType = 'full-application' | 'inline-question' | 'inline-optin' | 'conditional-question';

interface CaptureFlowOption {
  id: CaptureFlowType;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

const captureFlowOptions: CaptureFlowOption[] = [
  {
    id: 'full-application',
    label: 'Full Application',
    description: 'Multiple questions inside one flow card (Typeform style)',
    icon: <Workflow size={20} />,
    iconBg: 'bg-indigo-500/10',
    iconColor: 'text-indigo-500',
  },
  {
    id: 'inline-question',
    label: 'One Question Screen',
    description: 'Best for one-question-per-page flows',
    icon: <HelpCircle size={20} />,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
  },
  {
    id: 'inline-optin',
    label: 'Inline Opt-In',
    description: 'Quick name + email capture',
    icon: <UserCheck size={20} />,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
  },
  {
    id: 'conditional-question',
    label: 'Conditional Question',
    description: 'Question shows only if previous answer matches',
    icon: <GitBranch size={20} />,
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
  },
];

// Template generators for each flow type
const createFullApplicationBlock = (): Block => ({
  id: generateId(),
  type: 'application-flow',
  label: 'Application',
  elements: [
    { id: generateId(), type: 'heading', content: 'Apply Now', props: { level: 1 } },
    { id: generateId(), type: 'text', content: 'Answer a few quick questions to get started.', props: { variant: 'subtext' } },
    { id: generateId(), type: 'button', content: 'Start Application →', props: { variant: 'primary', size: 'lg' } },
  ],
  props: {
    displayMode: 'one-at-a-time',
    showProgress: true,
    transition: 'slide-up',
    steps: [
      { 
        id: generateId(), 
        name: 'Welcome', 
        type: 'welcome', 
        elements: [
          { id: generateId(), type: 'heading', content: 'Welcome!', props: { level: 2 } },
          { id: generateId(), type: 'text', content: "Let's find out how we can help you.", props: {} },
        ], 
        navigation: { action: 'next' } 
      },
      { 
        id: generateId(), 
        name: 'Your Challenge', 
        type: 'question', 
        elements: [
          { id: generateId(), type: 'heading', content: "What's your biggest challenge?", props: { level: 2 } },
          { id: generateId(), type: 'radio', content: 'Not enough leads', props: { name: 'challenge', value: 'leads' } },
          { id: generateId(), type: 'radio', content: 'Low conversions', props: { name: 'challenge', value: 'conversions' } },
          { id: generateId(), type: 'radio', content: "Can't scale", props: { name: 'challenge', value: 'scale' } },
        ], 
        navigation: { action: 'next' } 
      },
      { 
        id: generateId(), 
        name: 'Your Info', 
        type: 'capture', 
        elements: [
          { id: generateId(), type: 'heading', content: 'Almost there!', props: { level: 2 } },
          { id: generateId(), type: 'input', content: '', props: { type: 'text', placeholder: 'Your name', required: true, fieldKey: 'name' } },
          { id: generateId(), type: 'input', content: '', props: { type: 'email', placeholder: 'Your email', required: true, fieldKey: 'email' } },
        ], 
        navigation: { action: 'next' } 
      },
      { 
        id: generateId(), 
        name: 'Thank You', 
        type: 'ending', 
        elements: [
          { id: generateId(), type: 'heading', content: 'Thank you!', props: { level: 2 } },
          { id: generateId(), type: 'text', content: "We'll be in touch soon.", props: {} },
        ], 
        navigation: { action: 'submit' } 
      },
    ]
  },
});

const createInlineQuestionBlock = (): Block => ({
  id: generateId(),
  type: 'form-field',
  label: 'Question Screen',
  elements: [
    { id: generateId(), type: 'text', content: 'QUESTION SCREEN', props: { variant: 'tag' } },
    { id: generateId(), type: 'heading', content: 'What is your biggest challenge?', props: { level: 2 } },
    { id: generateId(), type: 'radio', content: 'Not enough leads', props: { name: 'challenge', value: 'leads' } },
    { id: generateId(), type: 'radio', content: 'Low conversions', props: { name: 'challenge', value: 'conversions' } },
    { id: generateId(), type: 'radio', content: "Can't scale", props: { name: 'challenge', value: 'scale' } },
    { id: generateId(), type: 'button', content: 'Continue', props: { variant: 'primary', size: 'lg' } },
  ],
  props: { trackingId: '', intent: 'qualify' },
});

const createInlineOptinBlock = (): Block => ({
  id: generateId(),
  type: 'form-field',
  label: 'Opt-In Form',
  elements: [
    { id: generateId(), type: 'heading', content: 'Get Instant Access', props: { level: 2 } },
    { id: generateId(), type: 'text', content: 'Enter your details below.', props: { variant: 'subtext' } },
    { id: generateId(), type: 'text', content: 'Name', props: { variant: 'label' } },
    { id: generateId(), type: 'input', content: '', props: { type: 'text', placeholder: 'Your name', required: true, fieldKey: 'name', icon: 'user' } },
    { id: generateId(), type: 'text', content: 'Email', props: { variant: 'label' } },
    { id: generateId(), type: 'input', content: '', props: { type: 'email', placeholder: 'you@example.com', required: true, fieldKey: 'email', icon: 'mail' } },
    { id: generateId(), type: 'button', content: 'Get Access', props: { variant: 'primary', size: 'lg' } },
  ],
  props: { trackingId: '', intent: 'capture' },
});

const createConditionalQuestionBlock = (): Block => ({
  id: generateId(),
  type: 'form-field',
  label: 'Conditional Question',
  elements: [
    { id: generateId(), type: 'heading', content: 'Tell us more...', props: { level: 2 } },
    { id: generateId(), type: 'input', content: '', props: { type: 'text', placeholder: 'Your answer...', required: true, fieldKey: 'conditional_answer' } },
    { id: generateId(), type: 'button', content: 'Continue', props: { variant: 'primary', size: 'lg' } },
  ],
  props: { 
    trackingId: '', 
    intent: 'qualify',
    visibility: {
      conditions: [
        { field: 'previous_field', operator: 'equals', value: '' }
      ]
    }
  },
});

interface CaptureFlowSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFlow: (block: Block) => void;
}

export const CaptureFlowSelector: React.FC<CaptureFlowSelectorProps> = ({
  isOpen,
  onClose,
  onSelectFlow,
}) => {
  const handleSelectFlow = (flowType: CaptureFlowType) => {
    let block: Block;
    
    switch (flowType) {
      case 'full-application':
        block = createFullApplicationBlock();
        break;
      case 'inline-question':
        block = createInlineQuestionBlock();
        break;
      case 'inline-optin':
        block = createInlineOptinBlock();
        break;
      case 'conditional-question':
        block = createConditionalQuestionBlock();
        break;
      default:
        block = createInlineQuestionBlock();
    }
    
    onSelectFlow(block);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-builder-surface border-builder-border">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-semibold text-builder-text flex items-center gap-2">
            <Workflow size={20} className="text-builder-accent" />
            Add Capture Flow
          </DialogTitle>
          <p className="text-sm text-builder-text-muted mt-1">
            Choose how you want to capture leads
          </p>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {captureFlowOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelectFlow(option.id)}
              className="w-full flex items-start gap-3 p-3 rounded-lg border border-builder-border hover:border-builder-accent/50 hover:bg-builder-surface-hover transition-all text-left group"
            >
              <div className={`w-10 h-10 rounded-lg ${option.iconBg} ${option.iconColor} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                {option.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-builder-text group-hover:text-builder-accent transition-colors">
                  {option.label}
                </div>
                <div className="text-xs text-builder-text-muted mt-0.5">
                  {option.description}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Flow guidance footer */}
        <div className="mt-4 pt-3 border-t border-builder-border">
          <p className="text-[11px] text-builder-text-dim text-center">
            💡 Typical flow: <span className="text-builder-text-muted">Qualify → Capture → Book → Thank You</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CaptureFlowSelector;
