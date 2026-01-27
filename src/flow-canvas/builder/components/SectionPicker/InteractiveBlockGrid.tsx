/**
 * InteractiveBlockGrid - Grid layout for interactive blocks with high-fidelity mockups
 * Displays Questions and Forms sections with distinct visual treatment
 */

import { InteractiveBlockCard } from './InteractiveBlockCard';
import {
  MultipleChoiceMockup,
  ChoiceMockup,
  QuizMockup,
  VideoQuestionMockup,
  FormMockup,
  AppointmentMockup,
  UploadMockup,
  MessageMockup,
  DateMockup,
  DropdownMockup,
  PaymentMockup,
} from './InteractiveBlockIcons';

interface InteractiveBlockGridProps {
  onAddBlock: (blockId: string) => void;
}

const QUESTION_BLOCKS = [
  { id: 'multiple-choice', name: 'Multiple-Choice', mockup: <MultipleChoiceMockup /> },
  { id: 'choice', name: 'Choice', mockup: <ChoiceMockup /> },
  { id: 'quiz', name: 'Quiz', mockup: <QuizMockup /> },
  { id: 'video-question', name: 'Video question', mockup: <VideoQuestionMockup /> },
];

const FORM_BLOCKS = [
  { id: 'form-block', name: 'Form', mockup: <FormMockup /> },
  { id: 'appointment', name: 'Appointment', mockup: <AppointmentMockup /> },
  { id: 'upload', name: 'Upload', mockup: <UploadMockup /> },
  { id: 'message', name: 'Message', mockup: <MessageMockup /> },
  { id: 'date', name: 'Date', mockup: <DateMockup /> },
  { id: 'dropdown', name: 'Dropdown', mockup: <DropdownMockup /> },
  { id: 'payment', name: 'Payment', mockup: <PaymentMockup /> },
];

export function InteractiveBlockGrid({ onAddBlock }: InteractiveBlockGridProps) {
  return (
    <div className="p-6 overflow-y-auto">
      {/* Questions */}
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Questions</h3>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {QUESTION_BLOCKS.map(block => (
          <InteractiveBlockCard
            key={block.id}
            id={block.id}
            name={block.name}
            mockup={block.mockup}
            onAdd={() => onAddBlock(block.id)}
          />
        ))}
      </div>

      {/* Forms */}
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Forms</h3>
      <div className="grid grid-cols-2 gap-3">
        {FORM_BLOCKS.map(block => (
          <InteractiveBlockCard
            key={block.id}
            id={block.id}
            name={block.name}
            mockup={block.mockup}
            onAdd={() => onAddBlock(block.id)}
          />
        ))}
      </div>
    </div>
  );
}
