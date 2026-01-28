/**
 * QuickPicks - Quick section cards for empty state
 * Shows the 3 most common section types for fast access
 */

import { Layout, MousePointerClick, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickPickCardProps {
  type: 'hero' | 'cta' | 'form';
  label: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  onClick: () => void;
}

const QuickPickCard = ({ label, description, icon, gradient, onClick }: QuickPickCardProps) => (
  <button
    onClick={onClick}
    className={cn(
      "group relative flex flex-col items-center p-6 rounded-xl",
      "bg-white border border-gray-200",
      "hover:border-blue-300 hover:shadow-lg",
      "transition-all duration-200",
      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    )}
  >
    {/* Icon */}
    <div className={cn(
      "w-14 h-14 rounded-xl flex items-center justify-center mb-4",
      "bg-gradient-to-br shadow-lg",
      gradient,
      "group-hover:scale-110 transition-transform duration-200"
    )}>
      {icon}
    </div>
    
    {/* Label */}
    <span className="text-sm font-semibold text-gray-900 mb-1">
      {label}
    </span>
    <span className="text-xs text-gray-500 text-center">
      {description}
    </span>
  </button>
);

interface QuickPicksProps {
  onSelectType: (type: 'hero' | 'cta' | 'form') => void;
}

export function QuickPicks({ onSelectType }: QuickPicksProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <QuickPickCard
        type="hero"
        label="Hero Section"
        description="Headline & intro"
        icon={<Layout className="w-7 h-7 text-white" />}
        gradient="from-violet-500 to-purple-600"
        onClick={() => onSelectType('hero')}
      />
      <QuickPickCard
        type="cta"
        label="Call to Action"
        description="Convert visitors"
        icon={<MousePointerClick className="w-7 h-7 text-white" />}
        gradient="from-blue-500 to-cyan-500"
        onClick={() => onSelectType('cta')}
      />
      <QuickPickCard
        type="form"
        label="Lead Form"
        description="Capture emails"
        icon={<Mail className="w-7 h-7 text-white" />}
        gradient="from-emerald-500 to-green-600"
        onClick={() => onSelectType('form')}
      />
    </div>
  );
}
