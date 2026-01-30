import React, { useCallback } from 'react';
import { TestimonialContent, TextStyles } from '@/types/funnel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFunnel } from '@/context/FunnelContext';
import { EditableText } from '@/components/editor/EditableText';
import { useEditableStyleSync } from '@/hooks/useEditableStyleSync';

interface TestimonialBlockProps {
  content: TestimonialContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function TestimonialBlock({ content, blockId, stepId, isPreview }: TestimonialBlockProps) {
  const { updateBlockContent } = useFunnel();
  const { 
    quote, 
    authorName, 
    authorTitle, 
    authorImage, 
    rating,
    cardStyle = 'outline',
    quoteColor,
    authorColor,
    quoteStyles,
  } = content;

  const canEdit = blockId && stepId && !isPreview;

  // Wire quote text toolbar to block content
  const { styles: quoteToolbarStyles, handleStyleChange: handleQuoteStyleChange } = useEditableStyleSync(
    blockId,
    stepId,
    quoteColor,
    quoteStyles?.textGradient,
    quoteStyles,
    updateBlockContent,
    'quoteColor',
    'quoteStyles.textGradient'
  );

  const handleQuoteChange = useCallback((newQuote: string) => {
    if (blockId && stepId) {
      updateBlockContent(stepId, blockId, { quote: newQuote });
    }
  }, [blockId, stepId, updateBlockContent]);

  const handleAuthorNameChange = useCallback((newName: string) => {
    if (blockId && stepId) {
      updateBlockContent(stepId, blockId, { authorName: newName });
    }
  }, [blockId, stepId, updateBlockContent]);

  const handleAuthorTitleChange = useCallback((newTitle: string) => {
    if (blockId && stepId) {
      updateBlockContent(stepId, blockId, { authorTitle: newTitle });
    }
  }, [blockId, stepId, updateBlockContent]);

  // Card wrapper classes based on style
  const cardClasses = cn(
    "space-y-4",
    cardStyle === 'filled' && "bg-muted/50 rounded-xl p-5"
  );

  return (
    <div className={cardClasses}>
      {rating && (
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'h-4 w-4',
                i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
              )}
            />
          ))}
        </div>
      )}
      <div className={cn(
        "italic text-lg leading-relaxed",
        !quoteColor && !quoteStyles?.textGradient && "text-foreground"
      )}>
        {canEdit ? (
          <EditableText
            value={quote}
            onChange={handleQuoteChange}
            as="blockquote"
            isPreview={isPreview}
            showToolbar={true}
            richText={true}
            styles={quoteToolbarStyles}
            onStyleChange={handleQuoteStyleChange}
            singleLine={false}
          />
        ) : (
          (() => {
            // For preview mode: apply gradient or solid color styling
            const hasQuoteGradient = !!quoteStyles?.textGradient;
            const previewStyle: React.CSSProperties = hasQuoteGradient
              ? { '--text-gradient': quoteStyles!.textGradient } as React.CSSProperties
              : { color: quoteColor || undefined };
            return (
              <blockquote 
                className={cn(hasQuoteGradient && 'text-gradient-clip')}
                style={previewStyle}
              >
                {quote}
              </blockquote>
            );
          })()
        )}
      </div>
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={authorImage} alt={authorName} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
            {authorName.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div>
          <div 
            className="font-medium text-sm"
            style={{ color: authorColor || undefined }}
          >
            {canEdit ? (
              <EditableText
                value={authorName}
                onChange={handleAuthorNameChange}
                as="p"
                isPreview={isPreview}
                showToolbar={true}
                richText={true}
                styles={{}}
                onStyleChange={() => {}}
              />
            ) : (
              authorName
            )}
          </div>
          {(authorTitle || canEdit) && (
            <div className="text-xs text-muted-foreground">
              {canEdit ? (
                <EditableText
                  value={authorTitle || ''}
                  onChange={handleAuthorTitleChange}
                  as="p"
                  isPreview={isPreview}
                  showToolbar={true}
                  richText={true}
                  styles={{}}
                  onStyleChange={() => {}}
                  placeholder="Add title..."
                />
              ) : (
                authorTitle
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
