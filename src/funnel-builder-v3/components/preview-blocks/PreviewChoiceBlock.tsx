/**
 * Preview Choice Block
 */

import { Block, FunnelSettings } from '../../types/funnel';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface PreviewChoiceBlockProps {
  block: Block;
  settings: FunnelSettings;
  selectedIds: string[];
  onSelect: (optionId: string) => void;
}

export function PreviewChoiceBlock({ block, settings, selectedIds, onSelect }: PreviewChoiceBlockProps) {
  const { options = [], multiSelect = false, layout = 'vertical' } = block.props;
  const primaryColor = settings.primaryColor || 'hsl(262, 83%, 58%)';

  const layoutClasses = {
    vertical: 'flex flex-col gap-3',
    horizontal: 'flex flex-row flex-wrap gap-3',
    grid: 'grid grid-cols-2 gap-3',
  };

  if (options.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-400">
        No options configured
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {block.content && (
        <p className="text-sm font-medium text-gray-700">{block.content}</p>
      )}
      
      <div className={layoutClasses[layout]}>
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          
          return (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={cn(
                'relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left',
                'hover:shadow-md',
                isSelected 
                  ? 'border-current shadow-sm' 
                  : 'border-gray-200 hover:border-gray-300'
              )}
              style={isSelected ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10` } : {}}
            >
              {/* Image if present */}
              {option.imageUrl && (
                <img
                  src={option.imageUrl}
                  alt={option.label}
                  className="w-12 h-12 rounded-md object-cover"
                />
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{option.label}</div>
                {option.description && (
                  <div className="text-sm text-gray-500">{option.description}</div>
                )}
              </div>

              {/* Check indicator */}
              <div
                className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                  isSelected ? 'border-current bg-current' : 'border-gray-300'
                )}
                style={isSelected ? { borderColor: primaryColor, backgroundColor: primaryColor } : {}}
              >
                {isSelected && <Check size={14} className="text-white" />}
              </div>
            </button>
          );
        })}
      </div>

      {multiSelect && (
        <p className="text-xs text-gray-400 text-center">Select all that apply</p>
      )}
    </div>
  );
}
