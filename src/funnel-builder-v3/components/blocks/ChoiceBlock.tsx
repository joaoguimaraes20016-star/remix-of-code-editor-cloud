/**
 * Choice Block
 */

import { useState } from 'react';
import { Block, ChoiceOption } from '../../types/funnel';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ChoiceBlockProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  previewMode: boolean;
  primaryColor?: string;
}

const DEFAULT_OPTIONS: ChoiceOption[] = [
  { id: '1', label: 'Option A', value: 'a' },
  { id: '2', label: 'Option B', value: 'b' },
  { id: '3', label: 'Option C', value: 'c' },
];

export function ChoiceBlock({ block, previewMode, primaryColor }: ChoiceBlockProps) {
  const { 
    options = DEFAULT_OPTIONS, 
    multiSelect = false, 
    layout = 'vertical',
    showImages = false,
  } = block.props;

  const [selected, setSelected] = useState<string[]>([]);

  const handleSelect = (optionId: string) => {
    if (!previewMode) return;
    
    if (multiSelect) {
      setSelected(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelected([optionId]);
    }
  };

  const layoutClasses = {
    vertical: 'flex flex-col gap-3',
    horizontal: 'flex flex-row gap-3 flex-wrap',
    grid: 'grid grid-cols-2 gap-3',
  };

  return (
    <div className="p-2">
      {block.content && (
        <p className="text-lg font-medium mb-4 text-center">{block.content}</p>
      )}

      <div className={layoutClasses[layout]}>
        {options.map((option) => {
          const isOptionSelected = selected.includes(option.id);
          
          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={cn(
                'relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left',
                isOptionSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/50',
                layout === 'horizontal' && 'flex-1 min-w-[120px]',
                !previewMode && 'pointer-events-none'
              )}
              style={{
                borderColor: isOptionSelected ? (primaryColor || 'hsl(262, 83%, 58%)') : undefined,
              }}
            >
              {/* Checkbox/Radio indicator */}
              <div
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0',
                  multiSelect ? 'rounded' : 'rounded-full',
                  isOptionSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                )}
                style={{
                  borderColor: isOptionSelected ? (primaryColor || 'hsl(262, 83%, 58%)') : undefined,
                  backgroundColor: isOptionSelected ? (primaryColor || 'hsl(262, 83%, 58%)') : undefined,
                }}
              >
                {isOptionSelected && <Check className="h-3 w-3 text-white" />}
              </div>

              {/* Option content */}
              <div className="flex-1">
                {showImages && option.imageUrl && (
                  <img 
                    src={option.imageUrl} 
                    alt={option.label}
                    className="w-full h-24 object-cover rounded mb-2"
                  />
                )}
                <span className="font-medium">{option.label}</span>
                {option.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {option.description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
