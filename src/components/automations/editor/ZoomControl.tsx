import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Minus, Plus, Maximize, Keyboard, X } from 'lucide-react';

export const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
export const ZOOM_STEP = 0.1;
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 2;

interface ZoomControlProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

const SHORTCUTS = [
  { keys: ['+', '='], description: 'Zoom in' },
  { keys: ['-'], description: 'Zoom out' },
  { keys: ['Ctrl+Scroll'], description: 'Zoom with mouse' },
  { keys: ['0'], description: 'Reset zoom (100%)' },
  { keys: ['1'], description: 'Fit to screen' },
  { keys: ['↑', '↓'], description: 'Navigate nodes' },
  { keys: ['D'], description: 'Toggle enable/disable' },
  { keys: ['Del'], description: 'Delete selected node' },
  { keys: ['Esc'], description: 'Deselect node' },
];

export function ZoomControl({ zoom, onZoomChange }: ZoomControlProps) {
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleZoomIn = () => {
    onZoomChange(Math.min(MAX_ZOOM, Math.round((zoom + ZOOM_STEP) * 100) / 100));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(MIN_ZOOM, Math.round((zoom - ZOOM_STEP) * 100) / 100));
  };

  const handlePresetSelect = (preset: number) => {
    onZoomChange(preset);
  };

  const handleFitToScreen = () => {
    onZoomChange(0.75);
  };

  const zoomPercentage = Math.round(zoom * 100);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1.5">
        {/* Keyboard Shortcuts Panel */}
        {showShortcuts && (
          <div className="bg-background border border-border rounded-lg p-3 shadow-lg mr-1 animate-in slide-in-from-right-2 duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">Keyboard Shortcuts</span>
              <button
                onClick={() => setShowShortcuts(false)}
                className="p-0.5 rounded hover:bg-muted"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-1.5">
              {SHORTCUTS.map((shortcut) => (
                <div key={shortcut.description} className="flex items-center justify-between gap-4">
                  <span className="text-xs text-muted-foreground">{shortcut.description}</span>
                  <div className="flex items-center gap-0.5">
                    {shortcut.keys.map((key, i) => (
                      <React.Fragment key={key}>
                        {i > 0 && <span className="text-[10px] text-muted-foreground/50 mx-0.5">/</span>}
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border border-border text-muted-foreground">
                          {key}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Keyboard Shortcut Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowShortcuts(!showShortcuts)}
              className={`h-8 w-8 rounded-lg border border-border shadow-sm ${
                showShortcuts ? 'bg-primary/10 text-primary' : 'bg-background'
              }`}
            >
              <Keyboard className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Keyboard shortcuts
          </TooltipContent>
        </Tooltip>

        {/* Fit to Screen Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFitToScreen}
              className="h-8 w-8 rounded-lg bg-background border border-border shadow-sm"
            >
              <Maximize className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Fit to screen <kbd className="ml-1 px-1 py-0.5 text-[10px] font-mono bg-muted rounded border">1</kbd>
          </TooltipContent>
        </Tooltip>

        {/* Main Zoom Controls */}
        <div className="flex items-center gap-0.5 bg-background border border-border rounded-lg p-1 shadow-sm">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoom <= MIN_ZOOM}
                className="h-7 w-7"
              >
                <Minus className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Zoom out <kbd className="ml-1 px-1 py-0.5 text-[10px] font-mono bg-muted rounded border">-</kbd>
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 min-w-[52px] text-xs font-medium"
              >
                {zoomPercentage}%
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="min-w-[100px]">
              {ZOOM_PRESETS.map((preset) => (
                <DropdownMenuItem
                  key={preset}
                  onClick={() => handlePresetSelect(preset)}
                  className={zoom === preset ? 'bg-accent' : ''}
                >
                  <span className="flex-1">{Math.round(preset * 100)}%</span>
                  {preset === 1 && (
                    <kbd className="ml-2 px-1 py-0.5 text-[10px] font-mono bg-muted rounded border">0</kbd>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleFitToScreen}>
                <Maximize className="h-3 w-3 mr-2" />
                <span className="flex-1">Fit to screen</span>
                <kbd className="ml-2 px-1 py-0.5 text-[10px] font-mono bg-muted rounded border">1</kbd>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoom >= MAX_ZOOM}
                className="h-7 w-7"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Zoom in <kbd className="ml-1 px-1 py-0.5 text-[10px] font-mono bg-muted rounded border">+</kbd>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
