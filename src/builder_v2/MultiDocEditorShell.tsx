/**
 * Phase 13 & 14: Multi-Document Editor Shell
 *
 * This is the updated editor shell that supports multi-document workflows.
 * It wraps the existing editor components with the multi-document provider
 * and adds the document switcher UI.
 *
 * Phase 14 adds:
 * - True preview mode that renders published snapshot only
 * - Preview restrictions (no structure tree, no inspector, read-only canvas)
 * - Publish/Unpublish UI controls
 *
 * This preserves all existing editor behavior (canvas, inspector, structure tree)
 * while adding document-level management on top.
 */

import { useEffect, useCallback } from 'react';

import './EditorLayout.css';
import { CanvasEditor } from './canvas/CanvasEditor';
import { PreviewCanvas } from './canvas/PreviewCanvas';
import { DraftPreviewCanvas } from './canvas/DraftPreviewCanvas';
import { DocumentSwitcher } from './components/DocumentSwitcher';
import { editorModes, type EditorMode } from './editorMode';
import { Inspector } from './inspector/Inspector';
import { EditorStoreAdapter } from './state/editorStoreAdapter';
import { MultiDocumentProvider, useMultiDocumentStore } from './state/multiDocStore';
import { StructureTree } from './structure/StructureTree';
import { useKeyboardShortcuts } from './state/useKeyboardShortcuts';

/** F14: Humanized mode display labels */
const modeDisplayLabels: Record<EditorMode, string> = {
  structure: 'Structure',
  canvas: 'Edit',
  preview: 'Test',
};

/**
 * Main editor shell with multi-document support.
 * Use this instead of EditorShell for multi-document workflows.
 */
export function MultiDocEditorShell() {
  return (
    <MultiDocumentProvider>
      <EditorStoreAdapter>
        <MultiDocEditorShellContent />
      </EditorStoreAdapter>
    </MultiDocumentProvider>
  );
}

