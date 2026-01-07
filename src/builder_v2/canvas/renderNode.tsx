import type { CanvasNode, EditorState } from '../types';

/**
 * renderNode MUST remain a pure function.
 * - No state
 * - No side effects
 * - No data mutation
 * This guarantees deterministic rendering and prevents duplication bugs.
 */

type NodeRenderer = (node: CanvasNode, children: JSX.Element[]) => JSX.Element;

const nodeRenderers: Record<string, NodeRenderer> = {
  container: (_, children) => (
    <div className="builder-v2-node-content">{children}</div>
  ),
  text: (node) => {
    const text = typeof node.props.text === 'string' ? node.props.text : 'Text';
    return <p className="builder-v2-node-text">{text}</p>;
  },
  button: (node) => {
    const label = typeof node.props.label === 'string' ? node.props.label : 'Button';
    return <button className="builder-v2-node-button">{label}</button>;
  },
};

const fallbackRenderer: NodeRenderer = (_, children) => (
  <div className="builder-v2-node-content">{children}</div>
);

export function renderNode(
  node: CanvasNode,
  editorState: EditorState,
  onSelectNode: (nodeId: string) => void,
): JSX.Element {
  const children = node.children.map((child) =>
    renderNode(child, editorState, onSelectNode),
  );
  const safeChildren = node.type === 'container' ? children : [];
  const renderer = nodeRenderers[node.type] ?? fallbackRenderer;
  const isSelected = editorState.selectedNodeId === node.id;

  return (
    <div
      key={node.id}
      className="builder-v2-node"
      data-selected={isSelected}
      data-node-id={node.id}
    >
      <div
        onClick={(event) => {
          event.stopPropagation();
          onSelectNode(node.id);
        }}
      >
        {renderer(node, safeChildren)}
      </div>
    </div>
  );
}
