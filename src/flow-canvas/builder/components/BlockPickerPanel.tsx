import React, { useState } from 'react';
import { 
  Plus, Search, Type, Image, MousePointer, 
  Mail, Phone, User, UserCheck, ChevronRight, ChevronDown,
  HelpCircle, ListChecks, Video, FileText, X, ArrowLeft, Layers, Calendar, Workflow
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Block, ApplicationFlowStep, ApplicationStepType, ApplicationFlowStepSettings, QuestionType } from '@/flow-canvas/types/infostack';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';


const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ============ TYPE DEFINITIONS ============

interface BlockTemplate {
  type: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  template: () => Block;
}

interface BlockCategory {
  id: string;
  label: string;
  hint?: string;
  blocks: BlockTemplate[];
  defaultOpen?: boolean;
}

type AddMode = 'block' | 'section';

interface BlockPickerPanelProps {
  onAddBlock: (block: Block, options?: { type: AddMode }) => void;
  onClose: () => void;
  targetSectionId?: string | null;
  /** When true, hides the Sections tab (used when adding content inside an existing section) */
  hideSecionsTab?: boolean;
  /** Which tab to start on */
  initialTab?: ActiveTab;
  /** ID of the active Application Flow block (if one exists) */
  activeApplicationFlowBlockId?: string | null;
  /** Callback to add a step to existing Application Flow */
  onAddApplicationFlowStep?: (step: ApplicationFlowStep) => void;
  /** Callback to create a new Application Flow with an initial step */
  onCreateApplicationFlowWithStep?: (step: ApplicationFlowStep) => void;
}

type ActiveTab = 'blocks' | 'sections';

// ============ APPLICATION QUESTIONS (prioritized first) ============

const applicationQuestions: BlockTemplate[] = [
  {
    type: 'application-step',
    label: 'Open-Ended Question',
    icon: <Type size={16} />,
    description: 'Free text answer',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Open Question',
      elements: [
        { id: generateId(), type: 'heading', content: 'What is your biggest challenge right now?', props: { level: 3 } },
        { id: generateId(), type: 'input', content: '', props: { type: 'text', placeholder: 'Type your answer...', required: true, fieldKey: 'challenge' } },
        { id: generateId(), type: 'button', content: 'Continue', props: { variant: 'primary', action: 'next-step' } },
      ],
      props: { trackingId: '', intent: 'qualify' },
    }),
  },
  {
    type: 'application-step',
    label: 'Single Choice',
    icon: <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-current" /></div>,
    description: 'Radio — pick one',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Single Choice',
      elements: [
        { id: generateId(), type: 'heading', content: 'What best describes you?', props: { level: 3 } },
        { id: generateId(), type: 'radio', content: 'Just getting started', props: { name: 'stage', value: 'beginner' } },
        { id: generateId(), type: 'radio', content: 'Growing my business', props: { name: 'stage', value: 'growing' } },
        { id: generateId(), type: 'radio', content: 'Scaling to 7+ figures', props: { name: 'stage', value: 'scaling' } },
        { id: generateId(), type: 'button', content: 'Continue', props: { variant: 'primary', action: 'next-step' } },
      ],
      props: { trackingId: '', intent: 'qualify' },
    }),
  },
  {
    type: 'application-step',
    label: 'Multiple Choice',
    icon: <ListChecks size={16} />,
    description: 'Checkboxes — pick many',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Multiple Choice',
      elements: [
        { id: generateId(), type: 'heading', content: 'What are you looking for? (Select all)', props: { level: 3 } },
        { id: generateId(), type: 'checkbox', content: 'More leads', props: { name: 'goals', value: 'leads' } },
        { id: generateId(), type: 'checkbox', content: 'Higher conversions', props: { name: 'goals', value: 'conversions' } },
        { id: generateId(), type: 'checkbox', content: 'Better retention', props: { name: 'goals', value: 'retention' } },
        { id: generateId(), type: 'button', content: 'Continue', props: { variant: 'primary', action: 'next-step' } },
      ],
      props: { trackingId: '', intent: 'qualify' },
    }),
  },
];

