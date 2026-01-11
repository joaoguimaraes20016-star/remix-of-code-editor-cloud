/**
 * ToolbarPortal - Renders toolbars in a portal layer outside the device-frame
 * to prevent clipping from overflow-hidden. Uses React Portal to position
 * toolbars relative to their target elements but render in a fixed overlay.
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface ToolbarPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface ActiveToolbar {
  id: string;
  type: 'element' | 'block';
  position: ToolbarPosition;
  elementType?: string;
}

interface ToolbarPortalContextValue {
  registerToolbar: (id: string, type: 'element' | 'block', rect: DOMRect, elementType?: string) => void;
  unregisterToolbar: (id: string) => void;
  activeToolbar: ActiveToolbar | null;
  portalContainer: HTMLDivElement | null;
  isMobileView: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ToolbarPortalContext = createContext<ToolbarPortalContextValue | null>(null);

export const useToolbarPortal = () => {
  const context = useContext(ToolbarPortalContext);
  if (!context) {
    // Return a no-op context for components outside provider
    return {
      registerToolbar: () => {},
      unregisterToolbar: () => {},
      activeToolbar: null,
      portalContainer: null,
      isMobileView: false,
    };
  }
  return context;
};

// ============================================================================
// PROVIDER
// ============================================================================

interface ToolbarPortalProviderProps {
  children: React.ReactNode;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export const ToolbarPortalProvider: React.FC<ToolbarPortalProviderProps> = ({
  children,
  containerRef,
}) => {
  const [activeToolbar, setActiveToolbar] = useState<ActiveToolbar | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);

  // Create portal container on mount
  useEffect(() => {
    const container = document.createElement('div');
    container.id = 'toolbar-portal-root';
    container.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 9999;';
    document.body.appendChild(container);
    setPortalContainer(container);

    // Check for mobile view
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      document.body.removeChild(container);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const registerToolbar = useCallback((
    id: string,
    type: 'element' | 'block',
    rect: DOMRect,
    elementType?: string
  ) => {
    setActiveToolbar({
      id,
      type,
      elementType,
      position: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
    });
  }, []);

  const unregisterToolbar = useCallback((id: string) => {
    setActiveToolbar(prev => prev?.id === id ? null : prev);
  }, []);

  return (
    <ToolbarPortalContext.Provider value={{
      registerToolbar,
      unregisterToolbar,
      activeToolbar,
      portalContainer,
      isMobileView,
    }}>
      {children}
    </ToolbarPortalContext.Provider>
  );
};

// ============================================================================
// PORTAL TOOLBAR WRAPPER
// ============================================================================

interface PortalToolbarProps {
  children: React.ReactNode;
  targetRect: DOMRect | null;
  isVisible: boolean;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
  className?: string;
}

/**
 * Calculates position keeping toolbar within viewport bounds
 */
function calculatePosition(
  targetRect: DOMRect,
  placement: 'top' | 'bottom' | 'left' | 'right',
  offset: number,
  toolbarWidth: number = 300,
  toolbarHeight: number = 44
): { top: number; left: number; transformOrigin: string } {
  const padding = 8;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let top = 0;
  let left = 0;
  let transformOrigin = 'center bottom';

  switch (placement) {
    case 'top':
      top = targetRect.top - offset - toolbarHeight;
      left = targetRect.left + targetRect.width / 2;
      transformOrigin = 'center bottom';
      break;
    case 'bottom':
      top = targetRect.bottom + offset;
      left = targetRect.left + targetRect.width / 2;
      transformOrigin = 'center top';
      break;
    case 'left':
      top = targetRect.top + targetRect.height / 2;
      left = targetRect.left - offset - toolbarWidth;
      transformOrigin = 'right center';
      break;
    case 'right':
      top = targetRect.top + targetRect.height / 2;
      left = targetRect.right + offset;
      transformOrigin = 'left center';
      break;
  }

  // Clamp to viewport
  if (placement === 'top' || placement === 'bottom') {
    // Keep within horizontal bounds
    const halfWidth = toolbarWidth / 2;
    if (left - halfWidth < padding) {
      left = halfWidth + padding;
    } else if (left + halfWidth > viewportWidth - padding) {
      left = viewportWidth - halfWidth - padding;
    }
    // Flip if goes off top
    if (placement === 'top' && top < padding) {
      top = targetRect.bottom + offset;
      transformOrigin = 'center top';
    }
  } else {
    // Keep within vertical bounds
    const halfHeight = toolbarHeight / 2;
    if (top - halfHeight < padding) {
      top = halfHeight + padding;
    } else if (top + halfHeight > viewportHeight - padding) {
      top = viewportHeight - halfHeight - padding;
    }
  }

  return { top, left, transformOrigin };
}

export const PortalToolbar: React.FC<PortalToolbarProps> = ({
  children,
  targetRect,
  isVisible,
  placement = 'top',
  offset = 8,
  className,
}) => {
  const { portalContainer, isMobileView } = useToolbarPortal();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; transformOrigin: string } | null>(null);

  useEffect(() => {
    if (!targetRect || !isVisible) {
      setPosition(null);
      return;
    }

    const toolbarWidth = toolbarRef.current?.offsetWidth || 300;
    const toolbarHeight = toolbarRef.current?.offsetHeight || 44;
    
    setPosition(calculatePosition(targetRect, placement, offset, toolbarWidth, toolbarHeight));
  }, [targetRect, isVisible, placement, offset]);

  if (!portalContainer || !isVisible || !position) return null;

  // On mobile, use a bottom sheet style
  if (isMobileView) {
    return createPortal(
      <AnimatePresence>
        <motion.div
          ref={toolbarRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={cn(
            'fixed bottom-0 left-0 right-0 p-3 pointer-events-auto',
            'bg-[hsl(220,13%,10%)] border-t border-white/10',
            'safe-area-bottom',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-center gap-1 flex-wrap">
            {children}
          </div>
        </motion.div>
      </AnimatePresence>,
      portalContainer
    );
  }

  // Desktop: floating toolbar
  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={toolbarRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
        className={cn(
          'fixed pointer-events-auto',
          className
        )}
        style={{
          top: position.top,
          left: position.left,
          transform: 'translate(-50%, 0)',
          transformOrigin: position.transformOrigin,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </AnimatePresence>,
    portalContainer
  );
};

// ============================================================================
// MOBILE BOTTOM TOOLBAR
// ============================================================================

interface MobileToolbarSheetProps {
  children: React.ReactNode;
  isVisible: boolean;
  onClose?: () => void;
}

export const MobileToolbarSheet: React.FC<MobileToolbarSheetProps> = ({
  children,
  isVisible,
  onClose,
}) => {
  const { portalContainer } = useToolbarPortal();

  if (!portalContainer || !isVisible) return null;

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 pointer-events-auto"
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 pointer-events-auto bg-[hsl(220,13%,10%)] border-t border-white/10 rounded-t-2xl max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="px-4 pb-6 safe-area-bottom">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalContainer
  );
};
