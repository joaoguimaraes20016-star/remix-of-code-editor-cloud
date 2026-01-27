/**
 * BlockAdder - Compact inline block picker popover
 * Shows a grid of common block types for quick adding inside sections
 */

import { useState } from 'react';
import { 
  Plus, 
  Type, 
  Heading, 
  Image, 
  MousePointer, 
  Video, 
  Mail,
  List,
  Quote,
  Timer,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface BlockType {
  type: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const BLOCK_TYPES: BlockType[] = [
  { type: 'text-block', label: 'Text', icon: Type, description: 'Paragraph text' },
  { type: 'heading', label: 'Heading', icon: Heading, description: 'Title text' },
  { type: 'cta', label: 'Button', icon: MousePointer, description: 'Call to action' },
  { type: 'media', label: 'Image', icon: Image, description: 'Photo or graphic' },
  { type: 'video', label: 'Video', icon: Video, description: 'Embed video' },
  { type: 'form-field', label: 'Form', icon: Mail, description: 'Input field' },
  { type: 'bullet-list', label: 'List', icon: List, description: 'Bullet points' },
  { type: 'testimonial', label: 'Quote', icon: Quote, description: 'Testimonial' },
  { type: 'countdown', label: 'Timer', icon: Timer, description: 'Countdown' },
  { type: 'loader', label: 'Loader', icon: Loader2, description: 'Loading state' },
];

interface BlockAdderProps {
  onAddBlock: (blockType: string) => void;
  variant?: 'default' | 'minimal' | 'inline';
  className?: string;
}

export function BlockAdder({ 
  onAddBlock, 
  variant = 'default',
  className 
}: BlockAdderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectBlock = (blockType: string) => {
    onAddBlock(blockType);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "group flex items-center gap-2 transition-all",
            variant === 'default' && [
              "px-3 py-2 rounded-lg",
              "text-[hsl(var(--builder-text-muted))]",
              "hover:text-[hsl(var(--builder-text))]",
              "hover:bg-[hsl(var(--builder-surface-hover))]",
              "border border-dashed border-[hsl(var(--builder-border))]",
              "hover:border-[hsl(var(--builder-accent)/0.5)]"
            ],
            variant === 'minimal' && [
              "px-2 py-1.5 rounded-md text-xs",
              "text-[hsl(var(--builder-text-dim))]",
              "hover:text-[hsl(var(--builder-text-muted))]"
            ],
            variant === 'inline' && [
              "px-2 py-1 rounded text-xs",
              "text-[hsl(var(--builder-text-muted))]",
              "hover:text-[hsl(var(--builder-accent))]"
            ],
            className
          )}
        >
          <Plus className={cn(
            "transition-transform",
            variant === 'default' ? "w-4 h-4" : "w-3.5 h-3.5",
            "group-hover:rotate-90"
          )} />
          <span className={cn(
            "font-medium",
            variant === 'default' ? "text-sm" : "text-xs"
          )}>
            Add content
          </span>
        </button>
      </PopoverTrigger>
      
      <PopoverContent 
        side="bottom" 
        align="start"
        sideOffset={8}
        className={cn(
          "w-[320px] p-3",
          "bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))]",
          "shadow-xl shadow-black/20"
        )}
      >
        <div className="mb-2">
          <h4 className="text-xs font-semibold text-[hsl(var(--builder-text-muted))] uppercase tracking-wide">
            Add Block
          </h4>
        </div>
        
        <div className="grid grid-cols-2 gap-1.5">
          {BLOCK_TYPES.map((block) => {
            const Icon = block.icon;
            return (
              <button
                key={block.type}
                onClick={() => handleSelectBlock(block.type)}
                className={cn(
                  "group flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left",
                  "bg-[hsl(var(--builder-bg))]",
                  "border border-transparent",
                  "hover:border-[hsl(var(--builder-accent)/0.3)]",
                  "hover:bg-[hsl(var(--builder-accent)/0.08)]",
                  "transition-all duration-150"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg",
                  "bg-[hsl(var(--builder-surface-hover))]",
                  "group-hover:bg-[hsl(var(--builder-accent)/0.15)]",
                  "transition-colors"
                )}>
                  <Icon className={cn(
                    "w-4 h-4",
                    "text-[hsl(var(--builder-text-muted))]",
                    "group-hover:text-[hsl(var(--builder-accent))]",
                    "transition-colors"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-[hsl(var(--builder-text))]">
                    {block.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
