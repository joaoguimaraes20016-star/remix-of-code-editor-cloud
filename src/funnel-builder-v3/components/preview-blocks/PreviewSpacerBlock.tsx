/**
 * Preview Spacer Block
 */

import { Block, FunnelSettings } from '../../types/funnel';

interface PreviewSpacerBlockProps {
  block: Block;
  settings: FunnelSettings;
}

export function PreviewSpacerBlock({ block }: PreviewSpacerBlockProps) {
  const height = block.props.height || 32;
  
  return <div style={{ height: `${height}px` }} />;
}
