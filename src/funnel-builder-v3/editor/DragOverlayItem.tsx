import React from 'react';
import { Block } from '@/types/funnel';
import { blockDefinitions } from '@/lib/block-definitions';
import { cn } from '@/lib/utils';
import { GripVertical, Type, AlignLeft, Image, Play, Minus, Square, MousePointer, FileText, Mail, Phone, Calendar, Quote, Star, Layers, Users, LayoutGrid, ChevronDown, Clock, HelpCircle } from 'lucide-react';

// Block type to icon mapping
const blockIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  heading: Type,
  text: AlignLeft,
  image: Image,
  video: Play,
  divider: Minus,
  spacer: Square,
  button: MousePointer,
  form: FileText,
  'email-capture': Mail,
  'phone-capture': Phone,
  calendar: Calendar,
  testimonial: Quote,
  reviews: Star,
  'logo-bar': Layers,
  'social-proof': Users,
  columns: LayoutGrid,
  card: Square,
  accordion: ChevronDown,
  countdown: Clock,
  quiz: HelpCircle,
};

function getBlockPreviewText(block: Block): string {
  const content = block.content as any;
  switch (block.type) {
    case 'heading':
    case 'text':
      const text = content?.text || '';
      return text.length > 30 ? text.substring(0, 30) + '...' : text;
    case 'button':
      return content?.text || 'Button';
    case 'image':
      return content?.alt || 'Image';
    case 'video':
      return content?.type || 'Video';
    default:
      return blockDefinitions[block.type]?.name || block.type;
  }
}

interface DragOverlayItemProps {
  block: Block;
  variant?: 'canvas' | 'layer';
}

export function DragOverlayItem({ block, variant = 'canvas' }: DragOverlayItemProps) {
  const Icon = blockIcons[block.type] || Square;
  const definition = blockDefinitions[block.type];
  const previewText = getBlockPreviewText(block);

  if (variant === 'layer') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-lg',
          'bg-card border-2 border-primary shadow-2xl',
          'cursor-grabbing select-none',
          'animate-in zoom-in-95 duration-150'
        )}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.5)',
        }}
      >
        {/* Drag handle */}
        <div className="opacity-100 cursor-grabbing">
          <GripVertical className="h-3 w-3 text-primary" />
        </div>
        
        {/* Icon */}
        <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 bg-primary/20">
          <Icon className="h-3 w-3 text-primary" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-primary truncate block">
            {definition?.name || block.type}
          </span>
          <span className="text-[10px] text-muted-foreground truncate block">
            {previewText}
          </span>
        </div>
      </div>
    );
  }

  // Canvas variant - larger, more prominent
  return (
    <div
      className={cn(
        'rounded-xl p-4 min-w-[200px] max-w-[320px]',
        'bg-card border-2 border-primary',
        'cursor-grabbing select-none',
        'animate-in zoom-in-95 duration-150'
      )}
      style={{
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(99, 102, 241, 0.5), 0 0 40px rgba(99, 102, 241, 0.15)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">
            {definition?.name || block.type}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {previewText}
          </p>
        </div>
        <GripVertical className="h-5 w-5 text-primary shrink-0" />
      </div>
    </div>
  );
}
