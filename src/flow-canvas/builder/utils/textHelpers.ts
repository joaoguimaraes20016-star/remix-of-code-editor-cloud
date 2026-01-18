/**
 * Text utility functions for the flow-canvas builder
 */

/**
 * Strip HTML tags from a string, returning plain text.
 * Uses DOMParser when available (browser), falls back to regex.
 */
export function stripHtmlToText(value: string): string {
  if (!value) return '';
  
  // Fast path: if no HTML-like content, return as-is
  if (!/<[^>]+>/.test(value)) {
    return value.replace(/&nbsp;/g, ' ').trim();
  }
  
  // Use DOMParser if available (browser environment)
  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(value, 'text/html');
      return (doc.body.textContent || '').replace(/&nbsp;/g, ' ').trim();
    } catch {
      // Fall through to regex
    }
  }
  
  // Fallback: regex-based stripping
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}
