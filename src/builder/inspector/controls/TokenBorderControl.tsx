/**
 * TokenBorderControl - Border width token picker
 */

import { cn } from '@/lib/utils';
import { borderWidthTokens, tokenMetadata, type BorderWidthToken } from '../../tokens';

interface TokenBorderControlProps {
  value: BorderWidthToken | undefined;
  onChange: (token: BorderWidthToken) => void;
  borderColor?: string;
}

export function TokenBorderControl({ 
  value = '0', 
  onChange,
  borderColor = '#e2e8f0'
}: TokenBorderControlProps) {
  const options = tokenMetadata.borderWidth.options;

  return (
    <div className="flex rounded-lg border border-slate-200 overflow-hidden">
      {options.map((opt) => {
        const isSelected = value === opt.value;
        const previewStyle = {
          ...borderWidthTokens[opt.value],
          borderColor,
          borderStyle: 'solid',
        };

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 h-9 flex items-center justify-center gap-1 text-xs font-medium',
              'border-r last:border-r-0 border-slate-200 transition-colors',
              isSelected
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            )}
          >
            {/* Live border preview */}
            <div 
              className="w-4 h-4 bg-white rounded-sm"
              style={previewStyle}
            />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
