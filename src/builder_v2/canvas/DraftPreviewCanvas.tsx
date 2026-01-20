/**
 * Phase 2: Draft Preview Canvas Component
 *
 * Renders the current draft with runtime interactivity.
 * Unlike PreviewCanvas (which shows published snapshot), this renders
 * the live editor draft with form functionality for testing.
 */

import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { Page, CanvasNode } from '../types';

import { resolveFunnelLayout } from '../layout/funnelLayout';
import { resolvePageIntent, generateIntentVariables } from '../layout/stepIntentResolver';
import { SPACING } from '../layout/layoutTokens';
import { RuntimeLayout } from '../runtime/RuntimeLayout';
import { StepBoundary } from '../runtime/StepBoundary';
import { StepStack } from '../runtime/StepStack';
import './canvas.css';
import '../styles/visual-parity.css';
import { renderRuntimeTree } from '../runtime/renderRuntimeTree';
import { FunnelRuntimeProvider } from '@/flow-canvas/components/runtime/FunnelRuntimeContext';
import { RuntimeProgressBar } from '../runtime/RuntimeProgressBar';
import { useFunnelRuntimeOptional } from '@/flow-canvas/components/runtime/FunnelRuntimeContext';
import { 
  getPageBackgroundStyles, 
  getOverlayStyles,
  getVideoBackgroundUrl,
  isDirectVideoUrl,
  type PageBackground 
} from '@/flow-canvas/components/runtime/backgroundUtils';
import { cn } from '@/lib/utils';

type DraftPreviewCanvasProps = {
  /** Pages from the current draft */
  pages: Page[];
  /** Active page ID */
  activePageId: string;
  /** Funnel ID for runtime (optional - if not provided, form actions are disabled) */
  funnelId?: string;
  /** Team ID for runtime (optional) */
  teamId?: string;
  /** Show progress bar */
  showProgressBar?: boolean;
};

/**
 * Extract required fields from a canvas tree by walking the node structure
 */
function extractRequiredFields(node: CanvasNode): string[] {
  const fields: string[] = [];
  
  // Check if this node is an input with required prop
  const inputTypes = ['email_input', 'phone_input', 'text_input', 'name_input', 'textarea_input', 'consent_checkbox'];
  if (inputTypes.includes(node.type) && node.props?.required) {
    const fieldName = (node.props.fieldName as string) || node.type.replace('_input', '').replace('_checkbox', '');
    fields.push(fieldName);
  }
  
  // Recurse into children
  for (const child of node.children || []) {
    fields.push(...extractRequiredFields(child));
  }
  
  return fields;
}

/**
 * Empty state shown when no pages exist.
 */
function NoPageState() {
  return (
    <div className="builder-v2-preview-empty">
      <div className="builder-v2-preview-empty-icon">📄</div>
      <h3 className="builder-v2-preview-empty-title">No pages in draft</h3>
      <p className="builder-v2-preview-empty-description">
        Add pages to your funnel to see the preview.
      </p>
    </div>
  );
}

/**
 * Helper: Calculate luminance from hex color for dark/light detection
 */
