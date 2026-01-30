import React, { useState, useEffect, useCallback } from 'react';
import { DropdownContent, TextStyles } from '@/types/funnel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFunnelRuntimeOptional } from '@/context/FunnelRuntimeContext';
import { useFunnel } from '@/context/FunnelContext';
import { EditableText } from '@/components/editor/EditableText';

interface DropdownBlockProps {
  content: DropdownContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function DropdownBlock({ content, blockId, stepId, isPreview }: DropdownBlockProps) {
  const { label, placeholder, options } = content;
  const runtime = useFunnelRuntimeOptional();
  const { updateBlockContent } = useFunnel();
  const [value, setValue] = useState<string>('');

  const canEdit = blockId && stepId && !isPreview;

  // Load saved value from runtime on mount
  useEffect(() => {
    if (runtime && blockId) {
      const saved = runtime.formData[blockId];
      if (typeof saved === 'string') {
        setValue(saved);
      }
    }
  }, [runtime, blockId]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    if (blockId) {
      runtime?.setFormField(blockId, newValue);
    }
  };

  const handleLabelChange = useCallback((newLabel: string) => {
    if (blockId && stepId) {
      updateBlockContent(stepId, blockId, { label: newLabel });
    }
  }, [blockId, stepId, updateBlockContent]);

  return (
    <div className="space-y-2">
      {(label || canEdit) && (
        <div className="text-sm font-medium">
          {canEdit ? (
            <EditableText
              value={label || ''}
              onChange={handleLabelChange}
              as="label"
              isPreview={isPreview}
              showToolbar={true}
              richText={true}
              styles={{}}
              onStyleChange={() => {}}
              placeholder="Add label..."
            />
          ) : (
            label
          )}
        </div>
      )}
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
