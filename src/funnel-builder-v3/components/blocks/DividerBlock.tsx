/**
 * Divider Block
 */

import { Block } from '../../types/funnel';

interface DividerBlockProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  previewMode: boolean;
  primaryColor?: string;
}

export function DividerBlock({ block }: DividerBlockProps) {
  const { color } = block.props;

  return (
    <div className="py-4 px-2">
      <hr 
        className="border-t border-border" 
        style={{ borderColor: color || undefined }}
      />
    </div>
  );
}
