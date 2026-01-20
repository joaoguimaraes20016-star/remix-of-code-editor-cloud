/**
 * renderRuntimeTree - Renders canvas nodes with full interactivity
 * 
 * Unlike renderNode (for editor), this renderer:
 * - Uses RuntimeRegistry with interactive components
 * - No selection highlighting or hover toolbars
 * - Full event handlers for form submission
 * - Optimized for published page performance
 * - Includes defensive error handling for production stability
 */

import type { CanvasNode } from '../types';
import { RuntimeRegistry, runtimeFallbackComponent } from './runtimeRegistry';

/**
 * Recursively renders a canvas node using runtime components
 * Includes try-catch for graceful degradation on production
 */
export function renderRuntimeNode(node: CanvasNode, depth = 0, path = '0'): JSX.Element {
  // Use a deterministic, traversal-based key to prevent React reconciliation bugs
  // when snapshots contain duplicated node IDs (can happen with imported/legacy data).
  const reactKey = `${node.id}::${path}`;

  try {
    const children = node.children.map((child, index) =>
      renderRuntimeNode(child, depth + 1, `${path}.${index}`)
    );

    const definition = RuntimeRegistry[node.type] ?? runtimeFallbackComponent;

    // Guard: Ensure definition.render is a valid function
    if (!definition || typeof definition.render !== 'function') {
      console.error(`[RuntimeRegistry] Invalid render function for type: ${node.type}`, {
        nodeId: node.id,
        reactKey,
        definitionExists: !!definition,
        renderType: definition ? typeof definition.render : 'undefined',
      });
      return (
        <div
          key={reactKey}
          className="runtime-node runtime-node--error"
          data-node-id={node.id}
          data-node-type={node.type}
        >
          <div className="runtime-fallback">{children}</div>
        </div>
      );
    }

    const safeChildren = definition.constraints?.canHaveChildren ? children : [];

    const props = {
      ...definition.defaultProps,
      ...node.props,
    };

    const rendered = definition.render(props, safeChildren);

    // Guard: Check that render returned a valid React element
    if (rendered === undefined) {
      console.warn(`[RuntimeRegistry] Render returned undefined for type: ${node.type}`, {
        nodeId: node.id,
        reactKey,
      });
      return (
        <div
          key={reactKey}
          className="runtime-node"
          data-node-id={node.id}
          data-node-type={node.type}
        />
      );
    }

    return (
      <div
        key={reactKey}
        className="runtime-node"
        data-node-id={node.id}
        data-node-type={node.type}
      >
        {rendered}
      </div>
    );
  } catch (error) {
    console.error(`[RuntimeRegistry] Error rendering node ${node.id} (${node.type}):`, error, {
      reactKey,
    });
    return (
      <div
        key={reactKey}
        className="runtime-node runtime-node--error"
        data-node-id={node.id}
        data-node-type={node.type}
      >
        <div className="runtime-error-placeholder" style={{ padding: '8px', color: '#666', fontSize: '12px' }}>
          Component failed to load
        </div>
      </div>
    );
  }
}

/**
 * Renders the complete canvas tree for runtime (published pages)
 * Entry point for EditorDocumentRenderer
 */
export function renderRuntimeTree(rootNode: CanvasNode): JSX.Element {
  return renderRuntimeNode(rootNode, 0, '0');
}
