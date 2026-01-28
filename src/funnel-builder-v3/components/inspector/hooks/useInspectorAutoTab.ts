/**
 * useInspectorAutoTab - Auto-switch inspector tab based on selection
 */

import { useEffect, useRef } from 'react';

type TabValue = 'add' | 'content' | 'style' | 'settings';

// Block types that should switch to content tab
const contentBlocks = ['text', 'heading', 'paragraph', 'richtext', 'list'];

// Block types that should switch to style tab
const styleBlocks = ['button', 'input', 'image', 'video', 'icon', 'divider', 'spacer'];

/**
 * Automatically switch inspector tab based on selected block type
 */
export function useInspectorAutoTab(
  selectedBlockType: string | null | undefined,
  setActiveTab: (tab: TabValue) => void
): void {
  const prevBlockType = useRef<string | null>(null);

  useEffect(() => {
    // Skip if same block type
    if (selectedBlockType === prevBlockType.current) return;
    prevBlockType.current = selectedBlockType || null;

    // No selection -> Add tab
    if (!selectedBlockType) {
      setActiveTab('add');
      return;
    }

    const normalizedType = selectedBlockType.toLowerCase();

    // Content blocks -> Content tab
    if (contentBlocks.some(t => normalizedType.includes(t))) {
      setActiveTab('content');
      return;
    }

    // Style blocks -> Style tab
    if (styleBlocks.some(t => normalizedType.includes(t))) {
      setActiveTab('style');
      return;
    }

    // Default to content for other blocks
    setActiveTab('content');
  }, [selectedBlockType, setActiveTab]);
}
