/**
 * BasicBlockGrid - Grid layout for basic content blocks
 * Displays Core Components, Media Elements, and Embed Blocks
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
} from './BlockIcons';

interface BasicBlockGridProps {
  onAddBlock: (blockId: string) => void;
}

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

export function BasicBlockGrid({ onAddBlock }: BasicBlockGridProps) {
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
