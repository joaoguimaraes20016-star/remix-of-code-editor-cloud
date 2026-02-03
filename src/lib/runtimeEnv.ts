// Detect if current hostname is a Lovable/preview/local domain
export function isLovableHost(hostname?: string): boolean {
  const h = hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '');
  return h.includes('localhost') ||
         h.includes('127.0.0.1') ||
         h.includes('.app') ||
         h.includes('.lovable.') ||
         h.includes('lovableproject.com');
}

// Detect if current hostname is a custom domain (not Lovable-hosted)
export function isCustomDomainHost(): boolean {
  if (typeof window === 'undefined') return false;
  return !isLovableHost();
}
