import { cn } from '@/lib/utils';
import { Play } from 'lucide-react';
import type { StepComponentProps } from './types';
import { FONT_SIZE_MAP, DEFAULT_DESIGN } from './types';
import { UnifiedButton, presetToVariant, sizeToVariant } from '@/components/builder/UnifiedButton';
import { useButtonAction, type ButtonAction } from '@/builder_v2/hooks/useButtonAction';

/**
 * A3: Updated to support autoplay parameter
 * Browsers require videos to be muted for autoplay
 */
function getVideoEmbedUrl(url?: string, autoplay = false): string | null {
  if (!url) return null;
  
  const autoplayParam = autoplay ? '1' : '0';
  const muteParam = autoplay ? '&mute=1' : '';
  
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=${autoplayParam}${muteParam}`;
  }
  
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=${autoplayParam}${autoplay ? '&muted=1' : ''}`;
  }
  
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) {
    return `https://www.loom.com/embed/${loomMatch[1]}?autoplay=${autoplayParam}`;
  }
  
  // Existing embed URLs - append autoplay if not present
  if (url.includes('/embed/') || url.includes('player.vimeo.com')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}autoplay=${autoplayParam}`;
  }
  
  return null;
}

export function VideoStep({
  content,
  design,
  isSelected,
  onSelect,
}: StepComponentProps) {
  const d = { ...DEFAULT_DESIGN, ...design, ...content.design };
  const fontSize = d.fontSize || 'medium';
  const sizes = FONT_SIZE_MAP[fontSize];
  
  // A3: Pass autoplay from content
  const embedUrl = getVideoEmbedUrl(content.video_url, content.autoplay ?? false);

  const backgroundStyle = d.useGradient && d.gradientFrom && d.gradientTo
    ? { background: `linear-gradient(${d.gradientDirection || 'to bottom'}, ${d.gradientFrom}, ${d.gradientTo})` }
    : { backgroundColor: d.backgroundColor };

  // A4: Wire button action
  const buttonAction: ButtonAction | undefined = content.buttonAction || (d as any).buttonAction;
  const handleButtonClick = useButtonAction(buttonAction);

  return (
    <div
      className={cn(
        "step-card step-card--video",
        isSelected && "step-card--selected"
      )}
      data-step-type="Video"
      style={{
        ...backgroundStyle,
        color: d.textColor,
      }}
      onClick={onSelect}
    >
      <div className="step-content">
        {content.headline && (
          <h2 className={cn("step-headline", sizes.headline)}>
            {content.headline}
          </h2>
        )}
        <div
          className="step-video-container"
          style={{ borderRadius: `${d.borderRadius}px` }}
        >
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="step-video-iframe"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="step-video-placeholder">
              <Play size={48} strokeWidth={1.5} />
              <span>Add video URL</span>
            </div>
          )}
        </div>
        {content.button_text && (
          <UnifiedButton
            variant={presetToVariant((d as any).buttonPreset)}
            size={sizeToVariant(sizes.button === 'text-sm' ? 'sm' : sizes.button === 'text-lg' ? 'lg' : 'md')}
            backgroundColor={d.buttonColor}
            textColor={d.buttonTextColor}
            borderRadiusPx={d.borderRadius}
            fullWidth={(d as any).buttonFullWidth ?? false}
            className="mt-4"
            onClick={handleButtonClick}
          >
            {content.button_text}
          </UnifiedButton>
        )}
      </div>
    </div>
  );
}
