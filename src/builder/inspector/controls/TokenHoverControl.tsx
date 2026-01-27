/**
 * TokenHoverControl - Hover effect picker
 */

import { cn } from '@/lib/utils';
import { tokenMetadata, type HoverToken } from '../../tokens';

interface TokenHoverControlProps {
  value: HoverToken | undefined;
  onChange: (token: HoverToken) => void;
}

export function TokenHoverControl({ 
  value = 'none', 
  onChange 
}: TokenHoverControlProps) {
  const options = tokenMetadata.hover.options;

  return (
    <div className="grid grid-cols-3 gap-1">
      {options.map((opt) => {
        const isSelected = value === opt.value;

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'h-8 px-2 flex items-center justify-center text-xs font-medium rounded-md',
              'transition-colors border',
              // Apply hover effect preview on the button itself
              opt.value !== 'none' && `token-hover-${opt.value}`,
              isSelected
                ? 'bg-slate-900 text-white border-slate-900'
                : 'text-slate-600 hover:text-slate-900 border-slate-200'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
