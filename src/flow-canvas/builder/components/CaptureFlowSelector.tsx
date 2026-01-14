import React from 'react';
import { 
  Workflow, HelpCircle, UserCheck, GitBranch
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
}

const captureFlowOptions: CaptureFlowOption[] = [
  {
    id: 'full-application',
    label: 'Full Application',
    description: 'Multiple questions inside one flow card (Typeform style)',
    icon: <Workflow size={20} />,
  },
  {
    id: 'inline-question',
    label: 'One Question Screen',
    description: 'Best for one-question-per-page flows',
    icon: <HelpCircle size={20} />,
  },
  {
    id: 'inline-optin',
    label: 'Inline Opt-In',
    description: 'Quick name + email capture',
    icon: <UserCheck size={20} />,
  },
  {
    id: 'conditional-question',
    label: 'Conditional Question',
    description: 'Question shows only if previous answer matches',
    icon: <GitBranch size={20} />,
  },
];

// Template generators for each flow type
const createFullApplicationBlock = (): Block => ({
  id: generateId(),
  type: 'application-flow',
  label: 'Application',
  elements: [
    { id: generateId(), type: 'heading', content: 'Apply Now', props: { level: 1 } },
    { id: generateId(), type: 'text', content: 'Answer a few quick questions to see if we\'re a good fit.', props: { variant: 'subtext' } },
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
        settings: {
          // Sync with block.elements - Welcome = Apply Section
          title: 'Apply Now',
          description: 'Answer a few quick questions to see if we\'re a good fit.',
          buttonText: 'Start Application →',
          buttonColor: '#18181b',
        },
        elements: [], 
        navigation: { action: 'next' } 
      },
      { 
        id: generateId(), 
        name: 'Your Challenge', 
        type: 'question',
        settings: {
          title: 'What\'s your biggest challenge right now?',
          questionType: 'multiple-choice',
          options: [
            'Not enough leads',
            'Low conversion rates', 
            'Unclear offer / positioning',
            'Need a repeatable system'
          ],
          required: true,
          buttonText: 'Continue',
          buttonColor: '#18181b',
        },
        elements: [], 
        navigation: { action: 'next' } 
      },
      { 
        id: generateId(), 
        name: 'Your Situation', 
        type: 'question',
        settings: {
          title: 'Briefly describe your current situation.',
          questionType: 'text',
          description: 'What are you working on and where do you want to be?',
          required: true,
          buttonText: 'Continue',
          buttonColor: '#18181b',
        },
        elements: [], 
        navigation: { action: 'next' } 
      },
      { 
        id: generateId(), 
        name: 'Your Info', 
        type: 'capture',
        settings: {
          title: 'Where should we send your results?',
          buttonText: 'Submit Application',
          buttonColor: '#18181b',
        },
        elements: [
          { id: generateId(), type: 'input', content: '', props: { type: 'text', placeholder: 'Your name', required: true, fieldKey: 'name' } },
          { id: generateId(), type: 'input', content: '', props: { type: 'email', placeholder: 'Your email', required: true, fieldKey: 'email' } },
        ], 
        navigation: { action: 'next' } 
      },
      { 
        id: generateId(), 
        name: 'Thank You', 
        type: 'ending',
        settings: {
          title: 'Thanks — we\'ll be in touch.',
          description: 'We\'ll review your answers and reach out shortly.',
          buttonText: 'Done',
          buttonColor: '#18181b',
        },
        elements: [], 
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
      <DialogContent className="sm:max-w-lg bg-background border-border">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Workflow size={20} className="text-muted-foreground" />
            Add Capture Flow
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Choose how you want to capture leads
          </p>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {captureFlowOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelectFlow(option.id)}
              className="w-full flex items-start gap-3 p-3 rounded-lg border border-border hover:border-foreground/30 hover:bg-accent transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                {option.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground group-hover:text-foreground transition-colors">
                  {option.label}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Flow guidance footer */}
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-[11px] text-muted-foreground text-center">
            💡 Typical flow: <span className="text-muted-foreground">Qualify → Capture → Book → Thank You</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CaptureFlowSelector;