/**
 * Color utilities for builder UI.
 *
 * We keep these small + dependency-free so both the Flow builder toolbar
 * and the v2 inspector controls can share consistent behavior.
 */

export function parseRgbToHex(input: string): string | null {
  const m = input
    .trim()
    .match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d*\.?\d+)\s*)?\)$/i);
  if (!m) return null;

  const r = Math.max(0, Math.min(255, Number(m[1])));
  const g = Math.max(0, Math.min(255, Number(m[2])));
  const b = Math.max(0, Math.min(255, Number(m[3])));

  const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function expandShortHex(hex: string): string {
  const h = hex.replace('#', '').trim();
  if (h.length !== 3) return `#${h.toUpperCase()}`;
  return `#${h
    .split('')
    .map((c) => `${c}${c}`)
    .join('')
    .toUpperCase()}`;
}

/**
 * Normalize any CSS color string (hex/rgb/name/etc.) into #RRGGBB.
 * Returns null when it cannot be normalized.
 */
export function normalizeCssColorToHex(input?: string | null): string | null {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  if (raw.toLowerCase() === 'transparent') return null;
  if (raw.toLowerCase() === 'currentcolor') return null;

  // Hex
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) {
    return expandShortHex(raw);
  }

  // rgb()/rgba()
  if (raw.toLowerCase().startsWith('rgb')) {
    return parseRgbToHex(raw);
  }

  // Named colors / hsl() / etc. Resolve via browser.
  if (typeof document !== 'undefined') {
    const el = document.createElement('span');
    el.style.color = raw;
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    el.style.top = '-9999px';
    document.body.appendChild(el);

    const resolved = getComputedStyle(el).color;
    el.remove();

    return parseRgbToHex(resolved);
  }

  return null;
}

/**
 * Value safe for <input type="color" /> (must be hex).
 * Default fallback is black (#000000) for better dark-theme text visibility.
 */
export function normalizeColorForColorInput(input?: string | null, fallback = '#000000'): string {
  return normalizeCssColorToHex(input) ?? expandShortHex(fallback);
}
