/**
 * Preview Input Block
 */

import { Block, FunnelSettings } from '../../types/funnel';
import { cn } from '@/lib/utils';

interface PreviewInputBlockProps {
  block: Block;
  settings: FunnelSettings;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function PreviewInputBlock({ block, value, onChange, error }: PreviewInputBlockProps) {
  const { inputType = 'text', placeholder, label, required } = block.props;

  const inputTypeMap: Record<string, string> = {
    text: 'text',
    email: 'email',
    phone: 'tel',
    name: 'text',
    textarea: 'textarea',
  };

  const placeholderMap: Record<string, string> = {
    text: 'Enter text...',
    email: 'you@example.com',
    phone: '+1 (555) 000-0000',
    name: 'Your name',
    textarea: 'Enter your message...',
  };

  const displayLabel = label || (inputType === 'email' ? 'Email' : inputType === 'phone' ? 'Phone' : inputType === 'name' ? 'Name' : 'Field');
  const displayPlaceholder = placeholder || placeholderMap[inputType] || '';

  const baseInputClasses = cn(
    'w-full px-4 py-3 rounded-lg border transition-all',
    'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
    error 
      ? 'border-red-400 bg-red-50' 
      : 'border-gray-200 bg-white hover:border-gray-300'
  );

  return (
    <div className="space-y-2">
      {displayLabel && (
        <label className="text-sm font-medium text-gray-700">
          {displayLabel}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {inputType === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={displayPlaceholder}
          rows={4}
          className={baseInputClasses}
        />
      ) : (
        <input
          type={inputTypeMap[inputType] || 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={displayPlaceholder}
          className={baseInputClasses}
        />
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
