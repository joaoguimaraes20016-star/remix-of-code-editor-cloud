// YesNoNode - Binary yes/no choice node

import React from 'react';
import { CaptureNodeRendererProps } from '../CaptureNodeRenderer';
import { CaptureNodeWrapper } from '../CaptureNodeWrapper';
import { cn } from '@/lib/utils';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

export const YesNoNode: React.FC<CaptureNodeRendererProps> = ({
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
  const choices = node.settings.choices || [
    { id: 'yes', label: 'Yes' },
    { id: 'no', label: 'No' },
  ];

  const handleSelect = (choiceId: string) => {
    if (isPreview) return;
    onChange(choiceId);
    // Auto-advance on selection
    setTimeout(() => onSubmit(), 150);
  };

  const getIcon = (choiceId: string) => {
    if (choiceId === 'yes') return <ThumbsUp className="w-5 h-5" />;
    if (choiceId === 'no') return <ThumbsDown className="w-5 h-5" />;
    return null;
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
      <div className="flex gap-4 justify-center">
        {choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            onClick={() => handleSelect(choice.id)}
            className={cn(
              'flex items-center gap-2 px-8 py-4 rounded-lg border-2 font-medium transition-all',
              'hover:border-primary hover:bg-primary/10',
              selectedId === choice.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border bg-background',
            )}
            disabled={isPreview}
          >
            {getIcon(choice.id)}
            <span className="text-foreground">{choice.label}</span>
          </button>
        ))}
      </div>
    </CaptureNodeWrapper>
  );
};

export default YesNoNode;