function calcLuminance(color: string | undefined): number | null {
  if (!color || !color.startsWith('#') || color.length < 7) return null;
  const r = parseInt(color.slice(1, 3), 16) / 255;
  const g = parseInt(color.slice(3, 5), 16) / 255;
  const b = parseInt(color.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Inner content that reads from runtime context to render the active page
 */
function DraftPreviewContent({ 
  pages, 
  showProgressBar 
}: { 
  pages: Page[]; 
  showProgressBar?: boolean;
}) {
  const runtimeContext = useFunnelRuntimeOptional();
  const currentStep = runtimeContext?.state?.currentStep || 0;
  
  // Find the page to render based on current step
  const pageToRender = pages[currentStep] || pages[0];
  
  if (!pageToRender?.canvasRoot) {
    return <NoPageState />;
  }

  // Resolve background/theme tokens with the same priority chain as EditorDocumentRenderer:
  // 1) page.canvasRoot.props.background (builder_v2)
  // 2) page.settings.page_background (legacy)
  const pageAny = pageToRender as any;

  const pageBackground = useMemo(() => {
    if (pageAny?.canvasRoot?.props?.background) {
      return pageAny.canvasRoot.props.background as PageBackground;
    }
    if (pageAny?.settings?.page_background) {
      return pageAny.settings.page_background as PageBackground;
    }
    return undefined;
  }, [pageAny]);

  const pageTheme = (pageAny?.canvasRoot?.props?.theme ?? pageAny?.settings?.theme) as
    | 'light'
    | 'dark'
    | undefined;

  const fontFamily =
    (pageAny?.canvasRoot?.props?.font_family ?? pageAny?.settings?.font_family) ||
    'Inter, system-ui, sans-serif';

  const primaryColor =
    (pageAny?.canvasRoot?.props?.primary_color ?? pageAny?.settings?.primary_color) ||
    '#8B5CF6';

  // Compute isDarkTheme based on background luminance (matching FlowCanvasRenderer)
  const isDarkTheme = useMemo(() => {
    const bgSource = pageBackground;

    if (bgSource?.type === 'solid' && bgSource.color) {
      const lum = calcLuminance(bgSource.color);
      if (lum !== null) return lum < 0.5;
    }
    if (bgSource?.type === 'gradient' && bgSource.gradient?.stops?.length && bgSource.gradient.stops.length >= 2) {
      const luminances = bgSource.gradient.stops
        .map((s: { color: string }) => calcLuminance(s.color))
        .filter((l: number | null): l is number => l !== null);
      if (luminances.length > 0) {
        const avgLuminance = luminances.reduce((a: number, b: number) => a + b, 0) / luminances.length;
        return avgLuminance < 0.5;
      }
    }

    // Fall back to theme setting
    if (pageTheme === 'dark') return true;
    if (pageTheme === 'light') return false;
    return false;
  }, [pageBackground, pageTheme]);

  // Generate background styles using shared utility (exact parity with runtime)
  const backgroundStyles = useMemo(() => getPageBackgroundStyles(pageBackground, isDarkTheme), [pageBackground, isDarkTheme]);

  // Overlay styles for backgrounds
  const overlayStyles = useMemo(() => getOverlayStyles(pageBackground), [pageBackground]);

  // Video background handling
  const videoBackgroundUrl = useMemo(
    () => (pageBackground?.type === 'video' ? getVideoBackgroundUrl(pageBackground.video) : null),
    [pageBackground]
  );
  const isDirectVideo = videoBackgroundUrl ? isDirectVideoUrl(videoBackgroundUrl) : false;

  const layout = resolveFunnelLayout(pageToRender);
  const resolvedIntent = resolvePageIntent(pageToRender, {
    funnelPosition: currentStep,
    totalPages: pages.length,
    mode: 'preview',
  });
  const intentVars = generateIntentVariables(resolvedIntent, 'preview');

  const lockedSpacingVars = {
    '--funnel-section-gap': `${SPACING.SECTION_GAP}px`,
    '--funnel-block-gap': `${SPACING.BLOCK_GAP}px`,
    '--funnel-text-gap': `${SPACING.TEXT_GAP}px`,
    '--funnel-cta-gap': `${SPACING.CTA_GAP}px`,
    '--funnel-step-gap': `${SPACING.SECTION_GAP}px`,
    '--funnel-content-gap': `${SPACING.TEXT_GAP}px`,
    '--funnel-action-gap': `${SPACING.CTA_GAP}px`,
    '--primary-color': primaryColor,
    ...intentVars,
  } as CSSProperties;

  return (
    <div 
      className={cn(
        "flowcanvas-runtime min-h-screen relative overflow-x-hidden builder-v2-canvas--preview",
        isDarkTheme && 'dark'
      )}
      data-step-intent={resolvedIntent.intent}
      data-step-intent-source={resolvedIntent.source}
      style={{ 
        fontFamily,
        ...backgroundStyles,
        ...lockedSpacingVars,
      }}
    >
      {/* Video background - FULL BLEED */}
      {videoBackgroundUrl && (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          {isDirectVideo ? (
            <video
              src={videoBackgroundUrl}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <iframe
              src={videoBackgroundUrl}
              className="absolute inset-0 w-full h-full scale-150"
              allow="autoplay; fullscreen"
              frameBorder={0}
            />
          )}
        </div>
      )}
      
      {/* Background overlay - FULL BLEED */}
      {overlayStyles && (
        <div className="fixed inset-0 z-[1] pointer-events-none" style={overlayStyles} />
      )}
      
      {/* Preview mode indicator */}
      <div className="fixed top-4 right-4 z-50 builder-v2-preview-header">
        <span className="builder-v2-preview-badge">Preview Mode</span>
      </div>
      
      {/* Progress bar */}
      {showProgressBar && (
        <div className="relative z-10">
          <RuntimeProgressBar />
        </div>
      )}
      
      {/* Content - centered with z-index above background */}
      <div className="relative z-10 min-h-screen">
        <RuntimeLayout 
          mode="preview" 
          layout={layout}
          page={pageToRender}
          funnelPosition={currentStep}
          totalPages={pages.length}
        >
          <StepStack layout={layout} mode="preview">
            <StepBoundary motionMode="preview" stepId={pageToRender.id}>
              {renderRuntimeTree(pageToRender.canvasRoot)}
            </StepBoundary>
          </StepStack>
        </RuntimeLayout>
      </div>
    </div>
  );
}

/**
 * Draft preview canvas that renders the current editor draft with runtime interactivity.
 * This is used when mode === 'preview' but we want to test the draft instead of published.
 */
export function DraftPreviewCanvas({ 
  pages, 
  activePageId,
  funnelId,
  teamId,
  showProgressBar = false,
}: DraftPreviewCanvasProps) {
  // No pages - show empty state
  if (pages.length === 0) {
    return <NoPageState />;
  }

  // Extract required fields from all pages
  const requiredFields = pages.flatMap(page => 
    page.canvasRoot ? extractRequiredFields(page.canvasRoot) : []
  );

  // Create runtime config for draft preview
  const runtimeConfig = {
    funnelId: funnelId || 'draft-preview',
    teamId: teamId || 'draft-preview',
    funnelSlug: 'draft',
    pages: pages.map(p => ({ id: p.id, type: p.type })),
    requiredFields,
  };

  return (
    <FunnelRuntimeProvider 
      config={runtimeConfig}
      totalSteps={pages.length}
    >
      <DraftPreviewContent 
        pages={pages} 
        showProgressBar={showProgressBar} 
      />
    </FunnelRuntimeProvider>
  );
}