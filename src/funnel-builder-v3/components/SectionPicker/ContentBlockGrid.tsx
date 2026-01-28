/**
 * ContentBlockGrid - Grid of content (display-only) blocks
 * Adapted from flow-canvas BasicBlockGrid for v3 builder
 */

import { BlockTileCard } from './BlockTileCard';
import { InteractiveBlockCard } from './InteractiveBlockCard';
import {
  TextIcon,
  ButtonIcon,
  ImageIcon,
  VideoIcon,
  DividerIcon,
  SpacerIcon,
  HeadingIcon,
  IconBlockIcon,
} from './BlockIcons';
import {
  GradientTextMockup,
  UnderlineTextMockup,
  StatNumberMockup,
  AvatarGroupMockup,
  TickerMockup,
  BadgeMockup,
  ProcessStepMockup,
} from './PremiumBlockIcons';

interface ContentBlockGridProps {
  onAddBlock: (blockId: string) => void;
}

// CONTENT BLOCKS - Display only, no data collection
const CONTENT_BLOCKS = [
  { id: 'heading', name: 'Heading', bgColor: 'bg-slate-50', icon: <HeadingIcon /> },
  { id: 'text', name: 'Text', bgColor: 'bg-gray-50', icon: <TextIcon /> },
  { id: 'button', name: 'Button', bgColor: 'bg-blue-50', icon: <ButtonIcon /> },
  { id: 'image', name: 'Image', bgColor: 'bg-gray-50', icon: <ImageIcon /> },
  { id: 'video', name: 'Video', bgColor: 'bg-gray-50', icon: <VideoIcon /> },
  { id: 'divider', name: 'Divider', bgColor: 'bg-gray-50', icon: <DividerIcon /> },
  { id: 'spacer', name: 'Spacer', bgColor: 'bg-gray-50', icon: <SpacerIcon /> },
  { id: 'icon', name: 'Icon', bgColor: 'bg-amber-50', icon: <IconBlockIcon /> },
];

// PREMIUM CONTENT - Enhanced display elements
const PREMIUM_CONTENT = [
  { id: 'gradient-text', name: 'Gradient Text', mockup: <GradientTextMockup /> },
  { id: 'underline-text', name: 'Underline Text', mockup: <UnderlineTextMockup /> },
  { id: 'stat-number', name: 'Stat Number', mockup: <StatNumberMockup /> },
  { id: 'avatar-group', name: 'Avatar Group', mockup: <AvatarGroupMockup /> },
  { id: 'ticker', name: 'Ticker', mockup: <TickerMockup /> },
  { id: 'badge', name: 'Badge', mockup: <BadgeMockup /> },
  { id: 'process-step', name: 'Process Step', mockup: <ProcessStepMockup /> },
];

export function ContentBlockGrid({ onAddBlock }: ContentBlockGridProps) {
  return (
    <div className="p-6 overflow-y-auto">
      {/* Content Blocks - Display only */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Content</h3>
          <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Display only</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {CONTENT_BLOCKS.map(block => (
            <BlockTileCard
              key={block.id}
              {...block}
              onAdd={() => onAddBlock(block.id)}
            />
          ))}
        </div>
      </div>

      {/* Premium Content */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Premium</h3>
          <span className="text-[10px] font-medium text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">Enhanced</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {PREMIUM_CONTENT.map(block => (
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
