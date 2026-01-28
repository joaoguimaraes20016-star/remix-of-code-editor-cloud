/**
 * Funnel Builder v3 - Top Toolbar
 */

import { ArrowLeft, Eye, EyeOff, Save, Rocket, Loader2 } from 'lucide-react';
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
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      {/* Left: Back + Title */}
      <div className="flex items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-foreground truncate max-w-[200px]">
            {funnelName}
          </h1>
          {isDirty && (
            <span className="text-xs text-muted-foreground">(unsaved)</span>
          )}
        </div>
      </div>

      {/* Center: Preview Toggle */}
      <div className="flex items-center">
        <Button
          variant={previewMode ? 'default' : 'outline'}
          size="sm"
          onClick={onTogglePreview}
          className={cn(
            'gap-2',
            previewMode && 'bg-primary text-primary-foreground'
          )}
        >
          {previewMode ? (
            <>
              <EyeOff className="h-4 w-4" />
              Exit Preview
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Preview
            </>
          )}
        </Button>
      </div>

      {/* Right: Save + Publish */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={!isDirty}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Save
        </Button>

        {onPublish && (
          <Button
            variant="default"
            size="sm"
            onClick={onPublish}
            className="gap-2"
          >
            <Rocket className="h-4 w-4" />
            Publish
          </Button>
        )}
      </div>
    </header>
  );
}
