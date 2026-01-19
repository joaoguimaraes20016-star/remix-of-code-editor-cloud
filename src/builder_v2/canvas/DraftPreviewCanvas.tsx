/**
 * Phase 2: Draft Preview Canvas Component
 *
 * Renders the current draft with runtime interactivity.
 * Unlike PreviewCanvas (which shows published snapshot), this renders
 * the live editor draft with form functionality for testing.
 */

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
    ...intentVars,
  } as CSSProperties;

  return (
    <div 
      className="builder-page builder-v2-canvas builder-v2-canvas--preview"
      data-step-intent={resolvedIntent.intent}
      data-step-intent-source={resolvedIntent.source}
      style={lockedSpacingVars}
    >
      <div className="builder-v2-preview-header">
        <span className="builder-v2-preview-badge">Draft Preview</span>
        <span className="builder-v2-preview-timestamp">
          Step {currentStep + 1} of {pages.length}
        </span>
      </div>
      {showProgressBar && <RuntimeProgressBar />}
      <div className="builder-v2-preview-content">
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
    <div className="builder-root" data-mode="draft-preview">
      <div className="builder-canvas-frame">
        <FunnelRuntimeProvider 
          config={runtimeConfig}
          totalSteps={pages.length}
        >
          <DraftPreviewContent 
            pages={pages} 
            showProgressBar={showProgressBar} 
          />
        </FunnelRuntimeProvider>
      </div>
    </div>
  );
}