/**
 * InlineSectionPicker - Wrapper for the Perspective-style section picker
 * Uses the new PerspectiveSectionPicker for a premium visual experience
 */

import { PerspectiveSectionPicker } from './PerspectiveSectionPicker';

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
    <PerspectiveSectionPicker
      isOpen={isOpen}
      onClose={onClose}
      onSelectTemplate={onSelectTemplate}
    />
  );
}
