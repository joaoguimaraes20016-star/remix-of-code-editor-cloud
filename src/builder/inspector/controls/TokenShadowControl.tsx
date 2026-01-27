/**
 * TokenShadowControl - Shadow token picker with live previews
 */

import { cn } from '@/lib/utils';
import { shadowTokens, tokenMetadata, type ShadowToken } from '../../tokens';

interface TokenShadowControlProps {
  value: ShadowToken | undefined;
  onChange: (token: ShadowToken) => void;
  primaryColor?: string;
}

export function TokenShadowControl({ 
  value = 'none', 
  onChange,
  primaryColor = '#8b5cf6'
}: TokenShadowControlProps) {
  const options = tokenMetadata.shadow.options;

  return (
    <div className="flex rounded-lg border border-slate-200 overflow-hidden">
      {options.map((opt) => {
        const isSelected = value === opt.value;
        const tokenDef = shadowTokens[opt.value];
        const previewStyle = typeof tokenDef === 'function' 
          ? tokenDef(primaryColor) 
          : tokenDef;

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 h-9 flex items-center justify-center gap-1.5 text-xs font-medium',
              'border-r last:border-r-0 border-slate-200 transition-colors',
              isSelected
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            )}
          >
            {/* Live shadow preview */}
            <div 
              className="w-4 h-4 rounded bg-white border border-slate-100"
              style={previewStyle}
            />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
