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

function getFlagsForElement(el: HTMLElement): { bold: boolean; italic: boolean; underline: boolean } {
  const computed = window.getComputedStyle(el);

  const weight = parseFontWeight(computed.fontWeight);
  const bold = weight >= 600;

  const italic = (computed.fontStyle || '').toLowerCase() === 'italic';

  // textDecorationLine is the most reliable, but fall back to textDecoration
  const decoration = (computed.textDecorationLine || computed.textDecoration || '').toLowerCase();
  const underline = decoration.includes('underline');

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
  // Caret
  if (range.collapsed) {
    const node = range.startContainer;
    const el = (node.nodeType === Node.ELEMENT_NODE
      ? (node as HTMLElement)
      : (node.parentElement as HTMLElement | null)) ?? root;

    const flags = getFlagsForElement(root.contains(el) ? el : root);
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

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current: Node | null = walker.nextNode();

  while (current) {
    const text = current as Text;
    if (rangeIntersectsTextNode(range, text)) {
      const el = text.parentElement ?? root;
      const flags = getFlagsForElement(el);

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

  return {
    bold: triStateFromSeen(seenBoldTrue, seenBoldFalse),
    italic: triStateFromSeen(seenItalicTrue, seenItalicFalse),
    underline: triStateFromSeen(seenUnderlineTrue, seenUnderlineFalse),
  };
}
