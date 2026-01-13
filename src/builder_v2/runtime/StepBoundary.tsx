/**
 * StepBoundary keeps each logical step isolated so we can opt into motion
 * transitions without duplicating animation logic across components.
 * Uses popLayout mode for smoother layout shifts during transitions.
 */
import type { ReactNode } from 'react';
import { AnimatePresence, useReducedMotion } from 'framer-motion';

import type { MotionMode } from './MotionContainer';
import { MotionContainer } from './MotionContainer';

export interface StepBoundaryProps {
  children: ReactNode;
  motionMode?: MotionMode;
  stepId?: string | number;
}

export function StepBoundary({
  children,
  motionMode = 'off',
  stepId = 'step-boundary',
}: StepBoundaryProps) {
  const prefersReducedMotion = useReducedMotion();
  const resolvedMode = prefersReducedMotion ? 'off' : motionMode;

  if (resolvedMode === 'off') {
    return <div className="runtime-step-boundary">{children}</div>;
  }

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <MotionContainer
        key={stepId}
        className="runtime-step-boundary"
        motionMode={resolvedMode}
      >
        {children}
      </MotionContainer>
    </AnimatePresence>
  );
}
