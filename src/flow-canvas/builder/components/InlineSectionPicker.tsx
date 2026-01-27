/**
 * InlineSectionPicker - Wrapper for the unified SectionPicker
 * This is a compatibility layer - prefer using SectionPicker directly
 */

import { SectionPicker } from './SectionPicker';

interface InlineSectionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
  position?: 'center' | 'bottom';
}

export function InlineSectionPicker({ 
  isOpen, 
  onClose, 
  onSelectTemplate,
}: InlineSectionPickerProps) {
  return (
    <SectionPicker
      isOpen={isOpen}
      onClose={onClose}
      onSelectTemplate={onSelectTemplate}
    />
  );
}
