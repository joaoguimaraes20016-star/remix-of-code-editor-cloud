import React from 'react';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  Plus,
  Eye,
  Play,
  MoreVertical,
  Undo2,
  Redo2,
  Globe,
  BarChart3,
  Palette,
  Share2,
  Sparkles,
  Settings,
  Check,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MobileActionBarProps {
  pageName: string;
  onBack: () => void;
  onAdd: () => void;
  previewMode: boolean;
  onPreviewToggle: () => void;
  onPublish?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onOpenSEO?: () => void;
  onOpenAnalytics?: () => void;
  onOpenTheme?: () => void;
  onOpenShare?: () => void;
  onOpenAIGenerate?: () => void;
  onOpenSettings?: () => void;
  isPublished?: boolean;
  hasUnpublishedChanges?: boolean;
  isPublishing?: boolean;
}

export const MobileActionBar: React.FC<MobileActionBarProps> = ({
  pageName,
  onBack,
  onAdd,
  previewMode,
  onPreviewToggle,
  onPublish,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onOpenSEO,
  onOpenAnalytics,
  onOpenTheme,
  onOpenShare,
  onOpenAIGenerate,
  onOpenSettings,
  isPublished = false,
  hasUnpublishedChanges = false,
  isPublishing = false,
}) => {
  return (
    <header className="mobile-action-bar">
      {/* Left: Back button */}
      <button
        onClick={onBack}
        className="mobile-toolbar-btn"
        aria-label="Go back"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Center: Page name */}
      <span className="mobile-page-name">{pageName || 'Untitled'}</span>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Add button - primary action */}
        <button
          onClick={onAdd}
          className="mobile-toolbar-btn mobile-toolbar-btn--primary"
          aria-label="Add content"
          disabled={previewMode}
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Preview toggle */}
        <button
          onClick={onPreviewToggle}
          className={cn(
            "mobile-toolbar-btn",
            previewMode && "bg-[hsl(var(--builder-accent))] text-white"
          )}
          aria-label={previewMode ? "Exit preview" : "Preview"}
        >
          {previewMode ? <Eye className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>

        {/* More menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="mobile-toolbar-btn" aria-label="More options">
              <MoreVertical className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-56 bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))] z-[9999]"
          >
            {/* Publish action */}
            {onPublish && (
              <>
                <DropdownMenuItem
                  onClick={onPublish}
                  disabled={isPublishing}
                  className="mobile-menu-item"
                >
                  {isPublishing ? (
                    'Publishing...'
                  ) : isPublished ? (
                    hasUnpublishedChanges ? (
                      <>
                        <Share2 className="w-4 h-4" />
                        Update Live Site
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        Published
                      </>
                    )
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      Publish
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[hsl(var(--builder-border-subtle))]" />
              </>
            )}

            {/* Undo/Redo */}
            <DropdownMenuItem
              onClick={onUndo}
              disabled={!canUndo}
              className="mobile-menu-item"
            >
              <Undo2 className="w-4 h-4" />
              Undo
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onRedo}
              disabled={!canRedo}
              className="mobile-menu-item"
            >
              <Redo2 className="w-4 h-4" />
              Redo
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-[hsl(var(--builder-border-subtle))]" />

            {/* AI Generate */}
            <DropdownMenuItem
              onClick={onOpenAIGenerate}
              disabled={previewMode}
              className="mobile-menu-item text-[hsl(var(--builder-accent))]"
            >
              <Sparkles className="w-4 h-4" />
              Generate with AI
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-[hsl(var(--builder-border-subtle))]" />

            {/* Settings actions */}
            <DropdownMenuItem onClick={onOpenSEO} className="mobile-menu-item">
              <Globe className="w-4 h-4" />
              SEO Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenAnalytics} className="mobile-menu-item">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenTheme} className="mobile-menu-item">
              <Palette className="w-4 h-4" />
              Theme
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenShare} className="mobile-menu-item">
              <Share2 className="w-4 h-4" />
              Share
            </DropdownMenuItem>

            {onOpenSettings && (
              <>
                <DropdownMenuSeparator className="bg-[hsl(var(--builder-border-subtle))]" />
                <DropdownMenuItem onClick={onOpenSettings} className="mobile-menu-item">
                  <Settings className="w-4 h-4" />
                  Settings
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
