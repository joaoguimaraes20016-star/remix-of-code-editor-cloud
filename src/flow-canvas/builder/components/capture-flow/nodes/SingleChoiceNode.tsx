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
      <div className="flex flex-col gap-2 w-full">
        {choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            onClick={() => !isPreview && handleSelect(choice.id)}
            className={cn(
              'flex items-center gap-3 p-4 rounded-lg border transition-all text-left',
              'hover:border-primary/50 hover:bg-accent/50',
              selectedId === choice.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border bg-background',
            )}
            disabled={isPreview}
          >
            {/* Radio indicator */}
            <div
              className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                selectedId === choice.id
                  ? 'border-primary'
                  : 'border-muted-foreground/40',
              )}
            >
              {selectedId === choice.id && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
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
        ))}
      </div>
    </CaptureNodeWrapper>
  );
};

export default SingleChoiceNode;
