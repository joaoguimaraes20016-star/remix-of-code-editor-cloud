/**
 * Phase 15: Public Runtime Renderer
 *
 * A completely editor-agnostic renderer for published document snapshots.
 * This component is designed for public-facing routes and must:
 * - Render PublishedDocumentSnapshot only (no drafts)
 * - Be fully decoupled from editor code (no editor store, inspector, structure tree, etc.)
 * - Match preview output exactly
 * - Have no interactive editor affordances (selection, hover, drag)
 *
 * Allowed imports:
 * - Component registry (pure component definitions)
 * - Canvas render utilities (pure rendering functions)
 * - Document types (type definitions only)
 *
 * Forbidden imports:
 * - editorStore (or any Zustand store)
 * - Inspector components
 * - Structure tree components
 * - Drag/drop logic
 * - Undo/redo logic
 */

import React from 'react';
import type { PublishedDocumentSnapshot } from '../state/documentTypes';

import { renderTree } from '../canvas/renderNode';
import { resolveFunnelLayout } from '../layout/funnelLayout';
import { RuntimeLayout } from './RuntimeLayout';
import { StepBoundary } from './StepBoundary';
import { StepStack } from './StepStack';
import './runtime.css';

// ============================================================================
// ERROR STATES
// ============================================================================

export type RuntimeError =
  | { type: 'not-found'; documentId: string }
  | { type: 'not-published'; documentId: string }
  | { type: 'invalid-snapshot'; documentId: string; reason: string };

/**
 * Props for the RuntimeRenderer component.
 */
export interface RuntimeRendererProps {
  /** The published snapshot to render */
  snapshot: PublishedDocumentSnapshot;
  /** Optional: specific page ID to render (defaults to activePageId in snapshot) */
  pageId?: string;
}

/**
 * Empty state when the published snapshot has no renderable pages.
 */
function EmptySnapshotState({ reason }: { reason?: string }) {
  return (
    <div className="runtime-empty-state">
      <div className="runtime-empty-icon">📄</div>
      <h2 className="runtime-empty-title">No Content Available</h2>
      <p className="runtime-empty-description">
        {reason || 'This page has no content to display.'}
      </p>
    </div>
  );
}

/**
 * Public Runtime Renderer
 *
 * Renders a published document snapshot in read-only mode.
 * This is the public-facing output that matches preview exactly.
 *
 * Features:
 * - Renders active page from snapshot
 * - Falls back to first page if active page not found
 * - No editor affordances or interactivity
 * - Clean, minimal DOM structure
 */
export function RuntimeRenderer({ snapshot, pageId }: RuntimeRendererProps) {
  // Validate snapshot structure
  if (!snapshot) {
    return <EmptySnapshotState reason="Snapshot data is unavailable." />;
  }

  if (!snapshot.pages || snapshot.pages.length === 0) {
    return <EmptySnapshotState reason="This document has no pages to display." />;
  }

  // Determine which page to render
  const targetPageId = pageId ?? snapshot.activePageId;
  const activePage = snapshot.pages.find((page) => page.id === targetPageId);

  // Fallback to first page if target page not found
  const pageToRender = activePage ?? snapshot.pages[0];

  // Page exists but has no canvas root
  if (!pageToRender) {
    return <EmptySnapshotState reason="The requested page could not be found." />;
  }

  if (!pageToRender.canvasRoot) {
    return <EmptySnapshotState reason="This page has no content structure." />;
  }

  // Safely resolve layout with fallback
  let layout;
  try {
    layout = resolveFunnelLayout(pageToRender);
  } catch (error) {
    console.error('[RuntimeRenderer] Layout resolution failed:', error);
    layout = { mode: 'default' as const };
  }

  // Render with error boundary wrapper
  return (
    <RuntimeLayout mode="runtime" layout={layout}>
      <StepStack layout={layout} mode="runtime">
        <StepBoundary motionMode="runtime" stepId={pageToRender.id}>
          <RuntimeErrorBoundary pageId={pageToRender.id}>
            {renderTree(pageToRender.canvasRoot, { readonly: true })}
          </RuntimeErrorBoundary>
        </StepBoundary>
      </StepStack>
    </RuntimeLayout>
  );
}

/**
 * Error boundary for runtime rendering failures.
 * Catches errors in child components and displays a graceful fallback.
 */
class RuntimeErrorBoundary extends React.Component<
  { children: React.ReactNode; pageId: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; pageId: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[RuntimeRenderer] Rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="runtime-render-error">
          <div className="runtime-error-icon">⚠️</div>
          <p className="runtime-error-description">
            This content could not be displayed. Please try refreshing the page.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// ERROR STATE COMPONENTS
// ============================================================================

/**
 * Renders a "Document not found" error state.
 */
export function RuntimeNotFound({ documentId }: { documentId: string }) {
  return (
    <div className="runtime-error-container">
      <div className="runtime-error-state">
        <div className="runtime-error-icon">🔍</div>
        <h1 className="runtime-error-title">Page Not Found</h1>
        <p className="runtime-error-description">
          The requested document could not be found.
        </p>
        <p className="runtime-error-id">Document ID: {documentId}</p>
      </div>
    </div>
  );
}

/**
 * Renders an "Unpublished document" error state.
 */
export function RuntimeNotPublished({ documentId }: { documentId: string }) {
  return (
    <div className="runtime-error-container">
      <div className="runtime-error-state">
        <div className="runtime-error-icon">📝</div>
        <h1 className="runtime-error-title">Not Published</h1>
        <p className="runtime-error-description">
          This document has not been published yet.
        </p>
        <p className="runtime-error-hint">
          The author needs to publish this document before it can be viewed.
        </p>
      </div>
    </div>
  );
}

/**
 * Renders an "Invalid snapshot" error state.
 */
export function RuntimeInvalidSnapshot({
  documentId,
  reason,
}: {
  documentId: string;
  reason?: string;
}) {
  return (
    <div className="runtime-error-container">
      <div className="runtime-error-state">
        <div className="runtime-error-icon">⚠️</div>
        <h1 className="runtime-error-title">Unable to Load</h1>
        <p className="runtime-error-description">
          There was a problem loading this document.
        </p>
        {reason && <p className="runtime-error-reason">{reason}</p>}
      </div>
    </div>
  );
}
