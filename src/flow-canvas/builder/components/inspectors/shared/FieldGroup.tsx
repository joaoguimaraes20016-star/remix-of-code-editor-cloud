/**
 * FieldGroup - Shared inspector field wrapper
 * 
 * Provides consistent field labeling and hints across all inspector panels.
 * Uses builder design tokens for theming.
 */

import React from 'react';
import { Label } from '@/components/ui/label';

export interface FieldGroupProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
}

export const FieldGroup = React.forwardRef<HTMLDivElement, FieldGroupProps>(
  ({ label, children, hint }, ref) => (
    <div ref={ref} className="space-y-1.5">
      <Label className="text-xs text-builder-text-muted">{label}</Label>
      {children}
      {hint && <p className="text-[10px] text-builder-text-dim">{hint}</p>}
    </div>
  )
);

FieldGroup.displayName = 'FieldGroup';
