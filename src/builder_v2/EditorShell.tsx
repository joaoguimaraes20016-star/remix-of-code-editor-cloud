import { useEffect, useState } from 'react';

import './EditorLayout.css';
import { CanvasEditor } from './canvas/CanvasEditor';
import { Inspector } from './inspector/Inspector';
import { EditorProvider, useEditorStore } from './state/editorStore';
import { StructureTree } from './structure/StructureTree';

type LeftPanelTab = 'pages' | 'layers';

export function EditorShell() {
  return (
    <EditorProvider>
      <EditorShellContent />
    </EditorProvider>
  );
}

function EditorShellContent() {
  const {
    pages,
    activePageId,
    editorState,
    setActivePage,
    selectNode,
    undo,
    redo,
    canUndo,
    canRedo,
    highlightedNodeIds,
  } = useEditorStore();

  const [leftTab, setLeftTab] = useState<LeftPanelTab>('pages');
  const activePage = pages.find((page) => page.id === activePageId) ?? null;

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isModifierPressed = event.metaKey || event.ctrlKey;
      const isZKey = event.key.toLowerCase() === 'z';

      if (!isModifierPressed || !isZKey) return;

      if (event.shiftKey) {
        event.preventDefault();
        if (canRedo) redo();
        return;
      }

      event.preventDefault();
      if (canUndo) undo();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canRedo, canUndo, redo, undo]);

  return (
    <div className="builder-shell">
      {/* Left Panel - Pages/Layers */}
      <aside className="builder-panel builder-panel--left">
        <div className="builder-panel-tabs">
          <button
            type="button"
            className={`builder-tab${leftTab === 'pages' ? ' builder-tab--active' : ''}`}
            onClick={() => setLeftTab('pages')}
          >
            Pages
          </button>
          <button
            type="button"
            className={`builder-tab${leftTab === 'layers' ? ' builder-tab--active' : ''}`}
            onClick={() => setLeftTab('layers')}
          >
            Layers
          </button>
        </div>

        <div className="builder-panel-content">
          {leftTab === 'pages' && (
            <div className="builder-pages-list">
              {pages.map((page) => {
                const isActive = page.id === activePageId;
                return (
                  <button
                    key={page.id}
                    type="button"
                    className={`builder-page-item${isActive ? ' builder-page-item--active' : ''}`}
                    onClick={() => setActivePage(page.id)}
                  >
                    <span className="builder-page-icon">📄</span>
                    <span className="builder-page-name">{page.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {leftTab === 'layers' && activePage && (
            <StructureTree />
          )}

          {leftTab === 'layers' && !activePage && (
            <p className="builder-empty-state">No page selected</p>
          )}
        </div>
      </aside>

      {/* Center - Canvas */}
      <main className="builder-canvas-area">
        {activePage ? (
          <CanvasEditor
            page={activePage}
            editorState={editorState}
            mode="canvas"
            onSelectNode={(nodeId) => selectNode(nodeId)}
            highlightedNodeIds={highlightedNodeIds}
          />
        ) : (
          <div className="builder-empty-state">
            Select a page to start editing
          </div>
        )}
      </main>

      {/* Right Panel - Inspector */}
      <aside className="builder-panel builder-panel--right">
        <Inspector />
      </aside>
    </div>
  );
}
