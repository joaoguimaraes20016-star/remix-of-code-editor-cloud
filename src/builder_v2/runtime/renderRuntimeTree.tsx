/**
 * renderRuntimeTree - Renders canvas nodes with full interactivity
 * 
 * Unlike renderNode (for editor), this renderer:
 * - Uses RuntimeRegistry with interactive components
 * - No selection highlighting or hover toolbars
 * - Full event handlers for form submission
 * - Optimized for published page performance
 */

import type { CanvasNode } from '../types';
import { RuntimeRegistry, runtimeFallbackComponent } from './runtimeRegistry';

/**
 * Recursively renders a canvas node using runtime components
 */
export function renderRuntimeNode(node: CanvasNode, depth = 0): JSX.Element {
  const children = node.children.map((child) =>
    renderRuntimeNode(child, depth + 1)
  );
  
  const definition = RuntimeRegistry[node.type] ?? runtimeFallbackComponent;
  const safeChildren = definition.constraints.canHaveChildren ? children : [];
  
  const props = {
    ...definition.defaultProps,
    ...node.props,
  };

  return (
    <div
      key={node.id}
      className="runtime-node"
      data-node-id={node.id}
      data-node-type={node.type}
    >
      {definition.render(props, safeChildren)}
    </div>
  );
}

/**
 * Renders the complete canvas tree for runtime (published pages)
 * Entry point for EditorDocumentRenderer
 */
export function renderRuntimeTree(rootNode: CanvasNode): JSX.Element {
  return renderRuntimeNode(rootNode, 0);
}