// ============ CAPTURE FIELDS ============

const captureFields: BlockTemplate[] = [
  {
    type: 'application-step',
    label: 'Email Field',
    icon: <Mail size={16} />,
    description: 'Email with validation',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Email Capture',
      elements: [
        { id: generateId(), type: 'heading', content: 'What is your email?', props: { level: 3 } },
        { id: generateId(), type: 'text', content: 'We\'ll send your results here.', props: { variant: 'subtext' } },
        { id: generateId(), type: 'input', content: '', props: { type: 'email', placeholder: 'you@example.com', required: true, fieldKey: 'email', icon: 'mail' } },
        { id: generateId(), type: 'button', content: 'Continue', props: { variant: 'primary', action: 'next-step' } },
      ],
      props: { trackingId: '', intent: 'capture' },
    }),
  },
  {
    type: 'application-step',
    label: 'Phone Field',
    icon: <Phone size={16} />,
    description: 'Phone with formatting',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Phone Capture',
      elements: [
        { id: generateId(), type: 'heading', content: 'What is your phone number?', props: { level: 3 } },
        { id: generateId(), type: 'text', content: 'For important updates only.', props: { variant: 'subtext' } },
        { id: generateId(), type: 'input', content: '', props: { type: 'tel', placeholder: '+1 (555) 000-0000', required: true, fieldKey: 'phone', icon: 'phone' } },
        { id: generateId(), type: 'button', content: 'Continue', props: { variant: 'primary', action: 'next-step' } },
      ],
      props: { trackingId: '', intent: 'capture' },
    }),
  },
  {
    type: 'application-step',
    label: 'Name Field',
    icon: <User size={16} />,
    description: 'Full name input',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Name',
      elements: [
        { id: generateId(), type: 'heading', content: 'What is your name?', props: { level: 3 } },
        { id: generateId(), type: 'input', content: '', props: { type: 'text', placeholder: 'Your full name', required: true, fieldKey: 'name', icon: 'user' } },
        { id: generateId(), type: 'button', content: 'Continue', props: { variant: 'primary', action: 'next-step' } },
      ],
      props: { trackingId: '', intent: 'capture' },
    }),
  },
  {
    type: 'application-step',
    label: 'Contact Info Opt-In',
    icon: <UserCheck size={16} />,
    description: 'Collect name, email, phone — can show as popup',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Contact Info',
      elements: [
        { id: generateId(), type: 'heading', content: 'Complete your application', props: { level: 2 } },
        { id: generateId(), type: 'text', content: 'Enter your details to continue.', props: { variant: 'subtext' } },
        { id: generateId(), type: 'text', content: 'Full Name', props: { variant: 'label' } },
        { id: generateId(), type: 'input', content: '', props: { type: 'text', placeholder: 'Your name', required: true, fieldKey: 'name', icon: 'user' } },
        { id: generateId(), type: 'text', content: 'Email', props: { variant: 'label' } },
        { id: generateId(), type: 'input', content: '', props: { type: 'email', placeholder: 'you@example.com', required: true, fieldKey: 'email', icon: 'mail' } },
        { id: generateId(), type: 'text', content: 'Phone', props: { variant: 'label' } },
        { id: generateId(), type: 'input', content: '', props: { type: 'tel', placeholder: '+1 (555) 000-0000', required: false, fieldKey: 'phone', icon: 'phone' } },
        { id: generateId(), type: 'button', content: 'Submit Application', props: { variant: 'primary', size: 'lg', action: 'submit' } },
      ],
      props: { trackingId: '', intent: 'capture' },
    }),
  },
];

// ============ CONTENT BLOCKS ============

