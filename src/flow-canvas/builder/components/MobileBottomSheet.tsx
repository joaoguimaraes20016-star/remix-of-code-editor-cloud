import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, Copy, Trash2 } from 'lucide-react';
import { Drawer } from 'vaul';

type SheetSnapPoint = 'peek' | 'half' | 'full';

interface MobileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onDelete?: () => void;
  onDuplicate?: () => void;
  showActions?: boolean;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  onDelete,
  onDuplicate,
  showActions = true,
}) => {
  return (
    <Drawer.Root 
      open={open} 
      onOpenChange={(isOpen) => !isOpen && onClose()}
      snapPoints={[0.35, 0.6, 1]}
      activeSnapPoint={0.6}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-[hsl(var(--builder-surface))] rounded-t-[20px] max-h-[96vh]">
          {/* Handle */}
          <div className="mobile-bottom-sheet__handle">
            <div className="mobile-bottom-sheet__handle-bar" />
          </div>

          {/* Header */}
          <div className="mobile-bottom-sheet__header">
            <div>
              <Drawer.Title className="mobile-bottom-sheet__title">
                {title}
              </Drawer.Title>
              {subtitle && (
                <p className="text-sm text-[hsl(var(--builder-text-muted))] mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="mobile-toolbar-btn"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mobile-bottom-sheet__content flex-1 overflow-y-auto">
            {children}
          </div>

          {/* Actions */}
          {showActions && (onDelete || onDuplicate) && (
            <div className="mobile-bottom-sheet__actions">
              {onDuplicate && (
                <button
                  onClick={onDuplicate}
                  className="mobile-bottom-sheet__action-btn mobile-bottom-sheet__action-btn--secondary"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="mobile-bottom-sheet__action-btn mobile-bottom-sheet__action-btn--destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

// Control group for the bottom sheet - large touch-friendly controls
interface ControlGroupProps {
  label: string;
  children: React.ReactNode;
}

export const ControlGroup: React.FC<ControlGroupProps> = ({ label, children }) => (
  <div className="mb-6">
    <label className="block text-xs font-medium text-[hsl(var(--builder-text-muted))] uppercase tracking-wide mb-3">
      {label}
    </label>
    {children}
  </div>
);

// Touch-friendly input
interface TouchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const TouchInput: React.FC<TouchInputProps> = ({ label, className, ...props }) => (
  <div className="mb-4">
    {label && (
      <label className="block text-sm font-medium text-[hsl(var(--builder-text-secondary))] mb-2">
        {label}
      </label>
    )}
    <input
      className={cn(
        "w-full min-h-[var(--touch-target-min)] px-4 py-3 text-base",
        "bg-[hsl(var(--builder-surface-hover))] border border-[hsl(var(--builder-border))]",
        "rounded-xl text-[hsl(var(--builder-text))]",
        "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--builder-accent))]",
        className
      )}
      {...props}
    />
  </div>
);

// Touch-friendly segmented control
interface SegmentOption {
  value: string;
  label: string;
}

interface TouchSegmentedControlProps {
  value: string;
  onChange: (value: string) => void;
  options: SegmentOption[];
  label?: string;
}

export const TouchSegmentedControl: React.FC<TouchSegmentedControlProps> = ({
  value,
  onChange,
  options,
  label,
}) => (
  <div className="mb-4">
    {label && (
      <label className="block text-sm font-medium text-[hsl(var(--builder-text-secondary))] mb-2">
        {label}
      </label>
    )}
    <div className="flex bg-[hsl(var(--builder-surface-hover))] rounded-xl p-1 gap-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex-1 min-h-[var(--touch-target-min)] px-4 py-3 text-sm font-medium rounded-lg transition-all",
            value === option.value
              ? "bg-[hsl(var(--builder-accent))] text-white"
              : "text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))]"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);

// Color picker row - touch friendly
interface TouchColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  presets?: string[];
  label?: string;
}

export const TouchColorPicker: React.FC<TouchColorPickerProps> = ({
  value,
  onChange,
  presets = ['#000000', '#FFFFFF', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'],
  label,
}) => (
  <div className="mb-4">
    {label && (
      <label className="block text-sm font-medium text-[hsl(var(--builder-text-secondary))] mb-2">
        {label}
      </label>
    )}
    <div className="flex gap-2 flex-wrap">
      {presets.map((color) => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className={cn(
            "w-11 h-11 rounded-xl border-2 transition-all",
            value === color
              ? "border-[hsl(var(--builder-accent))] scale-110"
              : "border-transparent"
          )}
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
  </div>
);
