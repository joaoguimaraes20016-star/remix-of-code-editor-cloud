/**
 * ShadowControl - Box shadow preset selector
 */

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Import unified presets from single source of truth
import { inspectorShadowPresets as shadowPresets } from '@/flow-canvas/builder/utils/presets';

interface ShadowControlProps {
  value: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  onChange: (value: 'none' | 'sm' | 'md' | 'lg' | 'xl') => void;
}

export function ShadowControl({ value, onChange }: ShadowControlProps) {
  return (
    <div className="flex rounded-lg border border-slate-200 overflow-hidden">
      {shadowPresets.map((preset) => (
        <Button
          key={preset.value}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(preset.value)}
          className={cn(
            'flex-1 h-8 rounded-none border-r last:border-r-0 border-slate-200 text-xs font-medium',
            value === preset.value
              ? 'bg-slate-100 text-slate-900'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}
