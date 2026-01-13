export type TriState = 'on' | 'off' | 'mixed';

export type FormatState = {
  bold: TriState;
  italic: TriState;
  underline: TriState;
};

function parseFontWeight(value: string): number {
  const v = (value || '').trim().toLowerCase();
  if (!v) return 400;
  if (v === 'bold') return 700;
  const n = Number(v);
  return Number.isFinite(n) ? n : 400;
}

function getFlagsForElement(
  el: HTMLElement,
  root?: HTMLElement
): { bold: boolean; italic: boolean; underline: boolean } {
  const computed = window.getComputedStyle(el);

  const weight = parseFontWeight(computed.fontWeight);
  const bold = weight >= 600;

  const italic = (computed.fontStyle || '').toLowerCase() === 'italic';

  // text-decoration is NOT inherited, but it *does* visually apply to descendants.
  // When we wrap formatting spans around already-styled content (e.g. gradient spans),
  // the Text node's parentElement might be an inner span whose computed
  // textDecorationLine can still read as "none" even though an ancestor is underlining.
  //
  // So: detect underline by walking up to the editor root.
  let underline = false;
  let cur: HTMLElement | null = el;
  const stopAt = root ?? null;

  while (cur) {
    const c = cur === el ? computed : window.getComputedStyle(cur);
    const decoration = (c.textDecorationLine || c.textDecoration || '').toLowerCase();
    if (decoration.includes('underline')) {
      underline = true;
      break;
    }
    if (stopAt && cur === stopAt) break;
    cur = cur.parentElement;
  }

  return { bold, italic, underline };
}

function triStateFromSeen(seenTrue: boolean, seenFalse: boolean): TriState {
  if (seenTrue && seenFalse) return 'mixed';
  if (seenTrue) return 'on';
  return 'off';
}

function rangeIntersectsTextNode(range: Range, textNode: Text): boolean {
  if (!textNode.nodeValue || textNode.nodeValue.length === 0) return false;

  const nodeRange = document.createRange();
  nodeRange.selectNodeContents(textNode);

  // If range ends before node starts OR starts after node ends => no intersection
  return !(
    range.compareBoundaryPoints(Range.END_TO_START, nodeRange) <= 0 ||
    range.compareBoundaryPoints(Range.START_TO_END, nodeRange) >= 0
  );
}

/**
 * Returns tri-state formatting for the current selection range.
 * - Non-collapsed selection: 'on' if all selected text has the style, 'off' if none, else 'mixed'.
 * - Collapsed caret: 'on'/'off' based on caret position's computed style.
 */
export function getSelectionFormatState(root: HTMLElement, range: Range): FormatState {
  // DEBUG: Log input state
  if (import.meta.env.DEV) {
    console.debug('[getSelectionFormatState] input:', {
      collapsed: range.collapsed,
      startContainer: range.startContainer,
      startContainerConnected: range.startContainer.isConnected,
      rangeText: range.toString(),
      rootContainsStart: root.contains(range.startContainer),
    });
  }

  // Caret
  if (range.collapsed) {
    const node = range.startContainer;
    const el = (node.nodeType === Node.ELEMENT_NODE
      ? (node as HTMLElement)
      : (node.parentElement as HTMLElement | null)) ?? root;

    const flags = getFlagsForElement(root.contains(el) ? el : root, root);
    if (import.meta.env.DEV) {
      console.debug('[getSelectionFormatState] caret mode, flags:', flags);
    }
    return {
      bold: flags.bold ? 'on' : 'off',
      italic: flags.italic ? 'on' : 'off',
      underline: flags.underline ? 'on' : 'off',
    };
  }

  let seenBoldTrue = false;
  let seenBoldFalse = false;
  let seenItalicTrue = false;
  let seenItalicFalse = false;
  let seenUnderlineTrue = false;
  let seenUnderlineFalse = false;
  let textNodesChecked = 0;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current: Node | null = walker.nextNode();

  while (current) {
    const text = current as Text;
    if (rangeIntersectsTextNode(range, text)) {
      textNodesChecked++;
      const el = text.parentElement ?? root;
      const flags = getFlagsForElement(el, root);

      if (import.meta.env.DEV && textNodesChecked <= 3) {
        console.debug('[getSelectionFormatState] text node:', {
          text: text.textContent?.substring(0, 20),
          parentTag: el.tagName,
          parentStyle: el.getAttribute('style'),
          flags,
        });
      }

      if (flags.bold) seenBoldTrue = true;
      else seenBoldFalse = true;

      if (flags.italic) seenItalicTrue = true;
      else seenItalicFalse = true;

      if (flags.underline) seenUnderlineTrue = true;
      else seenUnderlineFalse = true;

      // Early exit if everything is mixed already
      if (
        seenBoldTrue && seenBoldFalse &&
        seenItalicTrue && seenItalicFalse &&
        seenUnderlineTrue && seenUnderlineFalse
      ) {
        break;
      }
    }

    current = walker.nextNode();
  }

  const result = {
    bold: triStateFromSeen(seenBoldTrue, seenBoldFalse),
    italic: triStateFromSeen(seenItalicTrue, seenItalicFalse),
    underline: triStateFromSeen(seenUnderlineTrue, seenUnderlineFalse),
  };

  if (import.meta.env.DEV) {
    console.debug('[getSelectionFormatState] result:', {
      textNodesChecked,
      seenBoldTrue,
      seenBoldFalse,
      result,
    });
  }

  return result;
}
