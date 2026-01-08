import type { CSSProperties } from 'react';

import type { EditorState, Page } from '../types';
import type { EditorMode } from '../editorMode';

import './canvas.css';
import '../styles/visual-parity.css';
import { resolveFunnelLayout } from '../layout/funnelLayout';
import { generatePersonalityVariables } from '../layout/personalityResolver';
import { resolvePageIntent, generateIntentVariables } from '../layout/stepIntentResolver';
import { SPACING, INTERACTIVITY_MODE } from '../layout/layoutTokens';
import { renderNode } from './renderNode';

type CanvasEditorProps = {
  page: Page;
  editorState: EditorState;
  mode: EditorMode;
  onSelectNode: (nodeId: string) => void;
  highlightedNodeIds?: string[];
  funnelPosition?: number;
  totalPages?: number;
};

export function CanvasEditor({ 
  page, 
  editorState, 
  onSelectNode, 
  mode,
  highlightedNodeIds = [],
  funnelPosition,
  totalPages,
}: CanvasEditorProps) {
  const isPreview = mode === 'preview';
  const interactivity = isPreview ? INTERACTIVITY_MODE.preview : INTERACTIVITY_MODE.canvas;

  if (!page?.canvasRoot) {
    return (
      <div className="builder-v2-empty-state">
        <div className="builder-v2-empty-icon">📄</div>
        <p className="builder-v2-empty-title">Empty page</p>
        <p className="builder-v2-empty-hint">Add elements from the panel</p>
      </div>
    );
  }

  const layout = resolveFunnelLayout(page);
  const personalityVars = generatePersonalityVariables(layout.personality);
  const resolvedIntent = resolvePageIntent(page, {
    funnelPosition,
    totalPages,
    mode: isPreview ? 'preview' : 'editor',
  });
  const intentVars = generateIntentVariables(resolvedIntent, isPreview ? 'preview' : 'editor');
  
  const layoutVars = {
    '--funnel-section-gap': `${SPACING.SECTION_GAP}px`,
    '--funnel-block-gap': `${SPACING.BLOCK_GAP}px`,
    '--funnel-text-gap': `${SPACING.TEXT_GAP}px`,
    '--funnel-cta-gap': `${SPACING.CTA_GAP}px`,
    '--funnel-step-gap': `${SPACING.SECTION_GAP}px`,
    '--funnel-content-gap': `${SPACING.TEXT_GAP}px`,
    '--funnel-action-gap': `${SPACING.CTA_GAP}px`,
    ...personalityVars,
    ...intentVars,
  } as CSSProperties;
  
  const shouldShowGuides = interactivity.hoverGuides && resolvedIntent.orchestration.showCompositionGuides;

  return (
    <div className="builder-root" data-mode={isPreview ? 'preview' : 'canvas'}>
      <div className="builder-canvas-frame">
        <div 
          className={`builder-page builder-v2-canvas${isPreview ? ' builder-v2-canvas--readonly' : ''}`}
          data-mode={mode}
          data-intent={layout.intent}
          data-step-intent={resolvedIntent.intent}
          data-step-intent-source={resolvedIntent.source}
          data-width={layout.width}
          data-personality={layout.personality.personality}
          style={layoutVars}
        >
          {shouldShowGuides && (
            <div className="builder-v2-canvas-guides" aria-hidden="true">
              <div className="builder-v2-canvas-guide builder-v2-canvas-guide--center" />
              <div
                className="builder-v2-canvas-guide builder-v2-canvas-guide--bounds"
                style={{ '--builder-v2-guide-width': `${layout.maxWidth}px` } as CSSProperties}
              />
            </div>
          )}
          {renderNode(page.canvasRoot, editorState, onSelectNode, { 
            readonly: !interactivity.editable,
            highlightedNodeIds,
          })}
        </div>
      </div>
    </div>
  );
}
