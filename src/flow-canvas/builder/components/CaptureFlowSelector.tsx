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
    label: 'Contact Fields',
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
          collectName: true,
          collectEmail: true,
          collectPhone: false,
        },
        elements: [], 
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
  type: 'application-flow',
  label: 'Question Screen',
  elements: [],
  props: {
    displayMode: 'one-at-a-time',
    showProgress: false,
    transition: 'fade',
    steps: [
      {
        id: generateId(),
        name: 'Your Challenge',
        type: 'question',
        settings: {
          title: 'What is your biggest challenge?',
          questionType: 'multiple-choice',
          options: ['Not enough leads', 'Low conversions', "Can't scale"],
          buttonText: 'Continue',
          buttonColor: '#18181b',
        },
        elements: [],
        navigation: { action: 'next' },
      },
      {
        id: generateId(),
        name: 'Thank You',
        type: 'ending',
        settings: {
          title: "Thanks — we'll be in touch!",
        },
        elements: [],
        navigation: { action: 'submit' },
      },
    ],
  },
});

const createInlineOptinBlock = (): Block => ({
  id: generateId(),
  type: 'application-flow',
  label: 'Contact Fields',
  elements: [],
  props: {
    displayMode: 'one-at-a-time',
    showProgress: false,
    transition: 'fade',
    steps: [
      {
        id: generateId(),
        name: 'Get Access',
        type: 'capture',
        settings: {
          title: 'Get Instant Access',
          description: 'Enter your details below.',
          collectName: true,
          collectEmail: true,
          collectPhone: false,
          buttonText: 'Get Access',
          buttonColor: '#18181b',
        },
        elements: [],
        navigation: { action: 'submit' },
      },
    ],
  },
});

const createConditionalQuestionBlock = (): Block => ({
  id: generateId(),
  type: 'application-flow',
  label: 'Conditional Question',
  elements: [],
  props: {
    displayMode: 'one-at-a-time',
    showProgress: false,
    transition: 'fade',
    steps: [
      {
        id: generateId(),
        name: 'Tell Us More',
        type: 'question',
        settings: {
          title: 'Tell us more...',
          questionType: 'text',
          buttonText: 'Continue',
          buttonColor: '#18181b',
        },
        elements: [],
        navigation: { action: 'next' },
      },
      {
        id: generateId(),
        name: 'Thank You',
        type: 'ending',
        settings: {
          title: "Thanks — we'll be in touch!",
        },
        elements: [],
        navigation: { action: 'submit' },
      },
    ],
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