const contentBlocks: BlockTemplate[] = [
  {
    type: 'heading',
    label: 'Heading',
    icon: <FileText size={16} />,
    description: 'Question or section title',
    template: () => ({
      id: generateId(),
      type: 'text-block',
      label: 'Heading',
      elements: [{ id: generateId(), type: 'heading', content: 'Your main headline', props: { level: 2 } }],
      props: {},
    }),
  },
  {
    type: 'text-block',
    label: 'Text',
    icon: <Type size={16} />,
    description: 'Paragraph or body copy',
    template: () => ({
      id: generateId(),
      type: 'text-block',
      label: 'Text',
      elements: [{ id: generateId(), type: 'text', content: 'Your supporting text goes here. Keep it short and persuasive.', props: {} }],
      props: {},
    }),
  },
  {
    type: 'media',
    label: 'Image',
    icon: <Image size={16} />,
    description: 'Photo or graphic',
    template: () => ({
      id: generateId(),
      type: 'media',
      label: 'Image',
      elements: [{ id: generateId(), type: 'image', content: '', props: { alt: 'Image', src: '' } }],
      props: { aspectRatio: '16:9' },
    }),
  },
  {
    type: 'video',
    label: 'Video',
    icon: <Video size={16} />,
    description: 'Embed video',
    template: () => ({
      id: generateId(),
      type: 'media',
      label: 'Video',
      elements: [{ id: generateId(), type: 'video', content: '', props: { src: '', autoplay: false } }],
      props: { aspectRatio: '16:9' },
    }),
  },
];

// ============ BUTTONS & ACTIONS ============
// NOTE: Only non-interactive actions here. Interactive blocks (booking, flows) are in Interactive category.

const actionBlocks: BlockTemplate[] = [
  {
    type: 'cta',
    label: 'Submit Button',
    icon: <MousePointer size={16} />,
    description: 'Triggers form submission + next action',
    template: () => ({
      id: generateId(),
      type: 'cta',
      label: 'Button',
      elements: [{ id: generateId(), type: 'button', content: 'Continue', props: { variant: 'primary' } }],
      props: { action: 'next-step', href: '' },
    }),
  },
];

// ============ SCHEDULING & BOOKING ============
// Moved from Actions to Interactive since it collects data

const bookingBlocks: BlockTemplate[] = [
  {
    type: 'booking',
    label: 'Book a Call',
    icon: <Calendar size={16} />,
    description: 'Calendly embed — schedule appointments',
    template: () => ({
      id: generateId(),
      type: 'booking',
      label: 'Book a Call',
      elements: [
        { id: generateId(), type: 'heading', content: 'Schedule Your Call', props: { level: 2 } },
        { id: generateId(), type: 'text', content: 'Pick a time that works best for you.', props: { variant: 'subtext' } },
      ],
      props: { calendlyUrl: '', intent: 'schedule' },
    }),
  },
];

// ============ FLOW CONTAINER ============
// A container for grouping multiple interactive blocks into a Typeform-style experience

const flowTemplates: BlockTemplate[] = [
  {
    type: 'application-flow',
    label: 'Flow Container',
    icon: <Workflow size={16} />,
    description: 'Group questions into a Typeform-style experience',
    template: () => ({
      id: generateId(),
      type: 'application-flow',
      label: 'Application',
      elements: [],
      props: {
        displayMode: 'one-at-a-time',
        showProgress: true,
        transition: 'slide-up',
        background: { type: 'solid', color: '#ffffff' },
        textColor: '#000000',
        inputBackground: '#ffffff',
        inputBorderColor: '#e5e7eb',
        steps: [
          {
            id: generateId(),
            name: 'Welcome',
            type: 'welcome',
            settings: {
              title: 'Apply Now',
              description: 'Complete your application below.',
              buttonText: 'Start →',
              align: 'center',
              spacing: 'normal',
            },
            elements: [],
            navigation: { action: 'next' },
          },
          {
            id: generateId(),
            name: 'Question',
            type: 'question',
            settings: {
              title: 'What is your biggest challenge?',
              questionType: 'multiple-choice',
              options: ['Not enough leads', 'Low conversions', "Can't scale"],
              buttonText: 'Continue',
              align: 'center',
              spacing: 'normal',
            },
            elements: [],
            navigation: { action: 'next' },
          },
          {
            id: generateId(),
            name: 'Your Info',
            type: 'capture',
            settings: {
              title: 'Where should we send your results?',
              collectName: true,
              collectEmail: true,
              collectPhone: false,
              buttonText: 'Submit',
              align: 'center',
              spacing: 'normal',
            },
            elements: [],
            navigation: { action: 'submit' },
          },
        ],
      },
    }),
  },
];

