/**
 * OptionsEditor - Choice options with emoji/image support
 */

import React from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { FieldGroup } from '../layout/FieldGroup';
import { cn } from '@/lib/utils';

export interface ChoiceOption {
  id: string;
  label: string;
  emoji?: string;
  image?: string;
}

export interface OptionsEditorProps {
  options: ChoiceOption[];
  onChange: (options: ChoiceOption[]) => void;
  showEmoji?: boolean;
  showImage?: boolean;
  className?: string;
}

export function OptionsEditor({
  options,
  onChange,
  showEmoji = true,
  showImage = false,
  className,
}: OptionsEditorProps) {
  const addOption = () => {
    const newOption: ChoiceOption = {
      id: `option-${Date.now()}`,
      label: `Option ${options.length + 1}`,
      emoji: showEmoji ? '✨' : undefined,
    };
    onChange([...options, newOption]);
  };

  const updateOption = (id: string, updates: Partial<ChoiceOption>) => {
    onChange(options.map(opt => 
      opt.id === id ? { ...opt, ...updates } : opt
    ));
  };

  const removeOption = (id: string) => {
    if (options.length <= 1) return;
    onChange(options.filter(opt => opt.id !== id));
  };

  const inputClasses = cn(
    "flex-1 h-7 px-2 text-xs rounded",
    "bg-[hsl(var(--builder-v3-surface-active))]",
    "border border-[hsl(var(--builder-v3-border))]",
    "text-[hsl(var(--builder-v3-text))]",
    "focus:outline-none focus:ring-1 focus:ring-[hsl(var(--builder-v3-accent))]"
  );

  return (
    <FieldGroup label="Options" className={className}>
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={option.id} className="flex items-center gap-1.5 group">
            {/* Drag handle */}
            <div className="w-5 flex items-center justify-center text-[hsl(var(--builder-v3-text-dim))] opacity-0 group-hover:opacity-100 cursor-grab">
              <GripVertical size={12} />
            </div>

            {/* Emoji input */}
            {showEmoji && (
              <input
                type="text"
                value={option.emoji || ''}
                onChange={(e) => updateOption(option.id, { emoji: e.target.value.slice(0, 2) })}
                className={cn(inputClasses, "w-10 text-center")}
                placeholder="🔥"
                maxLength={2}
              />
            )}

            {/* Label input */}
            <input
              type="text"
              value={option.label}
              onChange={(e) => updateOption(option.id, { label: e.target.value })}
              className={inputClasses}
              placeholder="Option label"
            />

            {/* Image URL input */}
            {showImage && (
              <input
                type="text"
                value={option.image || ''}
                onChange={(e) => updateOption(option.id, { image: e.target.value })}
                className={cn(inputClasses, "w-24")}
                placeholder="Image URL"
              />
            )}

            {/* Remove button */}
            <button
              type="button"
              onClick={() => removeOption(option.id)}
              disabled={options.length <= 1}
              className={cn(
                "w-6 h-6 rounded flex items-center justify-center transition-colors",
                options.length <= 1
                  ? "text-[hsl(var(--builder-v3-text-dim))] opacity-30 cursor-not-allowed"
                  : "text-[hsl(var(--builder-v3-text-dim))] hover:bg-[hsl(var(--builder-v3-surface-hover))] hover:text-red-400"
              )}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}

        {/* Add button */}
        <button
          type="button"
          onClick={addOption}
          className={cn(
            "w-full h-8 rounded flex items-center justify-center gap-1.5 text-xs",
            "border border-dashed border-[hsl(var(--builder-v3-border))]",
            "text-[hsl(var(--builder-v3-text-muted))]",
            "hover:bg-[hsl(var(--builder-v3-surface-hover))] hover:border-[hsl(var(--builder-v3-text-muted))]",
            "transition-colors"
          )}
        >
          <Plus size={12} />
          Add Option
        </button>
      </div>
    </FieldGroup>
  );
}
