// ============================================
// INLINE TEXT HIGHLIGHTING - {{text}} syntax
// Phase 5 Enhancements: Better parsing, escaping support
// ============================================

export interface HighlightSegment {
  text: string;
  isHighlighted: boolean;
  startIndex?: number;
  endIndex?: number;
}

/**
 * Parse text content with {{highlighted}} syntax
 * Returns array of segments with highlight flags
 * 
 * Example:
 * "Join the {{TOP 1%}} of traders" => 
 * [{ text: "Join the ", isHighlighted: false }, { text: "TOP 1%", isHighlighted: true }, { text: " of traders", isHighlighted: false }]
 * 
 * Improvements in Phase 5:
 * - Includes start/end index for each segment
 * - Handles escaped braces (\{{ and \}})
 * - More robust regex handling
 */
export const parseHighlightedText = (content: string): HighlightSegment[] => {
  if (!content || typeof content !== 'string') {
    return [{ text: content || '', isHighlighted: false, startIndex: 0, endIndex: 0 }];
  }
  
  // Match {{content}} where content can include any character except }
  // Negative lookbehind for escape character
  const regex = /(?<!\\)\{\{([^}]+)\}\}/g;
  const segments: HighlightSegment[] = [];
  let lastIndex = 0;
  let match;

  // Reset regex state for each parse
  regex.lastIndex = 0;

  while ((match = regex.exec(content)) !== null) {
    // Add text before highlight
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index);
      segments.push({ 
        text, 
        isHighlighted: false,
        startIndex: lastIndex,
        endIndex: match.index,
      });
    }
    // Add highlighted text (without the {{ }})
    segments.push({ 
      text: match[1], 
      isHighlighted: true,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last highlight
  if (lastIndex < content.length) {
    segments.push({ 
      text: content.slice(lastIndex), 
      isHighlighted: false,
      startIndex: lastIndex,
      endIndex: content.length,
    });
  }

  // Unescape any escaped braces in the segments
  return segments.length > 0 
    ? segments.map(seg => ({
        ...seg,
        text: seg.text.replace(/\\(\{\{|\}\})/g, '$1'),
      }))
    : [{ text: content, isHighlighted: false, startIndex: 0, endIndex: content.length }];
};

/**
 * Check if text contains any highlight syntax
 */
export const hasHighlightSyntax = (content: string): boolean => {
  if (!content) return false;
  return /(?<!\\)\{\{([^}]+)\}\}/.test(content);
};

/**
 * Wrap text in highlight syntax
 */
export const wrapInHighlight = (text: string): string => {
  return `{{${text}}}`;
};

/**
 * Remove all highlight syntax from text
 */
export const stripHighlightSyntax = (content: string): string => {
  if (!content) return '';
  return content.replace(/(?<!\\)\{\{([^}]+)\}\}/g, '$1');
};

/**
 * Escape highlight syntax in text (to prevent it from being parsed)
 */
export const escapeHighlightSyntax = (content: string): string => {
  if (!content) return '';
  return content
    .replace(/\{\{/g, '\\{{')
    .replace(/\}\}/g, '\\}}');
};

/**
 * Count the number of highlights in a text
 */
export const countHighlights = (content: string): number => {
  if (!content) return 0;
  const matches = content.match(/(?<!\\)\{\{([^}]+)\}\}/g);
  return matches ? matches.length : 0;
};

/**
 * Get all highlighted texts from content
 */
export const getHighlightedTexts = (content: string): string[] => {
  if (!content) return [];
  const segments = parseHighlightedText(content);
  return segments.filter(s => s.isHighlighted).map(s => s.text);
};
