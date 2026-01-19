/**
 * Keyboard Shortcuts Hook for Builder V2
 * 
 * Provides keyboard shortcuts for common editor actions:
 * - Delete/Backspace: Delete selected node
 * - Cmd+D: Duplicate selected node
 * - Escape: Deselect node
 */

import { useEffect, useCallback } from 'react';
import type { CanvasNode, Page } from '../types';

let duplicateIdCounter = 0;

/**
 * Generate unique IDs for duplicated nodes
 */
function generateDuplicateId(type: string): string {
  duplicateIdCounter += 1;
  return `${type}-dup-${duplicateIdCounter}-${Date.now().toString(36)}`;
}

/**
 * Deep clone a node tree with new IDs
 */
function cloneNodeWithNewIds(node: CanvasNode): CanvasNode {
  return {
    ...node,
    id: generateDuplicateId(node.type),
    props: { ...node.props },
    children: node.children.map(cloneNodeWithNewIds),
  };
}

/**
 * Find a node by ID in the tree
 */
function findNodeById(root: CanvasNode, nodeId: string): CanvasNode | null {
  if (root.id === nodeId) return root;
  for (const child of root.children) {
    const found = findNodeById(child, nodeId);
    if (found) return found;
  }
  return null;
}

/**
 * Find the parent of a node in the tree
 */
function findParentNode(root: CanvasNode, targetId: string): CanvasNode | null {
  for (const child of root.children) {
    if (child.id === targetId) {
      return root;
    }
    const found = findParentNode(child, targetId);
    if (found) return found;
  }
  return null;
}

interface UseKeyboardShortcutsOptions {
  selectedNodeId: string | null;
  activePageId: string;
  pages: Page[];
  deleteNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  dispatch: (action: any) => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  selectedNodeId,
  activePageId,
  pages,
  deleteNode,
  selectNode,
  dispatch,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Don't trigger if typing in an input, textarea, or contenteditable
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    const isModifierPressed = event.metaKey || event.ctrlKey;
    const activePage = pages.find(p => p.id === activePageId);

    // Delete/Backspace - Delete selected node
    if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNodeId) {
      event.preventDefault();
      
      // Don't delete the root node
      if (activePage && selectedNodeId !== activePage.canvasRoot.id) {
        deleteNode(selectedNodeId);
      }
      return;
    }

    // Escape - Deselect
    if (event.key === 'Escape' && selectedNodeId) {
      event.preventDefault();
      selectNode(null);
      return;
    }

    // Cmd+D - Duplicate selected node
    if (isModifierPressed && event.key.toLowerCase() === 'd' && selectedNodeId) {
      event.preventDefault();
      
      if (!activePage) return;
      
      // Find the selected node and its parent
      const selectedNode = findNodeById(activePage.canvasRoot, selectedNodeId);
      const parentNode = findParentNode(activePage.canvasRoot, selectedNodeId);
      
      if (selectedNode && parentNode) {
        // Clone the node with new IDs
        const clonedNode = cloneNodeWithNewIds(selectedNode);
        
        // Dispatch ADD_NODE action
        dispatch({ 
          type: 'ADD_NODE', 
          parentId: parentNode.id, 
          node: clonedNode 
        });
      }
      return;
    }
  }, [enabled, selectedNodeId, activePageId, pages, deleteNode, selectNode, dispatch]);

  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}