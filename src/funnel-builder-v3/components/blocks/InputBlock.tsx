/**
 * Input Block
 */

import { Block } from '../../types/funnel';
import { cn } from '@/lib/utils';

interface InputBlockProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  previewMode: boolean;
  primaryColor?: string;
}

export function InputBlock({ block, previewMode, primaryColor }: InputBlockProps) {
  const { 
    inputType = 'text', 
    placeholder = '', 
    required = false,
    label,
  } = block.props;

  const getInputPlaceholder = () => {
    if (placeholder) return placeholder;
    switch (inputType) {
      case 'email': return 'Enter your email';
      case 'phone': return 'Enter your phone number';
      case 'name': return 'Enter your name';
      default: return 'Enter text...';
    }
  };

  const getInputType = () => {
    switch (inputType) {
      case 'email': return 'email';
      case 'phone': return 'tel';
      default: return 'text';
    }
  };

  return (
    <div className="p-2 space-y-2">
      {label && (
        <label className="block text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      
      {inputType === 'textarea' ? (
        <textarea
          placeholder={getInputPlaceholder()}
          className={cn(
            'w-full px-4 py-3 rounded-lg border border-input bg-background',
            'focus:outline-none focus:ring-2 transition-all',
            previewMode && 'cursor-text'
          )}
          style={{ 
            '--tw-ring-color': primaryColor || 'hsl(262, 83%, 58%)' 
          } as React.CSSProperties}
          rows={4}
          disabled={!previewMode}
        />
      ) : (
        <input
          type={getInputType()}
          placeholder={getInputPlaceholder()}
          className={cn(
            'w-full px-4 py-3 rounded-lg border border-input bg-background',
            'focus:outline-none focus:ring-2 transition-all',
            previewMode && 'cursor-text'
          )}
          style={{ 
            '--tw-ring-color': primaryColor || 'hsl(262, 83%, 58%)' 
          } as React.CSSProperties}
          disabled={!previewMode}
        />
      )}
    </div>
  );
}
