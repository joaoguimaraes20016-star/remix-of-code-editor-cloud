// src/lib/automations/templateUtils.ts

/**
 * Tiny merge-field engine for message templates.
 * Example: "Hey {{lead.first_name}}" with context { lead: { first_name: 'Joao' } }
 */

export function renderTemplate(
  template: string,
  context: Record<string, any>,
): string {
  if (!template) return '';

  return template.replace(/{{\s*([^}]+)\s*}}/g, (_, rawKey) => {
    const key = String(rawKey).trim();
    const value = get(context, key);

    if (value === undefined || value === null) return '';
    return String(value);
  });
}

function get(obj: any, path: string): any {
  return path
    .split('.')
    .reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
}
