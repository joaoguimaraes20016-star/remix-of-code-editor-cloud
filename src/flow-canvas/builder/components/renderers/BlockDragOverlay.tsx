/**
 * Block Drag Overlay - Visual feedback during block drag operations
 */

import React from 'react';
import type { Block } from '../../../types/infostack';

export interface BlockDragOverlayProps {
  block: Block;
}

export const BlockDragOverlay: React.FC<BlockDragOverlayProps> = ({ block }) => (
  <div className="p-6 rounded-xl bg-white shadow-2xl border-2 border-builder-accent opacity-90">
    <div className="text-sm font-medium text-gray-900">{block.label}</div>
    <div className="text-xs text-gray-500 mt-1">{block.type} block</div>
  </div>
);

BlockDragOverlay.displayName = 'BlockDragOverlay';
