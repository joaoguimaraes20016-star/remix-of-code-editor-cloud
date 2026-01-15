// NameNode - Name capture (full name or split first/last)

import React from 'react';
import { CaptureNodeRendererProps } from '../CaptureNodeRenderer';
import { CaptureNodeWrapper } from '../CaptureNodeWrapper';
import { getInputStyleClass } from './nodeStyles';
import { User } from 'lucide-react';

export const NameNode: React.FC<CaptureNodeRendererProps> = ({
  node,
  value,
  onChange,
  onSubmit,
  validationError,
  isPreview,
  isSelected,
  onSelect,
}) => {
  const splitName = node.settings.splitName ?? false;
  
  // Handle both string and object values for split name
  const nameValue = typeof value === 'string' 
    ? value 
    : (value && typeof value === 'object' && !Array.isArray(value) && 'first' in value)
      ? String((value as Record<string, unknown>).first || '')
      : '';
  
  const lastName = (value && typeof value === 'object' && !Array.isArray(value) && 'last' in value)
    ? String((value as Record<string, unknown>).last || '')
    : '';

  const handleFullNameChange = (newValue: string) => {
    onChange(newValue);
  };

  const handleFirstNameChange = (first: string) => {
    // For split name, we store as a string "first last" format for simplicity
    onChange(lastName ? `${first} ${lastName}` : first);
  };

  const handleLastNameChange = (last: string) => {
    onChange(nameValue ? `${nameValue} ${last}` : last);
  };

  const inputClass = `
    w-full p-4
    bg-background border border-input 
    text-foreground placeholder:text-muted-foreground
    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
    ${getInputStyleClass(node.settings.inputStyle)}
  `;

  return (
    <CaptureNodeWrapper
      node={node}
      onSubmit={onSubmit}
      validationError={validationError}
      isPreview={isPreview}
      isSelected={isSelected}
      onSelect={onSelect}
    >
      {splitName ? (
        <div className="flex gap-3 w-full">
          <div className="relative flex-1">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={nameValue}
              onChange={(e) => handleFirstNameChange(e.target.value)}
              placeholder="First name"
              className={`${inputClass} pl-12`}
              disabled={isPreview}
              autoComplete="given-name"
            />
          </div>
          <input
            type="text"
            value={lastName}
            onChange={(e) => handleLastNameChange(e.target.value)}
            placeholder="Last name"
            className={inputClass}
            disabled={isPreview}
            autoComplete="family-name"
          />
        </div>
      ) : (
        <div className="relative w-full">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={nameValue}
            onChange={(e) => handleFullNameChange(e.target.value)}
            placeholder={node.settings.placeholder || 'Your full name'}
            className={`${inputClass} pl-12`}
            disabled={isPreview}
            autoComplete="name"
          />
        </div>
      )}
    </CaptureNodeWrapper>
  );
};

export default NameNode;
