/**
 * EditorDocumentRenderer - WYSIWYG Runtime Renderer
 * 
 * Renders EditorDocument snapshots exactly as they appear in the editor.
 * This is the "publish what you see" renderer - no lossy conversions.
 * 
 * Used for:
 * - Public funnel pages (published funnels)
 * - Preview mode in editor
 * - Custom domain rendering
 */

import { useMemo } from 'react';
import { renderRuntimeTree } from '@/builder_v2/runtime/renderRuntimeTree';
import type { Page } from '@/builder_v2/types';
import { resolveFunnelLayout } from '@/builder_v2/layout/funnelLayout';
import { RuntimeLayout } from '@/builder_v2/runtime/RuntimeLayout';
import { StepBoundary } from '@/builder_v2/runtime/StepBoundary';
import { StepStack } from '@/builder_v2/runtime/StepStack';
import {
  getPageBackgroundStyles,
  getOverlayStyles,
  getVideoBackgroundUrl,
  isDirectVideoUrl,
  type PageBackground,
} from './backgroundUtils';
import { FunnelRuntimeProvider, useFunnelRuntimeOptional } from './FunnelRuntimeContext';
import { RuntimeSuccessOverlay } from '@/builder_v2/runtime/RuntimeSuccessOverlay';

// Import runtime-specific styles ONLY (no editor CSS to avoid card frames/hover states)
import './runtime.css';

interface EditorDocument {
  version: number;
  pages: Page[];
  activePageId?: string;
  /** Document-level settings (background, theme, fonts) - included in published snapshots */
  settings?: {
    page_background?: PageBackground;
    theme?: string;
    font_family?: string;
    primary_color?: string;
    [key: string]: unknown;
  };
}

interface FunnelSettings {
  logo_url?: string;
  primary_color?: string;
  background_color?: string;
  button_text?: string;
  ghl_webhook_url?: string;
  privacy_policy_url?: string;
  show_progress_bar?: boolean;
}

interface EditorDocumentRendererProps {
  /** The published EditorDocument snapshot */
  document: EditorDocument;
  /** Optional page ID to render (defaults to first page) */
  pageId?: string;
  /** Funnel settings for theming */
  settings?: FunnelSettings;
  /** Funnel ID for analytics and submission */
  funnelId?: string;
  /** Team ID for lead submission */
  teamId?: string;
  /** Funnel slug for analytics */
  funnelSlug?: string;
  /** Webhook URLs for submission notification */
  webhookUrls?: string[];
  /** Redirect URL after submission */
  redirectUrl?: string;
}

/**
 * Page wrapper that handles background, overlay, and video backgrounds
 *
 * Phase 38 parity: uses the canonical viewport frame structure
 * (.builder-root -> .builder-canvas-frame -> .builder-page)
 * so runtime matches editor/preview.
 */
