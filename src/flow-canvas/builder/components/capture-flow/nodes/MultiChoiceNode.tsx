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
      <div className="flex flex-col gap-2 w-full">
        {choices.map((choice) => {
          const isChecked = selectedIds.includes(choice.id);
          
          return (
            <button
              key={choice.id}
              type="button"
              onClick={() => handleToggle(choice.id)}
              className={cn(
                'flex items-center gap-3 p-4 rounded-lg border transition-all text-left',
                'hover:border-primary/50 hover:bg-accent/50',
                isChecked
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-background',
              )}
              disabled={isPreview}
            >
              {/* Checkbox indicator */}
              <div
                className={cn(
                  'w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors',
                  isChecked
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/40 bg-background',
                )}
              >
                {isChecked && (
                  <Check className="w-3 h-3 text-primary-foreground" />
                )}
              </div>

              {/* Emoji */}
              {choice.emoji && (
                <span className="text-lg">{choice.emoji}</span>
              )}

              {/* Label */}
              <span className="text-sm font-medium text-foreground">
                {choice.label}
              </span>
            </button>
          );
        })}
      </div>
    </CaptureNodeWrapper>
  );
};

export default MultiChoiceNode;
