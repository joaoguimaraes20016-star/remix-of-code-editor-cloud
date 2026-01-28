/**
 * Preview Divider Block
 */

import { Block, FunnelSettings } from '../../types/funnel';

interface PreviewDividerBlockProps {
  block: Block;
  settings: FunnelSettings;
}

export function PreviewDividerBlock({ block }: PreviewDividerBlockProps) {
  const color = block.props.color || '#e5e7eb';
  
  return (
    <hr 
      className="border-t my-4"
      style={{ borderColor: color }}
    />
  );
}
