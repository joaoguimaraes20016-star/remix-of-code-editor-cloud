/**
 * RuntimeSuccessOverlay
 * Displays a success message after form submission
 */

import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RuntimeSuccessOverlayProps {
  message?: string;
  className?: string;
}

export function RuntimeSuccessOverlay({ 
  message = 'Thank you for your submission!',
  className 
}: RuntimeSuccessOverlayProps) {
  return (
    <div 
      className={cn(
        "min-h-screen w-full flex items-center justify-center",
        "bg-gradient-to-b from-builder-bg to-builder-surface",
        className
      )}
    >
      <div className="text-center space-y-6 p-8 animate-in fade-in zoom-in duration-500">
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-emerald-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">
            {message}
          </h2>
          <p className="text-white/60">
            We'll be in touch soon.
          </p>
        </div>
      </div>
    </div>
  );
}
