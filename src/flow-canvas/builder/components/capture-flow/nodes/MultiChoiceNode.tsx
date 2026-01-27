// MultiChoiceNode - Checkbox / multi select node

import React from 'react';
import { CaptureNodeRendererProps } from '../CaptureNodeRenderer';
import { CaptureNodeWrapper } from '../CaptureNodeWrapper';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export const MultiChoiceNode: React.FC<CaptureNodeRendererProps> = ({
  node,
  value,
  onChange,
  onSubmit,
  validationError,
  isPreview,
  isSelected,
  onSelect,
}) => {
  const selectedIds = Array.isArray(value) ? value : [];
  const choices = node.settings.choices || [];

  // Detect if any choices have images for perspective card layout
  const hasImages = choices.some(c => c.imageUrl);

  const handleToggle = (choiceId: string) => {
    if (isPreview) return;
    
    const newSelection = selectedIds.includes(choiceId)
      ? selectedIds.filter((id) => id !== choiceId)
      : [...selectedIds, choiceId];
    
    onChange(newSelection);
  };

  return (
    <CaptureNodeWrapper
      node={node}
      onSubmit={onSubmit}
      validationError={validationError}
      isPreview={isPreview}
      isSelected={isSelected}
      onSelect={onSelect}
    >
      <div className={cn(
        "w-full",
        hasImages ? "grid grid-cols-2 gap-4" : "flex flex-col gap-2"
      )}>
        {choices.map((choice) => {
          const isChecked = selectedIds.includes(choice.id);
          const hasImage = hasImages && choice.imageUrl;
          
          return (
            <button
              key={choice.id}
              type="button"
              onClick={() => handleToggle(choice.id)}
              className={cn(
                'transition-all text-left',
                hasImage
                  ? 'flex flex-col rounded-xl overflow-hidden border'
                  : 'flex items-center gap-3 p-4 rounded-lg border',
                'hover:border-primary/50 hover:bg-accent/50',
                isChecked
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
                  ? "p-3 bg-primary text-primary-foreground w-full flex items-center justify-center gap-2"
                  : "flex items-center gap-3"
              )}>
                {/* Checkbox indicator */}
                <div
                  className={cn(
                    'w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors',
                    isChecked
                      ? hasImage 
                        ? 'border-primary-foreground bg-primary-foreground'
                        : 'border-primary bg-primary'
                      : hasImage
                        ? 'border-primary-foreground/40 bg-transparent'
                        : 'border-muted-foreground/40 bg-background',
                  )}
                >
                  {isChecked && (
                    <Check className={cn(
                      "w-3 h-3",
                      hasImage ? "text-primary" : "text-primary-foreground"
                    )} />
                  )}
                </div>

                {/* Emoji - only for non-image layout */}
                {!hasImage && choice.emoji && (
                  <span className="text-lg">{choice.emoji}</span>
                )}

                {/* Label */}
                <span className={cn(
                  "text-sm font-medium",
                  hasImage ? "text-center" : "text-foreground"
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

export default MultiChoiceNode;
