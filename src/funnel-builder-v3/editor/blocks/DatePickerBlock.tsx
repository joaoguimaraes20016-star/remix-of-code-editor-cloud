import React, { useState, useEffect, useCallback } from 'react';
import { DatePickerContent, TextStyles } from '@/funnel-builder-v3/types/funnel';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useFunnelRuntimeOptional } from '@/funnel-builder-v3/context/FunnelRuntimeContext';
import { useFunnelOptional } from '@/funnel-builder-v3/context/FunnelContext';
import { EditableText } from '@/funnel-builder-v3/editor/EditableText';

interface DatePickerBlockProps {
  content: DatePickerContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function DatePickerBlock({ content, blockId, stepId, isPreview }: DatePickerBlockProps) {
  const { label, placeholder, minDate, maxDate } = content;
  const runtime = useFunnelRuntimeOptional();
  const funnelContext = useFunnelOptional();
  const updateBlockContent = funnelContext?.updateBlockContent ?? (() => {});
  const [date, setDate] = useState<Date | undefined>();

  const canEdit = blockId && stepId && !isPreview;

  const minDateObj = minDate ? new Date(minDate) : undefined;
  const maxDateObj = maxDate ? new Date(maxDate) : undefined;

  // Load saved value from runtime on mount
  useEffect(() => {
    if (runtime && blockId) {
      const saved = runtime.formData[blockId];
      if (typeof saved === 'string') {
        setDate(new Date(saved));
      }
    }
  }, [runtime, blockId]);

  const handleSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (blockId && newDate) {
      runtime?.setFormField(blockId, newDate.toISOString());
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
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'PPP') : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            disabled={(date) => {
              if (minDateObj && date < minDateObj) return true;
              if (maxDateObj && date > maxDateObj) return true;
              return false;
            }}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
