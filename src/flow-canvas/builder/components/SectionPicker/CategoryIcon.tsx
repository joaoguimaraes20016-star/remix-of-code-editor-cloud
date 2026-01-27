/**
 * CategoryIcon - Simple geometric icons for section picker
 * Matches Perspective's clean icon style
 */

import { cn } from '@/lib/utils';

type IconType = 
  | 'text' 
  | 'sparkles' 
  | 'square' 
  | 'grid' 
  | 'bars' 
  | 'squares' 
  | 'people' 
  | 'quote';

interface CategoryIconProps {
  icon: IconType;
  isActive?: boolean;
}

export function CategoryIcon({ icon, isActive }: CategoryIconProps) {
  const baseClasses = cn(
    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
    isActive ? "bg-blue-100" : "bg-gray-100"
  );
  
  const fillClasses = isActive ? "bg-blue-500" : "bg-gray-400";

  const renderIcon = () => {
    switch (icon) {
      // Text/Basic - "T" letter shape
      case 'text':
        return (
          <div className="flex flex-col items-center">
            <div className={cn("w-5 h-1 rounded-sm", fillClasses)} />
            <div className={cn("w-1.5 h-4 rounded-sm -mt-0.5", fillClasses)} />
          </div>
        );
      
      // Sparkles/Interactive - star shape
      case 'sparkles':
        return (
          <div className="relative w-5 h-5">
            <div className={cn("absolute top-0 left-1/2 -translate-x-1/2 w-1 h-2 rounded-full", fillClasses)} />
            <div className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-2 rounded-full", fillClasses)} />
            <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-2 h-1 rounded-full", fillClasses)} />
            <div className={cn("absolute right-0 top-1/2 -translate-y-1/2 w-2 h-1 rounded-full", fillClasses)} />
          </div>
        );
      
      // Hero - solid square
      case 'square':
        return <div className={cn("w-5 h-5 rounded", fillClasses)} />;
      
      // Features - 2x2 grid
      case 'grid':
        return (
          <div className="grid grid-cols-2 gap-1">
            <div className={cn("w-2 h-2 rounded-sm", fillClasses)} />
            <div className={cn("w-2 h-2 rounded-sm", fillClasses)} />
            <div className={cn("w-2 h-2 rounded-sm", fillClasses)} />
            <div className={cn("w-2 h-2 rounded-sm", fillClasses)} />
          </div>
        );
      
      // CTA - horizontal bars
      case 'bars':
        return (
          <div className="flex flex-col gap-1 items-start">
            <div className={cn("w-5 h-1.5 rounded-sm", fillClasses)} />
            <div className={cn("w-3.5 h-1.5 rounded-sm", fillClasses)} />
          </div>
        );
      
      // Quiz - 4 squares arranged
      case 'squares':
        return (
          <div className="grid grid-cols-2 gap-0.5">
            <div className={cn("w-2.5 h-2.5 rounded-sm", fillClasses)} />
            <div className={cn("w-2.5 h-2.5 rounded-sm opacity-60", fillClasses)} />
            <div className={cn("w-2.5 h-2.5 rounded-sm opacity-60", fillClasses)} />
            <div className={cn("w-2.5 h-2.5 rounded-sm", fillClasses)} />
          </div>
        );
      
      // Team - person shapes
      case 'people':
        return (
          <div className="flex gap-0.5 items-end">
            <div className="flex flex-col items-center">
              <div className={cn("w-1.5 h-1.5 rounded-full", fillClasses)} />
              <div className={cn("w-2.5 h-3 rounded-t-full -mt-0.5", fillClasses)} />
            </div>
            <div className="flex flex-col items-center">
              <div className={cn("w-1.5 h-1.5 rounded-full", fillClasses)} />
              <div className={cn("w-2.5 h-3 rounded-t-full -mt-0.5", fillClasses)} />
            </div>
          </div>
        );
      
      // Testimonials - quote marks
      case 'quote':
        return (
          <div className="flex gap-0.5">
            <div className={cn("w-2 h-3 rounded-sm", fillClasses)} />
            <div className={cn("w-2 h-3 rounded-sm opacity-60", fillClasses)} />
          </div>
        );
      
      default:
        return <div className={cn("w-5 h-5 rounded", fillClasses)} />;
    }
  };

  return (
    <div className={baseClasses}>
      {renderIcon()}
    </div>
  );
}
