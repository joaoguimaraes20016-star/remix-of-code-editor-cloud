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
    <header className="builder-v3-toolbar">
      {/* Left: Back + Title */}
      <div className="builder-v3-toolbar-left">
        {onBack && (
          <button onClick={onBack} className="builder-v3-toolbar-btn">
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        
        <div className="builder-v3-toolbar-title">
          <h1>{funnelName}</h1>
          {isDirty && <span className="builder-v3-toolbar-dirty">(unsaved)</span>}
        </div>
      </div>

      {/* Center: Preview Toggle */}
      <div className="builder-v3-toolbar-center">
        <button
          onClick={onTogglePreview}
          className={cn(
            'builder-v3-preview-toggle',
            previewMode && 'builder-v3-preview-toggle--active'
          )}
        >
          {previewMode ? (
            <>
              <Eye className="h-4 w-4" />
              <span>Testing</span>
              <span className="builder-v3-preview-divider">·</span>
              <span className="builder-v3-preview-exit">Back to Edit</span>
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
      <div className="builder-v3-toolbar-right">
        <div className="builder-v3-toolbar-divider" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          disabled={!isDirty}
          className="builder-v3-save-btn"
        >
          <Save className="h-4 w-4" />
          Save
        </Button>

        {onPublish && (
          <Button
            size="sm"
            onClick={onPublish}
            className="builder-v3-publish-btn"
          >
            <Rocket className="h-4 w-4" />
            Publish
          </Button>
        )}
      </div>
    </header>
  );
}
