/**
 * BlockGrid - Grid layout of block tile cards organized by category
 * Displays blocks in a 2-column grid with group headers
 */

import { BlockTileCard } from './BlockTileCard';
import {
  TextIcon,
  ButtonIcon,
  ImageIcon,
  ListIcon,
  DividerIcon,
  LogoBarIcon,
  ReviewsIcon,
  SpacerIcon,
  VideoIcon,
  TestimonialIcon,
  FAQIcon,
  TeamIcon,
  CalendarIcon,
  HTMLIcon,
  FormIcon,
  // Question icons
  MultipleChoiceIcon,
  ChoiceIcon,
  QuizIcon,
  VideoQuestionIcon,
  // Form icons
  FormBlockIcon,
  AppointmentIcon,
  UploadIcon,
  MessageIcon,
  DateIcon,
  DropdownIcon,
  PaymentIcon,
} from './BlockIcons';

interface BlockGridProps {
  onAddBlock: (blockId: string) => void;
  category: 'content' | 'cta';
}

// ============ BASIC BLOCKS (content category) ============

const CORE_COMPONENTS = [
  { id: 'text', name: 'Text', bgColor: 'bg-gray-50', icon: <TextIcon /> },
  { id: 'button', name: 'Button', bgColor: 'bg-blue-50', icon: <ButtonIcon /> },
  { id: 'image', name: 'Image', bgColor: 'bg-gray-50', icon: <ImageIcon /> },
  { id: 'list', name: 'List', bgColor: 'bg-purple-50', icon: <ListIcon /> },
  { id: 'divider', name: 'Divider', bgColor: 'bg-gray-50', icon: <DividerIcon /> },
  { id: 'logo-bar', name: 'Logo Bar', bgColor: 'bg-yellow-50', icon: <LogoBarIcon /> },
  { id: 'reviews', name: 'Reviews', bgColor: 'bg-yellow-50', icon: <ReviewsIcon /> },
  { id: 'spacer', name: 'Spacer', bgColor: 'bg-gray-50', icon: <SpacerIcon /> },
];

const MEDIA_ELEMENTS = [
  { id: 'video', name: 'Video', bgColor: 'bg-gray-50', icon: <VideoIcon /> },
  { id: 'testimonial', name: 'Testimonial', bgColor: 'bg-orange-50', icon: <TestimonialIcon /> },
  { id: 'faq', name: 'FAQ', bgColor: 'bg-green-50', icon: <FAQIcon /> },
  { id: 'team', name: 'Team', bgColor: 'bg-blue-50', icon: <TeamIcon /> },
];

const EMBED_BLOCKS = [
  { id: 'calendar', name: 'Calendar', bgColor: 'bg-blue-50', icon: <CalendarIcon /> },
  { id: 'html', name: 'Custom HTML', bgColor: 'bg-gray-50', icon: <HTMLIcon /> },
  { id: 'form', name: 'Form', bgColor: 'bg-green-50', icon: <FormIcon /> },
];

// ============ INTERACTIVE BLOCKS (cta category) ============

const QUESTION_BLOCKS = [
  { id: 'multiple-choice', name: 'Multiple-Choice', bgColor: 'bg-green-50', icon: <MultipleChoiceIcon /> },
  { id: 'choice', name: 'Choice', bgColor: 'bg-blue-50', icon: <ChoiceIcon /> },
  { id: 'quiz', name: 'Quiz', bgColor: 'bg-gray-50', icon: <QuizIcon /> },
  { id: 'video-question', name: 'Video question', bgColor: 'bg-slate-50', icon: <VideoQuestionIcon /> },
];

const FORM_BLOCKS = [
  { id: 'form-block', name: 'Form', bgColor: 'bg-indigo-50', icon: <FormBlockIcon /> },
  { id: 'appointment', name: 'Appointment', bgColor: 'bg-teal-50', icon: <AppointmentIcon /> },
  { id: 'upload', name: 'Upload', bgColor: 'bg-purple-50', icon: <UploadIcon /> },
  { id: 'message', name: 'Message', bgColor: 'bg-cyan-50', icon: <MessageIcon /> },
  { id: 'date', name: 'Date', bgColor: 'bg-gray-50', icon: <DateIcon /> },
  { id: 'dropdown', name: 'Dropdown', bgColor: 'bg-amber-50', icon: <DropdownIcon /> },
  { id: 'payment', name: 'Payment', bgColor: 'bg-amber-50', icon: <PaymentIcon /> },
];

export function BlockGrid({ onAddBlock, category }: BlockGridProps) {
  if (category === 'cta') {
    return (
      <div className="p-6 overflow-y-auto">
        {/* Questions */}
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Questions</h3>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {QUESTION_BLOCKS.map(block => (
            <BlockTileCard
              key={block.id}
              {...block}
              onAdd={() => onAddBlock(block.id)}
            />
          ))}
        </div>

        {/* Forms */}
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Forms</h3>
        <div className="grid grid-cols-2 gap-3">
          {FORM_BLOCKS.map(block => (
            <BlockTileCard
              key={block.id}
              {...block}
              onAdd={() => onAddBlock(block.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Default: content category (basic blocks)
  return (
    <div className="p-6 overflow-y-auto">
      {/* Core Components */}
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Core Components</h3>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {CORE_COMPONENTS.map(block => (
          <BlockTileCard
            key={block.id}
            {...block}
            onAdd={() => onAddBlock(block.id)}
          />
        ))}
      </div>

      {/* Media Elements */}
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Media Elements</h3>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {MEDIA_ELEMENTS.map(block => (
          <BlockTileCard
            key={block.id}
            {...block}
            onAdd={() => onAddBlock(block.id)}
          />
        ))}
      </div>

      {/* Embed Blocks */}
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Embed Blocks</h3>
      <div className="grid grid-cols-2 gap-3">
        {EMBED_BLOCKS.map(block => (
          <BlockTileCard
            key={block.id}
            {...block}
            onAdd={() => onAddBlock(block.id)}
          />
        ))}
      </div>
    </div>
  );
}
