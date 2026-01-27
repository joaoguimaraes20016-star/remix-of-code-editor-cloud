/**
 * TokenRadiusControl - Border radius token picker with live previews
 */

import { cn } from '@/lib/utils';
import { radiusTokens, tokenMetadata, type RadiusToken } from '../../tokens';

interface TokenRadiusControlProps {
  value: RadiusToken | undefined;
  onChange: (token: RadiusToken) => void;
}

export function TokenRadiusControl({ 
  value = 'md', 
  onChange 
}: TokenRadiusControlProps) {
  const options = tokenMetadata.radius.options;

  return (
    <div className="flex rounded-lg border border-slate-200 overflow-hidden">
      {options.map((opt) => {
        const isSelected = value === opt.value;
        const previewStyle = radiusTokens[opt.value];

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
            {/* Live radius preview */}
            <div 
              className="w-4 h-4 bg-purple-500"
              style={previewStyle}
            />
          </button>
        );
      })}
    </div>
  );
}
