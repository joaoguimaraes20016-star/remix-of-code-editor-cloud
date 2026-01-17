/**
 * Element Drag Overlay - Visual feedback during element drag operations
 */

import React from 'react';
import type { Element } from '../../../types/infostack';

export interface ElementDragOverlayProps {
  element: Element;
}

export const ElementDragOverlay: React.FC<ElementDragOverlayProps> = ({ element }) => (
  <div className="px-4 py-2 rounded-lg bg-white shadow-xl border-2 border-builder-accent opacity-90">
    <div className="text-sm font-medium text-gray-900">{element.type}</div>
    {element.content && (
      <div className="text-xs text-gray-500 truncate max-w-[200px]">{element.content}</div>
    )}
  </div>
);

ElementDragOverlay.displayName = 'ElementDragOverlay';
