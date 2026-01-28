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
        'relative transition-all rounded-lg',
        !previewMode && 'cursor-pointer',
        !previewMode && isSelected && 'ring-2 ring-primary ring-offset-2',
        !previewMode && !isSelected && 'hover:ring-2 hover:ring-muted-foreground/20'
      )}
      onClick={previewMode ? undefined : onSelect}
    >
      {getBlockComponent()}
    </div>
  );
}
