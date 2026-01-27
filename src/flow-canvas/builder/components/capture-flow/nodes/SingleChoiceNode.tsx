// SingleChoiceNode - Radio button / single select node

import React from 'react';
import { CaptureNodeRendererProps } from '../CaptureNodeRenderer';
import { CaptureNodeWrapper } from '../CaptureNodeWrapper';
import { cn } from '@/lib/utils';

export const SingleChoiceNode: React.FC<CaptureNodeRendererProps> = ({
  node,
  value,
  onChange,
  onSubmit,
  validationError,
  isPreview,
  isSelected,
  onSelect,
}) => {
  const selectedId = typeof value === 'string' ? value : '';
  const choices = node.settings.choices || [];

  // Detect if any choices have images for perspective card layout
  const hasImages = choices.some(c => c.imageUrl);

  const handleSelect = (choiceId: string) => {
    onChange(choiceId);
    // Auto-advance on selection for single choice
    setTimeout(() => onSubmit(), 150);
  };

  return (
    <CaptureNodeWrapper
      node={node}
      onSubmit={onSubmit}
      validationError={validationError}
      isPreview={isPreview}
      isSelected={isSelected}
      onSelect={onSelect}
      hideButton // Auto-advance on selection
    >
      <div className={cn(
        "w-full",
        hasImages ? "grid grid-cols-2 gap-4" : "flex flex-col gap-2"
      )}>
        {choices.map((choice) => {
          const isChoiceSelected = selectedId === choice.id;
          const hasImage = hasImages && choice.imageUrl;
          
          return (
            <button
              key={choice.id}
              type="button"
              onClick={() => !isPreview && handleSelect(choice.id)}
              className={cn(
                'transition-all text-left',
                hasImage
                  ? 'flex flex-col rounded-xl overflow-hidden border'
                  : 'flex items-center gap-3 p-4 rounded-lg border',
                'hover:border-primary/50 hover:bg-accent/50',
                isChoiceSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-background',
              )}
              disabled={isPreview}
            >
              {/* Image card layout */}
              {hasImage && (
                <div 
                  className="w-full aspect-[4/3] bg-cover bg-center"
                  style={{ backgroundImage: `url(${choice.imageUrl})` }}
                />
              )}

              {/* Label area */}
              <div className={cn(
                hasImage 
                  ? "p-3 bg-primary text-primary-foreground w-full"
                  : "flex items-center gap-3"
              )}>
                {/* Radio indicator - only for non-image layout */}
                {!hasImage && (
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                      isChoiceSelected
                        ? 'border-primary'
                        : 'border-muted-foreground/40',
                    )}
                  >
                    {isChoiceSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                )}

                {/* Emoji - only for non-image layout */}
                {!hasImage && choice.emoji && (
                  <span className="text-lg">{choice.emoji}</span>
                )}

                {/* Label */}
                <span className={cn(
                  "text-sm font-medium",
                  hasImage ? "text-center w-full" : "text-foreground"
                )}>
                  {choice.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </CaptureNodeWrapper>
  );
};

export default SingleChoiceNode;
