import React, { useState, useEffect, useCallback } from 'react';
import { MessageContent, TextStyles } from '@/types/funnel';
import { Textarea } from '@/components/ui/textarea';
import { useFunnelRuntimeOptional } from '@/context/FunnelRuntimeContext';
import { useFunnel } from '@/context/FunnelContext';
import { EditableText } from '@/components/editor/EditableText';

interface MessageBlockProps {
  content: MessageContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function MessageBlock({ content, blockId, stepId, isPreview }: MessageBlockProps) {
  const { label, placeholder, minRows, maxLength } = content;
  const runtime = useFunnelRuntimeOptional();
  const { updateBlockContent } = useFunnel();
  const [text, setText] = useState('');

  const canEdit = blockId && stepId && !isPreview;

  // Load saved value from runtime on mount
  useEffect(() => {
    if (runtime && blockId) {
      const saved = runtime.formData[blockId];
      if (typeof saved === 'string') {
        setText(saved);
      }
    }
  }, [runtime, blockId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);
    if (blockId) {
      runtime?.setFormField(blockId, value);
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
      <Textarea
        placeholder={placeholder}
        rows={minRows}
        maxLength={maxLength}
        className="resize-none"
        value={text}
        onChange={handleChange}
      />
      {maxLength && (
        <p className="text-xs text-muted-foreground text-right">
          {text.length} / {maxLength}
        </p>
      )}
    </div>
  );
}