// ============ BLOCK CATEGORIES ============

// Unified "Interactive" category - consolidates all data-collection blocks + flows
// Order: Questions → Capture Fields → Booking → Flow Container
const interactiveBlocks: BlockTemplate[] = [
  ...applicationQuestions,
  ...captureFields,
  ...bookingBlocks,
  ...flowTemplates, // Flow Container at the end - it's a grouping feature, not a primary block
];

const blockCategories: BlockCategory[] = [
  {
    id: 'interactive',
    label: 'Interactive',
    hint: 'Questions, lead capture & scheduling',
    blocks: interactiveBlocks,
    defaultOpen: true, // Interactive blocks are the core use case
  },
  {
    id: 'content',
    label: 'Content',
    hint: 'Text, images, and media',
    blocks: contentBlocks,
    defaultOpen: false,
  },
  {
    id: 'actions',
    label: 'Actions',
    hint: 'Buttons and navigation',
    blocks: actionBlocks,
    defaultOpen: false,
  },
];

// ============ SECTION TEMPLATES ============

interface SectionCategory {
  id: string;
  label: string;
  hint?: string;
  sections: BlockTemplate[];
  defaultOpen?: boolean;
}

const contentSections: BlockTemplate[] = [
  {
    type: 'hero',
    label: 'Welcome / Hero',
    icon: <Layers size={16} />,
    description: 'First impression with CTA',
    template: () => ({
      id: generateId(),
      type: 'hero',
      label: 'Welcome',
      elements: [
        { id: generateId(), type: 'heading', content: 'Welcome! Let\'s Get Started', props: { level: 1 } },
        { id: generateId(), type: 'text', content: 'Answer a few quick questions to see if we\'re a good fit.', props: { variant: 'subtext' } },
        { id: generateId(), type: 'button', content: 'Start Application', props: { variant: 'primary', size: 'lg' } },
      ],
      props: { intent: 'collect' },
    }),
  },
  {
    type: 'testimonial',
    label: 'Testimonial',
    icon: <FileText size={16} />,
    description: 'Social proof',
    template: () => ({
      id: generateId(),
      type: 'testimonial',
      label: 'Testimonial',
      elements: [
        { id: generateId(), type: 'text', content: '"This completely transformed my business. I went from struggling to scaling in just 3 months."', props: { variant: 'quote' } },
        { id: generateId(), type: 'text', content: '— Sarah M., Agency Owner', props: { variant: 'caption' } },
      ],
      props: {},
    }),
  },
  {
    type: 'text-block',
    label: 'Thank You',
    icon: <HelpCircle size={16} />,
    description: 'Confirmation screen',
    template: () => ({
      id: generateId(),
      type: 'text-block',
      label: 'Thank You',
      elements: [
        { id: generateId(), type: 'heading', content: 'You\'re All Set! 🎉', props: { level: 1 } },
        { id: generateId(), type: 'text', content: 'We\'ve received your application. Check your inbox for next steps.', props: { variant: 'subtext' } },
      ],
      props: { intent: 'complete' },
    }),
  },
];

const advancedSections: BlockTemplate[] = [
  {
    type: 'custom',
    label: 'Empty Section',
    icon: <Plus size={16} />,
    description: 'Build from scratch',
    template: () => ({
      id: generateId(),
      type: 'custom',
      label: 'Section',
      elements: [],
      props: {},
    }),
  },
];

// Sections are purely visual - no behavioral/capture logic
const sectionCategories: SectionCategory[] = [
  {
    id: 'content',
    label: 'Content Sections',
    hint: 'Pre-designed layouts for your page',
    sections: contentSections,
    defaultOpen: true,
  },
  {
    id: 'advanced',
    label: 'Advanced',
    hint: 'Build from scratch',
    sections: advancedSections,
    defaultOpen: false,
  },
];