function PageFrame({
  page,
  documentSettings,
  children,
}: {
  page: Page;
  /** Document-level settings from published snapshot (source of truth for background/theme) */
  documentSettings?: EditorDocument['settings'];
  children: React.ReactNode;
}) {
  // Extract background with priority: document settings > page canvasRoot > legacy page.settings
  const pageBackground = useMemo(() => {
    // Priority 1: Document-level settings from published snapshot (set by FunnelEditor publish)
    if (documentSettings?.page_background) {
      return documentSettings.page_background as PageBackground;
    }
    // Priority 2: new builder_v2 format (canvasRoot props)
    if (page.canvasRoot?.props?.background) {
      return page.canvasRoot.props.background as PageBackground;
    }
    // Priority 3: legacy FlowCanvas format (stored in page.settings)
    const pageWithSettings = page as Page & { settings?: Record<string, unknown> };
    if (pageWithSettings.settings?.page_background) {
      return pageWithSettings.settings.page_background as PageBackground;
    }
    return undefined;
  }, [page, documentSettings]);

  const backgroundStyles = useMemo(() => {
    return getPageBackgroundStyles(pageBackground, true);
  }, [pageBackground]);

  const overlayStyles = useMemo(() => {
    return getOverlayStyles(pageBackground);
  }, [pageBackground]);

  // Handle video backgrounds
  const videoUrl = pageBackground?.type === 'video' ? pageBackground.video : null;
  const embedUrl = getVideoBackgroundUrl(videoUrl);
  const isDirectVideo = isDirectVideoUrl(videoUrl);

  return (
    <div className="builder-root" data-mode="runtime" data-page-id={page.id} data-page-type={page.type}>
      <div className="builder-canvas-frame">
        <div className="builder-page relative min-h-screen w-full overflow-hidden" style={backgroundStyles}>
          {/* Video Background */}
          {embedUrl && (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              {isDirectVideo ? (
                <video
                  src={embedUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <iframe
                  src={embedUrl}
                  allow="autoplay; fullscreen"
                  className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 border-0 pointer-events-none"
                  style={{ minWidth: '200%', minHeight: '200%' }}
                />
              )}
            </div>
          )}

          {/* Overlay */}
          {overlayStyles && (
            <div className="absolute inset-0 z-[1] pointer-events-none" style={overlayStyles} />
          )}

          {/* Content */}
          <div className="relative z-[2] min-h-screen">{children}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the canvas node tree using the runtime registry, wrapped in the
 * same layout stack used by the editor preview (RuntimeLayout + StepStack).
 */
function CanvasContent({
  page,
  pageIndex,
  totalPages,
}: {
  page: Page;
  pageIndex: number;
  totalPages: number;
}) {
  const layout = useMemo(() => {
    try {
      return resolveFunnelLayout(page);
    } catch (e) {
      console.error('[EditorDocumentRenderer] resolveFunnelLayout failed', e);
      return null;
    }
  }, [page]);

  if (!page.canvasRoot) return null;

  // IMPORTANT: use mode="preview" so RuntimeLayout does not paint its own background.
  // The page background comes from the published snapshot (PageFrame).
  if (!layout) {
    return <div className="builder-v2-runtime">{renderRuntimeTree(page.canvasRoot)}</div>;
  }

  return (
    <RuntimeLayout
      mode="preview"
      layout={layout}
      page={page}
      funnelPosition={pageIndex}
      totalPages={totalPages}
    >
      <StepStack layout={layout} mode="preview">
        <StepBoundary motionMode="preview" stepId={page.id}>
          <div className="builder-v2-runtime">{renderRuntimeTree(page.canvasRoot)}</div>
        </StepBoundary>
      </StepStack>
    </RuntimeLayout>
  );
}

/**
 * Wrapper component that renders the correct page based on currentStep
 * and shows success overlay when form is complete
 */
function RuntimePageRouter({ 
  document, 
  redirectUrl 
}: { 
  document: EditorDocument; 
  redirectUrl?: string;
}) {
  const runtimeContext = useFunnelRuntimeOptional();
  const currentStep = runtimeContext?.state?.currentStep || 0;
  const isComplete = runtimeContext?.state?.isComplete;

  // Show success overlay if form is complete and no redirect URL
  if (isComplete && !redirectUrl) {
    return <RuntimeSuccessOverlay />;
  }

  // Get the page for the current step
  const activePage = document.pages[currentStep] || document.pages[0];
  
  if (!activePage?.canvasRoot) {
    return null;
  }

  return (
    <PageFrame page={activePage} documentSettings={document.settings}>
      <CanvasContent page={activePage} pageIndex={currentStep} totalPages={document.pages.length} />
    </PageFrame>
  );
}

/**
 * Main runtime renderer for EditorDocument format
 */
export function EditorDocumentRenderer({
  document,
  pageId,
  settings,
  funnelId,
  teamId,
  funnelSlug,
  webhookUrls,
  redirectUrl,
}: EditorDocumentRendererProps) {
  // Find the page to render
  const activePage = useMemo(() => {
    if (!document?.pages?.length) return null;

    // Try to find the requested page, fall back to activePageId, then first page
    if (pageId) {
      const found = document.pages.find((p) => p.id === pageId);
      if (found) return found;
    }

    if (document.activePageId) {
      const found = document.pages.find((p) => p.id === document.activePageId);
      if (found) return found;
    }

    return document.pages[0];
  }, [document, pageId]);

  // No page to render
  if (!activePage || !activePage.canvasRoot) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white/60">
          <p>No content to display</p>
        </div>
      </div>
    );
  }

  // Build runtime config - only enable if we have the required IDs
  const hasRuntimeConfig = funnelId && teamId;
  const runtimeConfig = hasRuntimeConfig ? {
    funnelId: funnelId!,
    teamId: teamId!,
    funnelSlug: funnelSlug || '',
    webhookUrls: webhookUrls || (settings?.ghl_webhook_url ? [settings.ghl_webhook_url] : []),
    redirectUrl: redirectUrl,
    // Pass page info for multi-page navigation
    pages: document.pages.map(p => ({ id: p.id, type: p.type })),
  } : null;

  // Wrap with FunnelRuntimeProvider if we have config (enables form submission)
  if (runtimeConfig) {
    return (
      <FunnelRuntimeProvider 
        config={runtimeConfig} 
        totalSteps={document.pages.length}
      >
        <main
          className="min-h-screen w-full"
          data-funnel-id={funnelId}
          data-version={document.version}
          data-runtime-renderer="editor-document"
        >
          <RuntimePageRouter document={document} redirectUrl={redirectUrl} />
        </main>
      </FunnelRuntimeProvider>
    );
  }

  // Preview mode without runtime (no submission capability)
  const content = (
    <main
      className="min-h-screen w-full"
      data-funnel-id={funnelId}
      data-version={document.version}
      data-runtime-renderer="editor-document"
    >
      <PageFrame page={activePage} documentSettings={document.settings}>
        <CanvasContent page={activePage} pageIndex={0} totalPages={document.pages.length} />
      </PageFrame>
    </main>
  );
  return content;
}

/**
 * Multi-page scrollable renderer (for future use)
 * Renders all pages as a single scrollable document
 */
export function EditorDocumentScrollRenderer({
  document,
  settings,
  funnelId,
}: Omit<EditorDocumentRendererProps, 'pageId'>) {
  if (!document?.pages?.length) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white/60">
          <p>No content to display</p>
        </div>
      </div>
    );
  }

  return (
    <main
      className="w-full"
      data-funnel-id={funnelId}
      data-version={document.version}
    >
      {document.pages.map((page, idx) => (
        <PageFrame key={page.id} page={page} documentSettings={document.settings}>
          <CanvasContent page={page} pageIndex={idx} totalPages={document.pages.length} />
        </PageFrame>
      ))}
    </main>
  );
}

export default EditorDocumentRenderer;
