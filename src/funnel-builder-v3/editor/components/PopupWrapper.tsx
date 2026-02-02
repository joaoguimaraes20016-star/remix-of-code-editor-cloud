import React, { useEffect, useState, useCallback } from 'react';
import { PopupSettings } from '@/funnel-builder-v3/types/funnel';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PopupWrapperProps {
  children: React.ReactNode;
  settings: PopupSettings;
  blockId: string;
  isPreview?: boolean;
  onClose?: () => void;
  onComplete?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PopupWrapper({
  children,
  settings,
  blockId,
  isPreview = false,
  onClose,
  onComplete,
  isOpen: controlledIsOpen,
  onOpenChange,
}: PopupWrapperProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use controlled or internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = useCallback((open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  }, [onOpenChange]);

  const { trigger, delay = 0, required = false } = settings;

  // Handle trigger logic
  useEffect(() => {
    if (!settings.enabled || !isPreview) return;

    if (trigger === 'on-load') {
      // Open immediately on load
      setIsOpen(true);
    } else if (trigger === 'on-delay' && delay > 0) {
      // Open after delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, delay * 1000);
      return () => clearTimeout(timer);
    }
    // 'on-click' is handled externally by trigger element
  }, [trigger, delay, settings.enabled, isPreview, setIsOpen]);

  const handleClose = useCallback(() => {
    if (required) {
      // Cannot close required popups without completing
      return;
    }
    setIsOpen(false);
    onClose?.();
  }, [required, setIsOpen, onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !required) {
      handleClose();
    }
  }, [handleClose, required]);

  const handleComplete = useCallback(() => {
    setIsOpen(false);
    onComplete?.();
  }, [setIsOpen, onComplete]);

  // In editor mode (not preview), show inline with indicator
  if (!isPreview) {
    return (
      <div className="relative">
        {settings.enabled && (
          <div className="absolute -top-6 left-0 right-0 flex justify-center">
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Popup: {trigger === 'on-load' ? 'On Load' : trigger === 'on-delay' ? `After ${delay}s` : 'On Click'}
              {required && ' (Required)'}
            </span>
          </div>
        )}
        <div className={cn(
          settings.enabled && "border-2 border-dashed border-primary/30 rounded-xl p-2"
        )}>
          {children}
        </div>
      </div>
    );
  }

  // In preview/runtime mode, render as modal
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div 
        className="relative bg-background rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button - only show if not required */}
        {!required && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-8 w-8 rounded-full"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        {/* Popup content */}
        <div className="pt-2">
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              // Pass onComplete to child form/interactive blocks
              return React.cloneElement(child as React.ReactElement<any>, {
                onPopupComplete: handleComplete,
              });
            }
            return child;
          })}
        </div>
      </div>
    </div>
  );
}

// Hook to trigger popup from external element (for on-click trigger)
export function usePopupTrigger(blockId: string) {
  const [isOpen, setIsOpen] = useState(false);
  
  const trigger = useCallback(() => {
    setIsOpen(true);
  }, []);
  
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);
  
  return { isOpen, trigger, close, setIsOpen };
}
