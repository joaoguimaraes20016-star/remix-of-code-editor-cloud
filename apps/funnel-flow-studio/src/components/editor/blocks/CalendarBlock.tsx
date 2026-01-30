import React, { useState } from 'react';
import { CalendarContent } from '@/types/funnel';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFunnel } from '@/context/FunnelContext';
import { EditableText } from '@/components/editor/EditableText';

interface CalendarBlockProps {
  content: CalendarContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function CalendarBlock({ content, blockId, stepId, isPreview }: CalendarBlockProps) {
  const { updateBlockContent } = useFunnel();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const accentColor = content.accentColor || '#6366f1';

  const canEdit = blockId && stepId && !isPreview;

  const handleTitleChange = (newTitle: string) => {
    if (blockId && stepId) {
      updateBlockContent(stepId, blockId, { title: newTitle });
    }
  };

  const handleButtonTextChange = (newText: string) => {
    if (blockId && stepId) {
      updateBlockContent(stepId, blockId, { buttonText: newText });
    }
  };

  // For Calendly embed
  if (content.provider === 'calendly' && content.url) {
    return (
      <div className="space-y-4">
        {(content.title || canEdit) && (
          <div className="text-lg font-semibold text-center">
            {canEdit ? (
              <EditableText
                value={content.title || ''}
                onChange={handleTitleChange}
                as="h3"
                isPreview={isPreview}
                showToolbar={true}
                richText={true}
                styles={{}}
                onStyleChange={() => {}}
                placeholder="Add title..."
              />
            ) : (
              content.title
            )}
          </div>
        )}
        <iframe
          src={content.url}
          width="100%"
          height={content.height || 630}
          frameBorder="0"
          className="rounded-lg"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(content.title || canEdit) && (
        <div className="text-lg font-semibold text-center">
            {canEdit ? (
              <EditableText
                value={content.title || ''}
                onChange={handleTitleChange}
                as="h3"
                isPreview={isPreview}
                showToolbar={true}
                richText={true}
                styles={{}}
                onStyleChange={() => {}}
                placeholder="Add title..."
              />
          ) : (
            content.title
          )}
        </div>
      )}
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className={cn("rounded-lg border bg-card p-3 pointer-events-auto")}
          disabled={(date) => date < new Date()}
          modifiersStyles={{
            selected: {
              backgroundColor: accentColor,
              color: 'white',
            },
          }}
        />
      </div>
      <Button 
        className="w-full" 
        size="lg" 
        disabled={!date}
        style={{ backgroundColor: date ? accentColor : undefined }}
      >
        <CalendarDays className="h-4 w-4 mr-2" />
        {canEdit ? (
          <EditableText
            value={content.buttonText || 'Book Now'}
            onChange={handleButtonTextChange}
            as="span"
            isPreview={isPreview}
            showToolbar={true}
            richText={true}
            styles={{}}
            onStyleChange={() => {}}
          />
        ) : (
          content.buttonText || 'Book Now'
        )}
      </Button>
    </div>
  );
}
