/**
 * Funnel Builder v3 - Top Toolbar
 * Dark charcoal theme matching flow-canvas aesthetic
 */

import { ArrowLeft, Eye, EyeOff, Save, Rocket, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ToolbarProps {
  funnelName: string;
  previewMode: boolean;
  isDirty: boolean;
  onTogglePreview: () => void;
  onPublish?: () => void;
  onSave: () => void;
  onBack?: () => void;
}

export function Toolbar({
  funnelName,
  previewMode,
  isDirty,
  onTogglePreview,
  onPublish,
  onSave,
  onBack,
}: ToolbarProps) {
  return (
    <header className="h-14 border-b border-[hsl(var(--builder-v3-border))] bg-[hsl(var(--builder-v3-surface))] flex items-center justify-between px-4 shrink-0">
      {/* Left: Back + Title */}
      <div className="flex items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 text-[hsl(var(--builder-v3-text-muted))] hover:text-[hsl(var(--builder-v3-text))] hover:bg-[hsl(var(--builder-v3-surface-hover))]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-[hsl(var(--builder-v3-text))] truncate max-w-[200px]">
            {funnelName}
          </h1>
          {isDirty && (
            <span className="text-xs text-[hsl(var(--builder-v3-text-dim))]">(unsaved)</span>
          )}
        </div>
      </div>

      {/* Center: Preview Toggle */}
      <div className="flex items-center">
        <button
          onClick={onTogglePreview}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            previewMode 
              ? 'bg-[hsl(var(--builder-v3-accent)/0.15)] text-[hsl(var(--builder-v3-accent))] ring-1 ring-[hsl(var(--builder-v3-accent)/0.3)]' 
              : 'text-[hsl(var(--builder-v3-text-muted))] hover:text-[hsl(var(--builder-v3-text))] hover:bg-[hsl(var(--builder-v3-surface-hover))]'
          )}
        >
          {previewMode ? (
            <>
              <Eye className="h-4 w-4" />
              <span>Testing</span>
              <span className="text-[hsl(var(--builder-v3-text-muted))]">·</span>
              <span className="hover:text-[hsl(var(--builder-v3-accent))]">Back to Edit</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Preview
            </>
          )}
        </button>
      </div>

      {/* Right: Save + Publish */}
      <div className="flex items-center gap-2">
        {/* Divider */}
        <div className="w-px h-5 bg-[hsl(var(--builder-v3-border))]" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          disabled={!isDirty}
          className={cn(
            'gap-2',
            'bg-[hsl(var(--builder-v3-surface-hover))] text-[hsl(var(--builder-v3-text-muted))]',
            'hover:text-[hsl(var(--builder-v3-text))] hover:bg-[hsl(var(--builder-v3-surface-active))]',
            'disabled:opacity-50'
          )}
        >
          <Save className="h-4 w-4" />
          Save
        </Button>

        {onPublish && (
          <Button
            size="sm"
            onClick={onPublish}
            className="gap-2 bg-[hsl(var(--builder-v3-accent))] text-white hover:brightness-110"
          >
            <Rocket className="h-4 w-4" />
            Publish
          </Button>
        )}
      </div>
    </header>
  );
}
