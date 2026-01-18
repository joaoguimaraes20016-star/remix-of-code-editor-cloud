import { Keyboard, Command } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';

// Detect Mac vs Windows for modifier key display
const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const modKey = isMac ? '⌘' : 'Ctrl';

interface ShortcutGroup {
  title: string;
  shortcuts: { key: string; action: string; hint?: string }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Selection',
    shortcuts: [
      { key: '↑ / ↓', action: 'Navigate elements' },
      { key: 'Escape', action: 'Deselect / Close' },
      { key: 'Enter', action: 'Edit text' },
      { key: 'Tab', action: 'Next element' },
    ],
  },
  {
    title: 'Editing',
    shortcuts: [
      { key: `${modKey}+C`, action: 'Copy element' },
      { key: `${modKey}+V`, action: 'Paste element' },
      { key: `${modKey}+D`, action: 'Duplicate' },
      { key: 'Delete', action: 'Remove element' },
      { key: `${modKey}+Z`, action: 'Undo' },
      { key: `${modKey}+Shift+Z`, action: 'Redo' },
    ],
  },
  {
    title: 'Styling',
    shortcuts: [
      { key: `${modKey}+Shift+C`, action: 'Copy styles', hint: 'Copy element styling' },
      { key: `${modKey}+Shift+V`, action: 'Paste styles', hint: 'Apply copied styles' },
      { key: `${modKey}+B`, action: 'Bold' },
      { key: `${modKey}+I`, action: 'Italic' },
      { key: `${modKey}+U`, action: 'Underline' },
    ],
  },
  {
    title: 'View',
    shortcuts: [
      { key: `${modKey}++`, action: 'Zoom in' },
      { key: `${modKey}+-`, action: 'Zoom out' },
      { key: `${modKey}+0`, action: 'Reset zoom' },
      { key: 'Space', action: 'Pan mode (hold)' },
    ],
  },
];

// Quick tooltip version
export function KeyboardShortcutsPanel() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Keyboard className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="w-56 p-3">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Keyboard Shortcuts
            </p>
            {shortcutGroups[1].shortcuts.slice(0, 6).map((shortcut) => (
              <div key={shortcut.key} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{shortcut.action}</span>
                <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground/60 pt-1 border-t mt-2">
              Press <kbd className="px-1 py-0.5 bg-secondary rounded text-[9px]">{modKey}+/</kbd> for all shortcuts
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Full modal version with all shortcuts
export function KeyboardShortcutsModal({ 
  isOpen, 
  onOpenChange 
}: { 
  isOpen: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[hsl(var(--builder-text))]">
            <Command className="w-5 h-5 text-[hsl(var(--builder-accent))]" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6 py-4">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <h4 className="text-xs font-semibold text-[hsl(var(--builder-text-muted))] uppercase tracking-wide">
                {group.title}
              </h4>
              <div className="space-y-1.5">
                {group.shortcuts.map((shortcut) => (
                  <div 
                    key={shortcut.key} 
                    className="flex items-center justify-between text-xs group"
                    title={shortcut.hint}
                  >
                    <span className="text-[hsl(var(--builder-text-muted))] group-hover:text-[hsl(var(--builder-text))] transition-colors">
                      {shortcut.action}
                    </span>
                    <kbd className="px-1.5 py-0.5 bg-[hsl(var(--builder-surface-hover))] border border-[hsl(var(--builder-border))] rounded text-[10px] font-mono text-[hsl(var(--builder-text-dim))]">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="pt-3 border-t border-[hsl(var(--builder-border))]">
          <p className="text-[10px] text-[hsl(var(--builder-text-dim))]">
            💡 Tip: Hold <kbd className="px-1 py-0.5 bg-[hsl(var(--builder-surface-hover))] rounded text-[9px]">Space</kbd> and drag to pan around the canvas
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
