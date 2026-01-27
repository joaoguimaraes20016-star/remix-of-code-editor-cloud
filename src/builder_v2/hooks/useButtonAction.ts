/**
 * A4: Shared hook for handling button actions in step components
 * Wires CTA buttons to actual functionality (navigation, URL, flow control)
 */

export interface ButtonAction {
  type: 'continue' | 'next-step' | 'go-to-step' | 'url' | 'redirect' | 'submit' | 'none';
  stepId?: string;
  url?: string;
  openNewTab?: boolean;
}

/**
 * Creates a click handler for step CTA buttons based on buttonAction config
 */
export function useButtonAction(buttonAction?: ButtonAction): () => void {
  return () => {
    if (!buttonAction || buttonAction.type === 'none') {
      // Default behavior: emit next-step intent
      window.dispatchEvent(new CustomEvent('flow-intent', { detail: { type: 'next-step' } }));
      return;
    }

    switch (buttonAction.type) {
      case 'next-step':
      case 'continue':
        window.dispatchEvent(new CustomEvent('flow-intent', { detail: { type: 'next-step' } }));
        break;

      case 'go-to-step':
        if (buttonAction.stepId) {
          window.dispatchEvent(new CustomEvent('flow-intent', { 
            detail: { type: 'go-to-step', stepId: buttonAction.stepId } 
          }));
        }
        break;

      case 'url':
      case 'redirect':
        if (buttonAction.url) {
          // Sanitize URL for security
          const sanitizedUrl = sanitizeNavigationUrl(buttonAction.url);
          if (sanitizedUrl) {
            if (buttonAction.openNewTab) {
              window.open(sanitizedUrl, '_blank', 'noopener,noreferrer');
            } else {
              window.location.href = sanitizedUrl;
            }
          }
        }
        break;

      case 'submit':
        window.dispatchEvent(new CustomEvent('flow-intent', { detail: { type: 'submit' } }));
        break;

      default:
        // Fallback to next-step
        window.dispatchEvent(new CustomEvent('flow-intent', { detail: { type: 'next-step' } }));
    }
  };
}

/**
 * Sanitizes navigation URLs to prevent XSS attacks
 * Only allows http, https, mailto, and tel protocols
 */
function sanitizeNavigationUrl(url: string): string | null {
  try {
    const trimmed = url.trim();
    
    // Allow relative URLs
    if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
      return trimmed;
    }
    
    // Parse and validate protocol
    const parsed = new URL(trimmed);
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    
    if (allowedProtocols.includes(parsed.protocol)) {
      return trimmed;
    }
    
    console.warn('[useButtonAction] Blocked URL with disallowed protocol:', parsed.protocol);
    return null;
  } catch {
    // If URL parsing fails, check if it looks like a relative path
    if (/^[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+$/.test(url.trim())) {
      return url.trim();
    }
    return null;
  }
}
