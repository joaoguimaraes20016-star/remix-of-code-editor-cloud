import React from 'react';
import { useFunnel } from '@/funnel-builder-v3/context/FunnelContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Minus, Plus } from 'lucide-react';

const ZOOM_PRESETS = [0.5, 0.75, 1, 1.25, 1.5];
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.5;

export function ZoomControl() {
  const { canvasZoom, setCanvasZoom } = useFunnel();

  const handleZoomIn = () => {
    setCanvasZoom(Math.min(MAX_ZOOM, Math.round((canvasZoom + ZOOM_STEP) * 100) / 100));
  };

  const handleZoomOut = () => {
    setCanvasZoom(Math.max(MIN_ZOOM, Math.round((canvasZoom - ZOOM_STEP) * 100) / 100));
  };

  const handlePresetSelect = (preset: number) => {
    setCanvasZoom(preset);
  };

  // Show the user's zoom level directly (100% = baseline fit)
  const zoomPercentage = Math.round(canvasZoom * 100);

  return (
    <div className="flex items-center gap-0.5 bg-muted p-1 rounded-lg">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleZoomOut}
        disabled={canvasZoom <= MIN_ZOOM}
        className="h-7 w-7"
      >
        <Minus className="h-3 w-3" />
      </Button>

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
        <DropdownMenuContent align="center" className="min-w-[80px]">
          {ZOOM_PRESETS.map((preset) => (
            <DropdownMenuItem
              key={preset}
              onClick={() => handlePresetSelect(preset)}
              className={canvasZoom === preset ? 'bg-accent' : ''}
            >
              {Math.round(preset * 100)}%
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleZoomIn}
        disabled={canvasZoom >= MAX_ZOOM}
        className="h-7 w-7"
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}
