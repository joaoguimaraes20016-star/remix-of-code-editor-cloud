/**
 * MotionContainer centralizes all runtime motion behavior so we can enable or
 * disable animation without touching every call site. Uses spring physics for
 * natural, fluid step transitions.
 */
import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export type MotionMode = 'off' | 'preview' | 'runtime';

export interface MotionContainerProps {
  children: ReactNode;
  className?: string;
  motionMode?: MotionMode;
}

const MOTION_VARIANTS = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.99 },
};

// Spring-based transition for natural feel
const MOTION_TRANSITION = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

// Faster exit transition
const EXIT_TRANSITION = {
  duration: 0.15,
  ease: [0.32, 0, 0.67, 0] as const,
};

export function MotionContainer({
  children,
  className,
  motionMode = 'off',
}: MotionContainerProps) {
  const prefersReducedMotion = useReducedMotion();
  const resolvedClass = className ?? 'runtime-motion-container';
  const shouldAnimate = motionMode !== 'off' && !prefersReducedMotion;

  if (!shouldAnimate) {
    return (
      <div className={resolvedClass} data-motion-mode="off">
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={resolvedClass}
      data-motion-mode={motionMode}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={MOTION_VARIANTS}
      transition={MOTION_TRANSITION}
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  );
}
