/**
 * StyleScopeHint - Displays contextual hints about what styling scope is active
 * Helps users understand selection-aware styling behavior
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Info, Type, MousePointer, Layers } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type StyleScope = 'element' | 'selection' | 'block' | 'global';

interface StyleScopeHintProps {
  scope: StyleScope;
  selectionLength?: number;
  className?: string;
}

const scopeConfig: Record<StyleScope, {
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
}> = {
  element: {
    icon: <MousePointer className="w-3 h-3" />,
    label: 'Element',
    description: 'Changes apply to the entire element',
    color: 'text-blue-400',
  },
  selection: {
    icon: <Type className="w-3 h-3" />,
    label: 'Selection',
    description: 'Changes apply only to selected text',
    color: 'text-purple-400',
  },
  block: {
    icon: <Layers className="w-3 h-3" />,
    label: 'Block',
    description: 'Changes apply to the container block',
    color: 'text-green-400',
  },
  global: {
    icon: <Info className="w-3 h-3" />,
    label: 'Global',
    description: 'Changes apply to all instances',
    color: 'text-orange-400',
  },
};

export const StyleScopeHint: React.FC<StyleScopeHintProps> = ({
  scope,
  selectionLength,
  className,
}) => {
  const config = scopeConfig[scope];
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={cn(
            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]',
            'bg-[hsl(var(--builder-surface-hover))] border border-[hsl(var(--builder-border))]',
            config.color,
            className
          )}
        >
          {config.icon}
          <span>{config.label}</span>
          {scope === 'selection' && selectionLength !== undefined && (
            <span className="text-[hsl(var(--builder-text-dim))]">
              ({selectionLength} chars)
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))] text-[hsl(var(--builder-text))]"
      >
        <p className="text-xs">{config.description}</p>
      </TooltipContent>
    </Tooltip>
  );
};

/**
 * Inline scope indicator for section headers
 */
export const ScopeBadge: React.FC<{ scope: StyleScope }> = ({ scope }) => {
  const config = scopeConfig[scope];
  
  return (
    <span 
      className={cn(
        'text-[9px] uppercase tracking-wider font-medium',
        config.color
      )}
    >
      {config.label}
    </span>
  );
};

export default StyleScopeHint;
