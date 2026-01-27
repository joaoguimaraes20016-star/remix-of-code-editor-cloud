/**
 * TokenEffectControl - Animation effect picker with live previews
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { tokenMetadata, type EffectToken } from '../../tokens';
import { Play } from 'lucide-react';

interface TokenEffectControlProps {
  value: EffectToken | undefined;
  onChange: (token: EffectToken) => void;
}

export function TokenEffectControl({ 
  value = 'none', 
  onChange 
}: TokenEffectControlProps) {
  const options = tokenMetadata.effect.options;
  const [previewKey, setPreviewKey] = useState(0);

  const handleSelect = (effectValue: EffectToken) => {
    onChange(effectValue);
    // Trigger animation preview
    setPreviewKey(prev => prev + 1);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1">
        {options.map((opt) => {
          const isSelected = value === opt.value;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={cn(
                'h-8 px-2 flex items-center justify-center text-xs font-medium rounded-md',
                'transition-colors border',
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200'
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Preview area */}
      {value && value !== 'none' && (
        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
          <div 
            key={previewKey}
            className={cn(
              'w-12 h-8 bg-purple-500 rounded flex items-center justify-center',
              `token-effect-${value}`
            )}
          >
            <Play className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs text-slate-500">Preview</span>
          <button
            type="button"
            onClick={() => setPreviewKey(prev => prev + 1)}
            className="ml-auto text-xs text-purple-600 hover:text-purple-700"
          >
            Replay
          </button>
        </div>
      )}
    </div>
  );
}
