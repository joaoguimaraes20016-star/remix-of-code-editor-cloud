/**
 * Funnel Builder v3 - Block Renderer
 * 
 * Routes to the appropriate block component based on type.
 */

import { Block } from '../../types/funnel';
import { TextBlock } from './TextBlock';
import { HeadingBlock } from './HeadingBlock';
import { ImageBlock } from './ImageBlock';
import { VideoBlock } from './VideoBlock';
import { ButtonBlock } from './ButtonBlock';
import { InputBlock } from './InputBlock';
import { ChoiceBlock } from './ChoiceBlock';
import { DividerBlock } from './DividerBlock';
import { SpacerBlock } from './SpacerBlock';
import { EmbedBlock } from './EmbedBlock';
import { IconBlock } from './IconBlock';
import { cn } from '@/lib/utils';

interface BlockRendererProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  previewMode: boolean;
  primaryColor?: string;
}

export function BlockRenderer({
  block,
  isSelected,
  onSelect,
  previewMode,
  primaryColor,
}: BlockRendererProps) {
  const commonProps = {
    block,
    isSelected,
    onSelect,
    previewMode,
    primaryColor,
  };

  const getBlockComponent = () => {
    switch (block.type) {
      case 'text':
        return <TextBlock {...commonProps} />;
      case 'heading':
        return <HeadingBlock {...commonProps} />;
      case 'image':
        return <ImageBlock {...commonProps} />;
      case 'video':
        return <VideoBlock {...commonProps} />;
      case 'button':
        return <ButtonBlock {...commonProps} />;
      case 'input':
        return <InputBlock {...commonProps} />;
      case 'choice':
        return <ChoiceBlock {...commonProps} />;
      case 'divider':
        return <DividerBlock {...commonProps} />;
      case 'spacer':
        return <SpacerBlock {...commonProps} />;
      case 'embed':
        return <EmbedBlock {...commonProps} />;
      case 'icon':
        return <IconBlock {...commonProps} />;
      default:
        return (
          <div className="p-4 bg-muted rounded text-sm text-muted-foreground">
            Unknown block type: {block.type}
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        'builder-v3-block relative transition-all rounded-lg',
        !previewMode && 'cursor-pointer hover:ring-2 hover:ring-[hsl(var(--builder-v3-accent)/0.3)]',
        isSelected && 'ring-2 ring-[hsl(var(--builder-v3-accent))] shadow-[0_0_0_1px_hsl(var(--builder-v3-accent)/0.2)]'
      )}
      data-selected={isSelected || undefined}
      onClick={(e) => {
        if (!previewMode) {
          e.stopPropagation();
          onSelect();
        }
      }}
    >
      {getBlockComponent()}
      
      {/* Selection indicator label */}
      {isSelected && !previewMode && (
        <div className="absolute -top-6 left-0 text-[10px] font-medium text-[hsl(var(--builder-v3-accent))] bg-[hsl(var(--builder-v3-accent)/0.1)] px-1.5 py-0.5 rounded">
          {block.type.charAt(0).toUpperCase() + block.type.slice(1)}
        </div>
      )}
    </div>
  );
}
