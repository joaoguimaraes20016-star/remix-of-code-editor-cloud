/**
 * EmptyCanvasState - Premium empty state for when a page has no content
 * Shows quick picks + browse all templates option
 */

import { Layout, MousePointerClick, Mail, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickSectionCardProps {
  type: 'hero' | 'cta' | 'form';
  label: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  onClick: () => void;
}

const QuickSectionCard = ({ label, description, icon, gradient, onClick }: QuickSectionCardProps) => (
  <button
    onClick={onClick}
    className={cn(
      "group relative flex flex-col items-center p-5 rounded-xl",
      "bg-[hsl(var(--builder-surface)/0.6)] backdrop-blur-sm",
      "border border-[hsl(var(--builder-border)/0.5)]",
      "hover:border-[hsl(var(--builder-accent)/0.4)]",
      "hover:bg-[hsl(var(--builder-surface)/0.8)]",
      "hover:shadow-xl hover:shadow-[hsl(var(--builder-accent)/0.1)]",
      "transition-all duration-300",
      "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--builder-accent))]",
      "min-w-[140px]"
    )}
  >
    {/* Icon with gradient background */}
    <div className={cn(
      "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
      "bg-gradient-to-br shadow-lg",
      gradient,
      "group-hover:scale-110 group-hover:shadow-xl transition-all duration-300"
    )}>
      {icon}
    </div>
    
    {/* Label */}
    <span className="text-sm font-semibold text-[hsl(var(--builder-text))] mb-0.5">
      {label}
    </span>
    <span className="text-[11px] text-[hsl(var(--builder-text-muted))]">
      {description}
    </span>
  </button>
);

interface EmptyCanvasStateProps {
  onQuickAdd: (type: 'hero' | 'cta' | 'form') => void;
  onBrowseAll: () => void;
}

export function EmptyCanvasState({ onQuickAdd, onBrowseAll }: EmptyCanvasStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-6">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[hsl(var(--builder-accent)/0.03)] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[hsl(280,80%,60%)/0.03)] rounded-full blur-3xl" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center max-w-md text-center">
        {/* Sparkle icon */}
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center mb-6",
          "bg-gradient-to-br from-[hsl(var(--builder-accent))] to-[hsl(280,80%,60%)]",
          "shadow-lg shadow-[hsl(var(--builder-accent)/0.3)]"
        )}>
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        
        {/* Heading */}
        <h2 className="text-xl font-bold text-[hsl(var(--builder-text))] mb-2">
          Start Building Your Page
        </h2>
        <p className="text-sm text-[hsl(var(--builder-text-muted))] mb-8 max-w-xs">
          Choose a section template to get started, or browse all options
        </p>
        
        {/* Quick Picks */}
        <div className="flex items-center gap-3 mb-6">
          <QuickSectionCard
            type="hero"
            label="Hero"
            description="Opening section"
            icon={<Layout className="w-6 h-6 text-white" />}
            gradient="from-violet-500 to-purple-600"
            onClick={() => onQuickAdd('hero')}
          />
          <QuickSectionCard
            type="cta"
            label="CTA"
            description="Convert visitors"
            icon={<MousePointerClick className="w-6 h-6 text-white" />}
            gradient="from-blue-500 to-cyan-500"
            onClick={() => onQuickAdd('cta')}
          />
          <QuickSectionCard
            type="form"
            label="Form"
            description="Capture leads"
            icon={<Mail className="w-6 h-6 text-white" />}
            gradient="from-emerald-500 to-green-600"
            onClick={() => onQuickAdd('form')}
          />
        </div>
        
        {/* Browse All Button */}
        <button
          onClick={onBrowseAll}
          className={cn(
            "group flex items-center gap-2 px-5 py-2.5 rounded-xl",
            "text-sm font-medium",
            "bg-[hsl(var(--builder-surface))] border border-[hsl(var(--builder-border))]",
            "text-[hsl(var(--builder-text-secondary))]",
            "hover:border-[hsl(var(--builder-accent)/0.5)]",
            "hover:text-[hsl(var(--builder-text))]",
            "hover:bg-[hsl(var(--builder-surface-hover))]",
            "transition-all duration-200"
          )}
        >
          Browse All Templates
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