function MultiDocEditorShellContent() {
  const {
    pages,
    activePageId,
    mode,
    editorState,
    setMode,
    setActivePage,
    selectNode,
    deleteNode,
    dispatch,
    undo,
    redo,
    canUndo,
    canRedo,
    currentDocument,
    // Phase 14: Published state
    publishedSnapshot,
    isPublished,
    publishDocument,
    unpublishDocument,
    // Phase 26: Highlighted nodes for suggestion feedback
    highlightedNodeIds,
  } = useMultiDocumentStore();

  const activePage = pages.find((page) => page.id === activePageId) ?? null;
  
  // Phase 14: Determine if we're in preview mode
  const isPreviewMode = mode === 'preview';
  
  // Phase 4: Keyboard shortcuts for Delete, Cmd+D, Escape
  useKeyboardShortcuts({
    selectedNodeId: editorState.selectedNodeId,
    activePageId,
    pages,
    deleteNode,
    selectNode,
    dispatch,
    enabled: !isPreviewMode,
  });

  // Prevent body scroll when editor is mounted
  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isModifierPressed = event.metaKey || event.ctrlKey;
      const isZKey = event.key.toLowerCase() === 'z';

      if (!isModifierPressed || !isZKey) {
        return;
      }

      if (event.shiftKey) {
        event.preventDefault();
        if (canRedo) {
          redo();
        }
        return;
      }

      event.preventDefault();

      if (canUndo) {
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canRedo, canUndo, redo, undo]);

  return (
    <div className="builder-v2-shell">
      <section className="builder-v2-panel builder-v2-panel--left">
        <header className="builder-v2-panel-header">
          Structure
          <span style={{ 
            marginLeft: 'auto', 
            fontSize: '11px', 
            opacity: 0.6,
            fontWeight: 400,
          }}>
            {currentDocument.name}
          </span>
        </header>
        <div className="builder-v2-panel-scroll">
          {/* Document Switcher */}
          <DocumentSwitcher />
          
          {/* Mode Toggle - D11: Styled mode buttons with humanized labels */}
          <div className="builder-v2-mode-toggle">
            {editorModes.map((nextMode) => (
              <button
                key={nextMode}
                type="button"
                className="builder-v2-mode-toggle-btn"
                aria-pressed={mode === nextMode}
                onClick={() => setMode(nextMode)}
              >
                {modeDisplayLabels[nextMode]}
              </button>
            ))}
          </div>
          
          {/* Page List & Structure Tree */}
          <div
            className={`builder-v2-placeholder${
              mode === 'structure' ? '' : ' builder-v2-hidden'
            }`}
          >
            {pages.length === 0 ? (
              <p>No pages available.</p>
            ) : (
              <div>
                {/* F15: Unified "Steps" terminology */}
                <div className="builder-v2-panel-section-header">Steps</div>
                {pages.map((page) => {
                  const isActive = page.id === activePageId;

                  return (
                    <button
                      key={page.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActivePage(page.id)}
                      className={`builder-v2-page-button ${isActive ? 'builder-v2-page-button--active' : ''}`}
                    >
                      <div className="builder-v2-page-button-title">{page.name}</div>
                      <div className="builder-v2-page-button-meta">Type: {page.type}</div>
                    </button>
                  );
                })}
                <div style={{ marginTop: 12 }}>
                  {activePage ? (
                    <StructureTree />
                  ) : (
                    <p className="builder-v2-placeholder">No active page.</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <div
            className={`builder-v2-placeholder${
              mode === 'structure' ? ' builder-v2-hidden' : ''
            }`}
          >
            {/* Phase 14: Show publish controls when not in structure mode */}
            {!isPreviewMode && (
              <div className="builder-v2-publish-status">
                <span className="builder-v2-publish-status-text">
                  {isPublished ? '✓ Published' : 'Not published'}
                </span>
              </div>
            )}
            {isPreviewMode && (
              <p className="builder-v2-placeholder-text">
                Test mode - Structure tree disabled
              </p>
            )}
            {mode === 'canvas' && (
              <p>Structure list is hidden in canvas mode.</p>
            )}
          </div>
        </div>
      </section>

      <section className="builder-v2-panel builder-v2-panel--center">
        <header className="builder-v2-panel-header">
          {/* A1: Clarify that "Test" mode renders draft, not published */}
          {isPreviewMode ? 'Test Draft' : 'Canvas'}
          {/* Phase 14: Publish button in header - C9: using CSS classes instead of inline styles */}
          {!isPreviewMode && (
            <div className="builder-v2-header-actions">
              {isPublished ? (
                <>
                  <button
                    type="button"
                    onClick={publishDocument}
                    className="builder-v2-header-button"
                  >
                    Re-publish
                  </button>
                  <button
                    type="button"
                    onClick={unpublishDocument}
                    className="builder-v2-header-button builder-v2-header-button--danger"
                  >
                    Unpublish
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={publishDocument}
                  className="builder-v2-header-button builder-v2-header-button--primary"
                >
                  Publish
                </button>
              )}
            </div>
          )}
        </header>
        <div className="builder-v2-panel-scroll">
          {/* Canvas mode - editable draft */}
          <div className={mode === 'canvas' ? '' : 'builder-v2-hidden'}>
            {activePage ? (
              <CanvasEditor
                page={activePage}
                editorState={editorState}
                mode={mode}
                onSelectNode={(nodeId) => selectNode(nodeId)}
                highlightedNodeIds={highlightedNodeIds}
              />
            ) : (
              <div className="builder-v2-placeholder">No active page.</div>
            )}
          </div>
          
          {/* Phase 14 + Phase 2: Preview mode - now renders draft with runtime interactivity */}
          <div className={isPreviewMode ? '' : 'builder-v2-hidden'}>
            <DraftPreviewCanvas 
              pages={pages} 
              activePageId={activePageId}
              funnelId={currentDocument.id}
              teamId="preview"
              showProgressBar={pages.length > 1}
            />
          </div>
          
          {/* Structure mode - canvas hidden */}
          <div
            className={`builder-v2-placeholder${
              mode === 'structure' ? '' : ' builder-v2-hidden'
            }`}
          >
            <p>Canvas is hidden in structure mode.</p>
          </div>
        </div>
      </section>

      <section className="builder-v2-panel builder-v2-panel--right">
        <header className="builder-v2-panel-header">
          Inspector
          {isPreviewMode && (
            <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.5 }}>
              (disabled)
            </span>
          )}
        </header>
        <div className="builder-v2-panel-scroll">
          {/* Phase 14: Inspector hidden in preview mode */}
          {isPreviewMode ? (
            <div className="builder-v2-placeholder" style={{ textAlign: 'center', padding: 24 }}>
              <p style={{ opacity: 0.6 }}>Inspector is disabled in preview mode.</p>
              <p style={{ fontSize: 12, opacity: 0.4, marginTop: 8 }}>
                Switch to Structure or Canvas mode to edit.
              </p>
            </div>
          ) : activePage ? (
            <Inspector />
          ) : (
            <p className="builder-v2-inspector-empty">No active page.</p>
          )}
        </div>
      </section>
    </div>
  );
}

/** G18: Removed inline styles - now using CSS classes in EditorLayout.css */
