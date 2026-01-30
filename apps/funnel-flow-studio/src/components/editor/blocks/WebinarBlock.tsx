import React, { useCallback } from 'react';
import { WebinarContent, TextStyles } from '@/types/funnel';
import { Play } from 'lucide-react';
import { useFunnel } from '@/context/FunnelContext';
import { EditableText } from '@/components/editor/EditableText';
import { cn } from '@/lib/utils';

interface WebinarBlockProps {
  content: WebinarContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

function getEmbedUrl(src: string, type: 'youtube' | 'vimeo' | 'hosted'): string {
  if (type === 'youtube') {
    // Extract video ID from various YouTube URL formats
    const match = src.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    const videoId = match ? match[1] : src;
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (type === 'vimeo') {
    const match = src.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    const videoId = match ? match[1] : src;
    return `https://player.vimeo.com/video/${videoId}`;
  }
  return src;
}

export function WebinarBlock({ content, blockId, stepId, isPreview }: WebinarBlockProps) {
  const { updateBlockContent } = useFunnel();
  const { videoSrc, videoType, title, buttonText, buttonColor, buttonGradient, titleColor, titleGradient } = content;

  const canEdit = blockId && stepId && !isPreview;

  const handleTitleChange = useCallback((newTitle: string) => {
    if (blockId && stepId) {
      updateBlockContent(stepId, blockId, { title: newTitle });
    }
  }, [blockId, stepId, updateBlockContent]);

  const handleButtonTextChange = useCallback((newText: string) => {
    if (blockId && stepId) {
      updateBlockContent(stepId, blockId, { buttonText: newText });
    }
  }, [blockId, stepId, updateBlockContent]);

  // Button styles
  const buttonStyle: React.CSSProperties = {};
  if (buttonGradient) {
    buttonStyle.background = buttonGradient;
  } else if (buttonColor) {
    buttonStyle.backgroundColor = buttonColor;
  }

  // Title styles
  const titleStyle: React.CSSProperties = {};
  const hasTitleGradient = !!titleGradient;
  if (titleGradient) {
    titleStyle.background = titleGradient;
    titleStyle.backgroundClip = 'text';
    titleStyle.WebkitBackgroundClip = 'text';
    titleStyle.color = 'transparent';
    titleStyle.WebkitTextFillColor = 'transparent';
  } else if (titleColor) {
    titleStyle.color = titleColor;
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      {(title || canEdit) && (
        <div 
          className={cn("text-xl font-bold text-center text-foreground", hasTitleGradient && "text-gradient-clip")}
          style={{
            ...titleStyle,
            ...(hasTitleGradient ? { '--text-gradient': titleGradient } as React.CSSProperties : {})
          }}
        >
          {canEdit ? (
            <EditableText
              value={title || ''}
              onChange={handleTitleChange}
              as="h3"
              isPreview={isPreview}
              showToolbar={true}
              richText={true}
              styles={{}}
              onStyleChange={() => {}}
              placeholder="Add webinar title..."
            />
          ) : (
            title
          )}
        </div>
      )}

      {/* Video */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900">
        {videoType === 'hosted' ? (
          <video
            src={videoSrc}
            controls
            className="w-full h-full object-cover"
          />
        ) : (
          <iframe
            src={getEmbedUrl(videoSrc, videoType)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>

      {/* CTA Button */}
      <button 
        className="w-full py-3 px-6 bg-primary text-primary-foreground rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        style={buttonStyle}
      >
        <Play className="w-5 h-5" />
        {canEdit ? (
          <EditableText
            value={buttonText}
            onChange={handleButtonTextChange}
            as="span"
            isPreview={isPreview}
            showToolbar={true}
            richText={true}
            styles={{}}
            onStyleChange={() => {}}
          />
        ) : (
          buttonText
        )}
      </button>
    </div>
  );
}
