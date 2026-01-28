/**
 * Funnel Builder v3 - Preview Canvas
 * 
 * Interactive preview mode with screen navigation and form handling.
 * Separate from edit canvas for clean separation of concerns.
 */

import { Funnel, Block, FunnelSettings } from '../types/funnel';
import { usePreviewRuntime } from '../hooks/usePreviewRuntime';
import { DeviceMode } from './Toolbar';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';

// Preview-specific block components
import { PreviewTextBlock } from './preview-blocks/PreviewTextBlock';
import { PreviewHeadingBlock } from './preview-blocks/PreviewHeadingBlock';
import { PreviewImageBlock } from './preview-blocks/PreviewImageBlock';
import { PreviewButtonBlock } from './preview-blocks/PreviewButtonBlock';
import { PreviewInputBlock } from './preview-blocks/PreviewInputBlock';
import { PreviewChoiceBlock } from './preview-blocks/PreviewChoiceBlock';
import { PreviewDividerBlock } from './preview-blocks/PreviewDividerBlock';
import { PreviewSpacerBlock } from './preview-blocks/PreviewSpacerBlock';

interface PreviewCanvasProps {
  funnel: Funnel;
  deviceMode: DeviceMode;
  onExitPreview: () => void;
}

export function PreviewCanvas({ funnel, deviceMode, onExitPreview }: PreviewCanvasProps) {
  const runtime = usePreviewRuntime(funnel);
  const { currentScreen, progress, isFirstScreen } = runtime;

  if (!currentScreen) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[hsl(var(--builder-v3-canvas-bg))]">
        <p className="text-[hsl(var(--builder-v3-text-muted))]">No screens available</p>
      </div>
    );
  }

  // Background styles
  const getBackgroundStyle = () => {
    if (!currentScreen.background) {
      return { backgroundColor: '#ffffff' };
    }

    switch (currentScreen.background.type) {
      case 'solid':
        return { backgroundColor: currentScreen.background.color || '#ffffff' };
      case 'gradient': {
        const { from, to, angle } = currentScreen.background.gradient || { from: '#fff', to: '#f0f0f0', angle: 180 };
        return { background: `linear-gradient(${angle}deg, ${from}, ${to})` };
      }
      case 'image':
        return {
          backgroundImage: `url(${currentScreen.background.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      default:
        return { backgroundColor: '#ffffff' };
    }
  };

  const ScreenContent = () => (
    <div 
      className="builder-v3-device-screen builder-v3-preview-screen"
      style={{
        ...getBackgroundStyle(),
        fontFamily: funnel.settings.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className={cn(
        "builder-v3-device-screen-content",
        deviceMode === 'desktop' && 'pt-0'
      )}>
        {/* Progress Bar */}
        {funnel.settings.showProgress && (
          <div className="builder-v3-progress-bar">
            <div 
              className="builder-v3-progress-fill" 
              style={{ width: `${progress}%`, transition: 'width 300ms ease' }}
            />
          </div>
        )}

        {/* Back button for non-first screens */}
        {!isFirstScreen && (
          <button
            onClick={runtime.goToPreviousScreen}
            className="builder-v3-preview-back-btn"
          >
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
        )}

        {/* Blocks */}
        <div className="p-6 space-y-4">
          {currentScreen.blocks.map((block) => (
            <PreviewBlockRenderer
              key={block.id}
              block={block}
              runtime={runtime}
              settings={funnel.settings}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="builder-v3-canvas-viewport flex-1 flex items-center justify-center p-8 overflow-auto" data-preview="true">
      {/* Desktop Frame */}
      {deviceMode === 'desktop' && (
        <div className="builder-v3-device-frame builder-v3-device-frame--desktop">
          <div className="builder-v3-browser-bar">
            <div className="builder-v3-traffic-lights">
              <span className="builder-v3-traffic-light builder-v3-traffic-light--red" />
              <span className="builder-v3-traffic-light builder-v3-traffic-light--yellow" />
              <span className="builder-v3-traffic-light builder-v3-traffic-light--green" />
            </div>
            <div className="builder-v3-url-bar">yourfunnel.com</div>
          </div>
          <ScreenContent />
        </div>
      )}

      {/* Tablet Frame */}
      {deviceMode === 'tablet' && (
        <div className="builder-v3-device-frame builder-v3-device-frame--tablet">
          <ScreenContent />
          <div className="builder-v3-device-home-bar">
            <div className="builder-v3-home-indicator" />
          </div>
        </div>
      )}

      {/* Mobile Frame */}
      {deviceMode === 'mobile' && (
        <div className="builder-v3-device-frame builder-v3-device-frame--mobile">
          <div className="builder-v3-phone-notch">
            <div className="builder-v3-phone-notch-inner" />
          </div>
          <ScreenContent />
          <div className="builder-v3-device-home-bar">
            <div className="builder-v3-home-indicator" />
          </div>
        </div>
      )}
    </div>
  );
}

// Preview Block Renderer - routes to preview-specific components
interface PreviewBlockRendererProps {
  block: Block;
  runtime: ReturnType<typeof usePreviewRuntime>;
  settings: FunnelSettings;
}

function PreviewBlockRenderer({ block, runtime, settings }: PreviewBlockRendererProps) {
  const commonProps = { block, settings };

  switch (block.type) {
    case 'text':
      return <PreviewTextBlock {...commonProps} />;
    case 'heading':
      return <PreviewHeadingBlock {...commonProps} />;
    case 'image':
      return <PreviewImageBlock {...commonProps} />;
    case 'button':
      return (
        <PreviewButtonBlock
          {...commonProps}
          onAction={() => {
            if (block.props.action) {
              if (block.props.action.type === 'submit') {
                runtime.submitForm();
              } else {
                runtime.executeButtonAction(block.props.action);
              }
            } else {
              runtime.goToNextScreen();
            }
          }}
          isSubmitting={runtime.submissionStatus === 'submitting'}
        />
      );
    case 'input':
      return (
        <PreviewInputBlock
          {...commonProps}
          value={runtime.formData[block.props.fieldKey || block.id] as string || ''}
          onChange={(value) => runtime.updateField(block.props.fieldKey || block.id, value)}
          error={runtime.validationErrors[block.props.fieldKey || block.id]}
        />
      );
    case 'choice':
      return (
        <PreviewChoiceBlock
          {...commonProps}
          selectedIds={runtime.selectedChoices[block.id] || []}
          onSelect={(optionId) => runtime.updateChoice(block.id, optionId, block.props.multiSelect || false)}
        />
      );
    case 'divider':
      return <PreviewDividerBlock {...commonProps} />;
    case 'spacer':
      return <PreviewSpacerBlock {...commonProps} />;
    default:
      return null;
  }
}
