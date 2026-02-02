// Prefixes by element type
const PREFIXES = {
  block: 'blk',
  button: 'btn',
  field: 'fld',
  option: 'opt',
} as const;

export function generateTrackingId(type: keyof typeof PREFIXES): string {
  const short = Math.random().toString(36).substring(2, 8);
  return `${PREFIXES[type]}_${short}`;
}
