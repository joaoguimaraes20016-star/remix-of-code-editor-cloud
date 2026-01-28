/**
 * InteractiveBlockGrid - Reorganized with clear categories
 * Inputs (Single Field - Collects Data) | Forms (Multi-field - Collects Data)
 */

import { InteractiveBlockCard } from './InteractiveBlockCard';
import { BlockTileCard } from './BlockTileCard';
import { FormIcon, CalendarIcon } from './BlockIcons';
import {
  MultipleChoiceMockup,
  ChoiceMockup,
  QuizMockup,
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

// INPUT BLOCKS - Single field, collects one value
const INPUT_BLOCKS = [
  { id: 'multiple-choice', name: 'Multiple Choice', mockup: <MultipleChoiceMockup />, description: 'Select multiple' },
  { id: 'choice', name: 'Single Choice', mockup: <ChoiceMockup />, description: 'Select one' },
  { id: 'dropdown', name: 'Dropdown', mockup: <DropdownMockup />, description: 'Select menu' },
  { id: 'message', name: 'Text Input', mockup: <MessageMockup />, description: 'Free text' },
  { id: 'date', name: 'Date Picker', mockup: <DateMockup />, description: 'Date selection' },
  { id: 'upload', name: 'File Upload', mockup: <UploadMockup />, description: 'Upload files' },
];

// FORM BLOCKS - Multi-field, collects multiple values
const FORM_BLOCKS = [
  { id: 'form-block', name: 'Contact Form', mockup: <FormMockup />, description: 'Name, email, phone' },
  { id: 'quiz', name: 'Multi-step Quiz', mockup: <QuizMockup />, description: 'Question flow' },
];

// BOOKING BLOCKS - External calendars with lead capture
const BOOKING_BLOCKS = [
  { id: 'appointment', name: 'Book Appointment', mockup: <AppointmentMockup />, description: 'Calendly embed' },
  { id: 'payment', name: 'Payment', mockup: <PaymentMockup />, description: 'Stripe checkout' },
];

export function InteractiveBlockGrid({ onAddBlock }: InteractiveBlockGridProps) {
  return (
    <div className="p-6 overflow-y-auto">
      {/* Input Blocks - Collect single values */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Inputs</h3>
          <span className="text-[10px] font-medium text-green-600 bg-green-100 px-1.5 py-0.5 rounded">Collects data</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {INPUT_BLOCKS.map(block => (
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

      {/* Form Blocks - Multi-field */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Forms</h3>
          <span className="text-[10px] font-medium text-green-600 bg-green-100 px-1.5 py-0.5 rounded">Multi-field</span>
        </div>
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

      {/* Booking Blocks - External services */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Booking & Payments</h3>
          <span className="text-[10px] font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">External</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {BOOKING_BLOCKS.map(block => (
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
    </div>
  );
}
