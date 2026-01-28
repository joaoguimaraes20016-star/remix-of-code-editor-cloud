/**
 * EmptyCanvasState - Premium empty state for the canvas
 * Shows quick-pick cards when a screen has no blocks
 */

import { Layout, MousePointerClick, Mail, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAddCardProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  onClick: () => void;
}

function QuickAddCard({ label, description, icon, gradient, onClick }: QuickAddCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center p-5 rounded-xl",
        "bg-white/80 backdrop-blur-sm border border-gray-200/50",
        "hover:border-blue-300 hover:shadow-lg hover:bg-white",
        "transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      )}
    >
      {/* Icon */}
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
        "bg-gradient-to-br shadow-lg",
        gradient,
        "group-hover:scale-110 transition-transform duration-200"
      )}>
        {icon}
      </div>
      
      {/* Label */}
      <span className="text-sm font-semibold text-gray-900 mb-0.5">
        {label}
      </span>
      <span className="text-xs text-gray-500 text-center">
        {description}
      </span>
    </button>
  );
}

interface EmptyCanvasStateProps {
  onQuickAdd: (type: 'hero' | 'cta' | 'form') => void;
  onBrowseAll: () => void;
}

export function EmptyCanvasState({ onQuickAdd, onBrowseAll }: EmptyCanvasStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-6">
      {/* Header */}
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-6 shadow-lg">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Start Building Your Page
      </h2>
      <p className="text-sm text-gray-500 mb-8 text-center max-w-sm">
        Add blocks to create your funnel page. Choose a quick start or browse all blocks.
      </p>

      {/* Quick Add Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8 w-full max-w-md">
        <QuickAddCard
          label="Hero"
          description="Headline"
          icon={<Layout className="w-6 h-6 text-white" />}
          gradient="from-violet-500 to-purple-600"
          onClick={() => onQuickAdd('hero')}
        />
        <QuickAddCard
          label="CTA"
          description="Convert"
          icon={<MousePointerClick className="w-6 h-6 text-white" />}
          gradient="from-blue-500 to-cyan-500"
          onClick={() => onQuickAdd('cta')}
        />
        <QuickAddCard
          label="Form"
          description="Capture"
          icon={<Mail className="w-6 h-6 text-white" />}
          gradient="from-emerald-500 to-green-600"
          onClick={() => onQuickAdd('form')}
        />
      </div>

      {/* Browse All Button */}
      <button
        onClick={onBrowseAll}
        className={cn(
          "flex items-center gap-2 px-6 py-3 rounded-xl",
          "bg-gray-100 hover:bg-gray-200",
          "text-gray-700 font-medium text-sm",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        )}
      >
        <Plus className="w-4 h-4" />
        Browse All Blocks
      </button>
    </div>
  );
}
