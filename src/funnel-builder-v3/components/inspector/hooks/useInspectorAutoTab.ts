/**
 * useInspectorAutoTab - Auto-switch inspector tab based on selection
 */

import { useEffect, useRef } from 'react';

type TabValue = 'add' | 'content' | 'style' | 'settings';

// Block types that should switch to content tab (text editing priority)
const contentBlocks = ['text', 'heading', 'paragraph', 'richtext', 'list'];

// Block types that should switch to style tab (visual editing priority)
const styleBlocks = ['button', 'image', 'video', 'icon', 'divider', 'spacer', 'input', 'choice'];

/**
 * Automatically switch inspector tab based on selected block type
 * - No selection → Add tab
 * - Text blocks → Content tab (for inline editing feel)
 * - Visual blocks → Style tab (for quick styling)
 */
export function useInspectorAutoTab(
  selectedBlockType: string | null | undefined,
  setActiveTab: (tab: TabValue) => void
): void {
  const prevBlockType = useRef<string | null>(null);

  useEffect(() => {
    // Skip if same block type (prevent flicker when editing same type)
    if (selectedBlockType === prevBlockType.current) return;
    prevBlockType.current = selectedBlockType || null;

    // No selection -> Add tab (so user can add blocks)
    if (!selectedBlockType) {
      setActiveTab('add');
      return;
    }

    const normalizedType = selectedBlockType.toLowerCase();

    // Content blocks -> Style tab (content is also there, but style makes it feel "editable")
    if (contentBlocks.some(t => normalizedType.includes(t))) {
      setActiveTab('style');
      return;
    }

    // Visual/Style blocks -> Style tab
    if (styleBlocks.some(t => normalizedType.includes(t))) {
      setActiveTab('style');
      return;
    }

    // Default to style for any selected block (immediate editing feel)
    setActiveTab('style');
  }, [selectedBlockType, setActiveTab]);
}
