/**
 * Funnel Builder v3 - Top Toolbar
 * Enhanced with device selector, theme toggle, undo/redo, save status
 * Matches flow-canvas TopToolbar patterns
 */

import { 
  ArrowLeft, 
  Eye, 
  Save, 
  Rocket, 
  Play, 
  Monitor, 
  Tablet, 
  Smartphone,
  Undo2,
  Redo2,
  Sun,
  Moon,
  Check,
  Loader2,
  AlertCircle,
  Cloud,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type DeviceMode = 'mobile' | 'tablet' | 'desktop';
export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

const deviceWidths: Record<DeviceMode, number> = {
  desktop: 1024,
  tablet: 768,
  mobile: 390,
};

const deviceLabels: Record<DeviceMode, string> = {
  desktop: 'Desktop',
  tablet: 'Tablet',
  mobile: 'Mobile',
};

interface ToolbarProps {
  funnelName: string;
  previewMode: boolean;
  isDirty: boolean;
  onTogglePreview: () => void;
  onPublish?: () => void;
  onSave: () => void;
  onBack?: () => void;
  // Device mode
  deviceMode: DeviceMode;
  onDeviceModeChange: (mode: DeviceMode) => void;
  // Theme toggle
  editorTheme: 'light' | 'dark';
  onThemeToggle: () => void;
  // Undo/Redo
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  // Save status
  saveStatus?: SaveStatus;
}

export function Toolbar({
  funnelName,
  previewMode,
  isDirty,
  onTogglePreview,
  onPublish,
  onSave,
  onBack,
  deviceMode,
  onDeviceModeChange,
  editorTheme,
  onThemeToggle,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  saveStatus = 'idle',
}: ToolbarProps) {
  // Save status display
  const getSaveStatusDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        return { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, text: 'Saving...', color: 'text-[hsl(var(--builder-v3-accent))]' };
      case 'saved':
        return { icon: <Check className="h-3.5 w-3.5" />, text: 'Saved', color: 'text-[hsl(142_71%_45%)]' };
      case 'error':
        return { icon: <AlertCircle className="h-3.5 w-3.5" />, text: 'Error', color: 'text-[hsl(0_84%_60%)]' };
      case 'pending':
        return { icon: <Cloud className="h-3.5 w-3.5" />, text: 'Unsaved', color: 'text-[hsl(var(--builder-v3-text-muted))]' };
      default:
        return null;
    }
  };

  const statusDisplay = getSaveStatusDisplay();

  return (
    <TooltipProvider delayDuration={300}>
      <header className="builder-v3-toolbar">
        {/* Left: Back + Title + Save Status */}
        <div className="builder-v3-toolbar-left">
          {onBack && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={onBack} className="builder-v3-toolbar-btn">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Back to Funnels</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          <div className="builder-v3-toolbar-divider" />
          
          <div className="builder-v3-toolbar-title">
            <h1>{funnelName}</h1>
            {isDirty && <span className="builder-v3-toolbar-dirty">(unsaved)</span>}
          </div>

          {/* Save Status */}
          {statusDisplay && (
            <div className={cn('flex items-center gap-1.5 text-xs font-medium', statusDisplay.color)}>
              {statusDisplay.icon}
              <span>{statusDisplay.text}</span>
            </div>
          )}
        </div>

        {/* Center: Undo/Redo + Device Selector + Preview */}
        <div className="builder-v3-toolbar-center gap-4">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className={cn('builder-v3-toolbar-btn', !canUndo && 'opacity-40 cursor-not-allowed')}
                >
                  <Undo2 className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{canUndo ? 'Undo (⌘Z)' : 'Nothing to undo'}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  className={cn('builder-v3-toolbar-btn', !canRedo && 'opacity-40 cursor-not-allowed')}
                >
                  <Redo2 className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{canRedo ? 'Redo (⌘⇧Z)' : 'Nothing to redo'}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="builder-v3-toolbar-divider" />

          {/* Device Mode Switcher */}
          <div className="builder-v3-device-selector">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onDeviceModeChange('desktop')}
                  className={cn(
                    'builder-v3-device-btn',
                    deviceMode === 'desktop' && 'builder-v3-device-btn--active'
                  )}
                >
                  <Monitor className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Desktop View</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onDeviceModeChange('tablet')}
                  className={cn(
                    'builder-v3-device-btn',
                    deviceMode === 'tablet' && 'builder-v3-device-btn--active'
                  )}
                >
                  <Tablet className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Tablet View</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onDeviceModeChange('mobile')}
                  className={cn(
                    'builder-v3-device-btn',
                    deviceMode === 'mobile' && 'builder-v3-device-btn--active'
                  )}
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Mobile View</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Breakpoint Indicator */}
          <div className="builder-v3-breakpoint-indicator">
            <span className="breakpoint-label">{deviceLabels[deviceMode]}</span>
            <span className="breakpoint-divider">·</span>
            <span className="breakpoint-width">{deviceWidths[deviceMode]}px</span>
          </div>

          <div className="builder-v3-toolbar-divider" />

          {/* Preview Toggle */}
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

        {/* Right: Theme Toggle + Save + Publish */}
        <div className="builder-v3-toolbar-right">
          {/* Editor Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onThemeToggle} className="builder-v3-toolbar-btn">
                {editorTheme === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{editorTheme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}</p>
            </TooltipContent>
          </Tooltip>

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
    </TooltipProvider>
  );
}