// ============ COLLAPSIBLE CATEGORY COMPONENT ============

// Categories that should add to Application Engine instead of standalone blocks
const APPLICATION_ENGINE_CATEGORIES = ['interactive'];

interface CollapsibleCategoryProps {
  category: BlockCategory | SectionCategory;
  onAddBlock: (template: BlockTemplate, isSection: boolean, categoryId?: string) => void;
  isSection?: boolean;
  activeApplicationFlowBlockId?: string | null;
}

const CollapsibleCategory: React.FC<CollapsibleCategoryProps> = ({ 
  category, 
  onAddBlock,
  isSection = false,
  activeApplicationFlowBlockId,
}) => {
  const [isOpen, setIsOpen] = useState(category.defaultOpen ?? false);
  const blocks = 'blocks' in category ? category.blocks : category.sections;
  const hint = 'hint' in category ? category.hint : undefined;

  // Check if this category routes to Application Engine (only show badge when flow exists)
  const isFlowCategory = APPLICATION_ENGINE_CATEGORIES.includes(category.id);
  const showFlowBadge = isFlowCategory && activeApplicationFlowBlockId;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between px-2 py-2.5 rounded-lg hover:bg-builder-surface-hover transition-colors group">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown size={14} className="text-builder-text-muted" />
            ) : (
              <ChevronRight size={14} className="text-builder-text-muted" />
            )}
            <span className="text-sm font-medium text-builder-text">{category.label}</span>
            <span className="text-[10px] text-builder-text-dim bg-builder-surface-active px-1.5 py-0.5 rounded">
              {blocks.length}
            </span>
            {showFlowBadge && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                → Flow
              </span>
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-4 pr-1 pb-2">
          {hint && (
            <p className="text-[10px] text-builder-accent mb-2 ml-2">{hint}</p>
          )}
          <div className="space-y-0.5">
            {blocks.map((block, idx) => (
              <button
                key={`${block.label}-${idx}`}
                onClick={() => onAddBlock(block, isSection, category.id)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-builder-surface-hover transition-colors text-left group"
              >
                <div className="w-7 h-7 rounded-md bg-builder-surface-active flex items-center justify-center text-builder-text-muted group-hover:text-builder-accent group-hover:bg-builder-accent/10 transition-colors">
                  {block.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-builder-text">{block.label}</div>
                  <div className="text-[10px] text-builder-text-dim">{block.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// ============ COMPONENT ============

export const BlockPickerPanel: React.FC<BlockPickerPanelProps> = ({
  onAddBlock,
  onClose,
  targetSectionId,
  hideSecionsTab = false,
  initialTab = 'blocks',
  activeApplicationFlowBlockId,
  onAddApplicationFlowStep,
  onCreateApplicationFlowWithStep,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);

  // Use the module-level constant for Application Flow categories
  // (defined at top of file for use in CollapsibleCategory)

  // Convert block template to Application Flow step
  const blockTemplateToFlowStep = (
    blockLabel: string, 
    blockType: string,
    template: Block
  ): ApplicationFlowStep => {
    const id = `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Map form-field block types to Application Flow step types
    if (blockType === 'form-field') {
      const intent = template.props?.intent as string | undefined;
      const hasInputs = template.elements.some(e => e.type === 'input');
      const hasRadio = template.elements.some(e => e.type === 'radio');
      const hasCheckbox = template.elements.some(e => e.type === 'checkbox');
      
      // Determine step type
      let stepType: ApplicationStepType = 'question';
      if (intent === 'capture' || blockLabel.includes('Email') || blockLabel.includes('Phone') || blockLabel.includes('Name')) {
        stepType = 'capture';
      }
      
      // Extract question type
      let questionType: QuestionType | undefined;
      if (hasRadio) questionType = 'multiple-choice';
      else if (hasCheckbox) questionType = 'multiple-choice';
      else if (hasInputs) questionType = 'text';
      
      // Extract title from heading element
      const headingEl = template.elements.find(e => e.type === 'heading');
      const title = headingEl?.content || blockLabel;
      
      // Extract description from text element (if any)
      const textEl = template.elements.find(e => e.type === 'text');
      const description = textEl?.content || '';
      
      // Extract options from radio/checkbox elements
      const options = template.elements
        .filter(e => e.type === 'radio' || e.type === 'checkbox')
        .map(e => e.content);
      
      // Extract button text
      const buttonEl = template.elements.find(e => e.type === 'button');
      const buttonText = buttonEl?.content || 'Continue';
      
      // Build settings based on step type
      const settings: ApplicationFlowStepSettings = {
        title,
        description: description || undefined,
        buttonText,
        buttonColor: '#18181b',
        questionType,
        options: options.length > 0 ? options : undefined,
        required: true,
      };
      
      // For capture steps, determine which fields to collect
      if (stepType === 'capture') {
        const labelLower = blockLabel.toLowerCase();
        const hasNameInput = template.elements.some(e => 
          e.props?.fieldKey === 'name' || (typeof e.props?.placeholder === 'string' && e.props.placeholder.toLowerCase().includes('name'))
        );
        const hasEmailInput = template.elements.some(e => 
          e.props?.type === 'email' || e.props?.fieldKey === 'email'
        );
        const hasPhoneInput = template.elements.some(e => 
          e.props?.type === 'tel' || e.props?.fieldKey === 'phone'
        );
        
        // Check both label and elements for field types
        settings.collectName = labelLower.includes('name') || hasNameInput || labelLower.includes('full');
        settings.collectEmail = labelLower.includes('email') || hasEmailInput || (!settings.collectName && !hasPhoneInput);
        settings.collectPhone = labelLower.includes('phone') || hasPhoneInput;
        
        // Default: if a "Full Form" or generic capture, enable all fields
        if (labelLower.includes('full') || labelLower.includes('opt-in') || labelLower.includes('application')) {
          settings.collectName = true;
          settings.collectEmail = true;
          settings.collectPhone = hasPhoneInput;
        }
      }
      
      return {
        id,
        name: blockLabel,
        type: stepType,
        elements: [],
        settings,
        navigation: { action: 'next' },
      };
    }
    
    return {
      id,
      name: blockLabel,
      type: 'question',
      elements: [],
      settings: { title: blockLabel, buttonText: 'Continue' },
      navigation: { action: 'next' },
    };
  };

  // Check if a template belongs to Application Engine categories
  const isApplicationFlowCategory = (categoryId: string) => {
    return APPLICATION_ENGINE_CATEGORIES.includes(categoryId);
  };

  // All templates for search
  const allTemplates = [
    ...applicationQuestions.map(b => ({ ...b, isSection: false, categoryId: 'interactive' })),
    ...captureFields.map(b => ({ ...b, isSection: false, categoryId: 'interactive' })),
    ...bookingBlocks.map(b => ({ ...b, isSection: false, categoryId: 'interactive' })),
    ...contentBlocks.map(b => ({ ...b, isSection: false, categoryId: 'content' })),
    ...actionBlocks.map(b => ({ ...b, isSection: false, categoryId: 'actions' })),
    ...flowTemplates.map(t => ({ ...t, isSection: false, categoryId: 'interactive' })), // Flow container is a block, not a section
    ...contentSections.map(t => ({ ...t, isSection: true, categoryId: 'content-sections' })),
    ...advancedSections.map(t => ({ ...t, isSection: true, categoryId: 'advanced' })),
  ];

  const filteredResults = searchQuery.length > 0
    ? allTemplates.filter(t => 
        t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleAddBlock = (template: BlockTemplate, isSection: boolean = false, categoryId?: string) => {
    // Check if this is a Flow Container (application-flow) - those should be added as standalone
    const isFlowContainer = template.type === 'application-flow';
    
    // Check if this is an application question/capture
    const isApplicationContent = categoryId && isApplicationFlowCategory(categoryId) && !isFlowContainer;
    
    // ONLY add to existing flow if:
    // 1. A flow is actively SELECTED (not just exists on the page)
    // 2. The block is an interactive question/capture (not a Flow Container)
    // 3. The callback exists
    if (isApplicationContent && activeApplicationFlowBlockId && onAddApplicationFlowStep) {
      // Convert to flow step and add to existing selected flow
      const step = blockTemplateToFlowStep(template.label, template.type, template.template());
      onAddApplicationFlowStep(step);
      onClose();
      return;
    }
    
    // DEFAULT BEHAVIOR: Add as standalone block
    // Interactive blocks (questions, capture fields) are now first-class blocks
    // They can be placed anywhere on the canvas just like Perspective.co
    onAddBlock(template.template(), { type: isSection ? 'section' : 'block' });
    onClose();
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-builder-surface">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-builder-border">
        <div className="flex items-center gap-2">
          <button 
            onClick={onClose}
            className="p-1 rounded hover:bg-builder-surface-hover text-builder-text-muted hover:text-builder-text transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-sm font-medium text-builder-text">Add Content</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded hover:bg-builder-surface-hover text-builder-text-muted hover:text-builder-text transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tab Switcher - only show when sections tab is available */}
      {!hideSecionsTab && (
        <div className="flex-shrink-0 flex p-2 gap-1 border-b border-builder-border-subtle">
          <button
            onClick={() => setActiveTab('blocks')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
              activeTab === 'blocks'
                ? "bg-builder-accent text-white"
                : "bg-builder-surface-hover text-builder-text-muted hover:text-builder-text"
            )}
          >
            <Plus size={14} />
            <span>Content</span>
          </button>
          <button
            onClick={() => setActiveTab('sections')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
              activeTab === 'sections'
                ? "bg-builder-accent text-white"
                : "bg-builder-surface-hover text-builder-text-muted hover:text-builder-text"
            )}
          >
            <Layers size={14} />
            <span>Sections</span>
          </button>
        </div>
      )}

      {/* Search */}
      <div className="flex-shrink-0 p-3 border-b border-builder-border-subtle">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-builder-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'blocks' ? "Search content..." : "Search sections..."}
            className="pl-9 h-8 text-sm bg-builder-surface-hover border-builder-border text-builder-text placeholder:text-builder-text-dim"
          />
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {searchQuery.length > 0 ? (
          // Search Results
          <div className="p-2 pb-20">
            {filteredResults.length === 0 ? (
              <div className="p-4 text-center text-builder-text-muted text-sm">
                No results found
              </div>
            ) : (
              <div className="space-y-1">
                {filteredResults.map((template, idx) => (
                  <button
                    key={`${template.type}-${template.label}-${idx}`}
                    onClick={() => handleAddBlock(template, template.isSection, template.categoryId)}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-builder-surface-hover transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-md bg-builder-surface-active flex items-center justify-center text-builder-text-muted">
                      {template.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-builder-text flex items-center gap-2">
                        {template.label}
                        {template.isSection && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-builder-accent/20 text-builder-accent font-medium">
                            Section
                          </span>
                        )}
                        {activeApplicationFlowBlockId && template.categoryId && APPLICATION_ENGINE_CATEGORIES.includes(template.categoryId) && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                            → Flow
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-builder-text-dim truncate">{template.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'blocks' ? (
          // Blocks Tab Content - Collapsible Categories
          <div className="p-2 pb-20 space-y-1">
            {blockCategories.map((category) => (
              <CollapsibleCategory
                key={category.id}
                category={category}
                onAddBlock={handleAddBlock}
                isSection={false}
                activeApplicationFlowBlockId={activeApplicationFlowBlockId}
              />
            ))}
          </div>
        ) : (
          // Sections Tab Content - Collapsible Categories
          <div className="p-2 pb-20 space-y-1">
            {sectionCategories.map((category) => (
              <CollapsibleCategory
                key={category.id}
                category={category}
                onAddBlock={handleAddBlock}
                isSection={true}
                activeApplicationFlowBlockId={activeApplicationFlowBlockId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockPickerPanel;
