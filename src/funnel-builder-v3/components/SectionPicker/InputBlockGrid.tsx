/**
 * InputBlockGrid - Grid of input/form blocks
 * Adapted from flow-canvas InteractiveBlockGrid for v3 builder
 */

import { InteractiveBlockCard } from './InteractiveBlockCard';
import {
  ChoiceMockup,
  FormMockup,
  InputMockup,
  EmbedMockup,
} from './InteractiveBlockIcons';

interface InputBlockGridProps {
  onAddBlock: (blockId: string) => void;
}

// INPUT BLOCKS - Single field, collects one value
const INPUT_BLOCKS = [
  { id: 'input', name: 'Text Input', mockup: <InputMockup />, description: 'Free text' },
  { id: 'choice', name: 'Choice', mockup: <ChoiceMockup />, description: 'Select options' },
  { id: 'embed', name: 'Embed', mockup: <EmbedMockup />, description: 'External content' },
];

export function InputBlockGrid({ onAddBlock }: InputBlockGridProps) {
  return (
    <div className="p-6 overflow-y-auto">
      {/* Input Blocks - Collect data */}
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
    </div>
  );
}
