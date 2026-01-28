/**
 * Block Clipboard Hook
 * Manages copy/paste operations for blocks
 */

import { useState, useCallback, useEffect } from 'react';
import { Block, createId } from '../types/funnel';

interface ClipboardState {
  block: Block | null;
  timestamp: number;
}

// Module-level clipboard to persist across component mounts
let globalClipboard: ClipboardState = { block: null, timestamp: 0 };

export function useClipboard() {
  const [clipboard, setClipboard] = useState<ClipboardState>(globalClipboard);

  // Sync with global clipboard
  useEffect(() => {
    const interval = setInterval(() => {
      if (globalClipboard.timestamp !== clipboard.timestamp) {
        setClipboard({ ...globalClipboard });
      }
    }, 100);
    return () => clearInterval(interval);
  }, [clipboard.timestamp]);

  const copy = useCallback((block: Block) => {
    const state: ClipboardState = {
      block: JSON.parse(JSON.stringify(block)),
      timestamp: Date.now(),
    };
    globalClipboard = state;
    setClipboard(state);
  }, []);

  const paste = useCallback((): Block | null => {
    if (!globalClipboard.block) return null;
    
    // Create a new block with fresh ID
    const pasted: Block = {
      ...JSON.parse(JSON.stringify(globalClipboard.block)),
      id: createId(),
    };
    
    return pasted;
  }, []);

  const clear = useCallback(() => {
    globalClipboard = { block: null, timestamp: 0 };
    setClipboard({ block: null, timestamp: 0 });
  }, []);

  return {
    hasClipboard: !!clipboard.block,
    clipboardBlock: clipboard.block,
    copy,
    paste,
    clear,
  };
}
