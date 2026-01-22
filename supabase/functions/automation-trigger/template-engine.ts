// supabase/functions/automation-trigger/template-engine.ts
// GHL-grade template engine with pipe formatters and aliases

import type { AutomationContext } from "./types.ts";

// --- Pipe/Formatter Definitions ---
type PipeHandler = (value: any, arg?: string) => string;

const PIPES: Record<string, PipeHandler> = {
  // Default fallback
  default: (val, fallback) => {
    if (val === null || val === undefined || val === "") {
      return fallback ?? "";
    }
    return String(val);
  },

  // Text transforms
  uppercase: (val) => String(val ?? "").toUpperCase(),
  lowercase: (val) => String(val ?? "").toLowerCase(),
  capitalize: (val) => {
    const s = String(val ?? "");
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  },
  titlecase: (val) => {
    return String(val ?? "")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  },
  trim: (val) => String(val ?? "").trim(),

  // Date/time formatters
  date: (val, format) => formatDate(val, format || "MMM D, YYYY"),
  time: (val, format) => formatTime(val, format || "h:mm A"),
  datetime: (val, format) => formatDateTime(val, format || "MMM D, YYYY [at] h:mm A"),
  day_of_week: (val) => getDayOfWeek(val),
  month_name: (val) => getMonthName(val),

  // Phone formatters
  phone_e164: (val) => normalizePhoneE164(String(val ?? "")),
  phone_display: (val) => formatPhoneDisplay(String(val ?? "")),
  phone_national: (val) => formatPhoneNational(String(val ?? "")),

  // Number/currency formatters
  number: (val, decimals) => {
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return num.toFixed(Number(decimals) || 0);
  },
  currency: (val, symbol) => {
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return `${symbol || "$"}${num.toFixed(2)}`;
  },
  percent: (val, decimals) => {
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return `${num.toFixed(Number(decimals) || 0)}%`;
  },

  // Misc
  json: (val) => JSON.stringify(val ?? null),
  first: (val) => {
    if (Array.isArray(val)) return String(val[0] ?? "");
    return String(val ?? "").split(" ")[0] || "";
  },
  last: (val) => {
    if (Array.isArray(val)) return String(val[val.length - 1] ?? "");
    const parts = String(val ?? "").split(" ");
    return parts[parts.length - 1] || "";
  },
  join: (val, separator) => {
    if (Array.isArray(val)) return val.join(separator || ", ");
    return String(val ?? "");
  },
  length: (val) => {
    if (Array.isArray(val)) return String(val.length);
    return String(String(val ?? "").length);
  },
};

// --- Variable Aliases (GHL compatibility) ---
const ALIASES: Record<string, string> = {
  // Lead aliases -> contact
  "lead.id": "contact.id",
  "lead.name": "contact.full_name",
  "lead.full_name": "contact.full_name",
  "lead.first_name": "contact.first_name",
  "lead.last_name": "contact.last_name",
  "lead.email": "contact.email",
  "lead.phone": "contact.phone",
  "lead.phone_raw": "contact.phone_raw",
  "lead.company": "contact.company_name",
  "lead.company_name": "contact.company_name",
  "lead.website": "contact.website",
  "lead.source": "contact.source",
  "lead.timezone": "contact.timezone",
  "lead.address": "contact.address_1",
  "lead.city": "contact.city",
  "lead.state": "contact.state",
  "lead.postal_code": "contact.postal_code",
  "lead.country": "contact.country",
  "lead.tags": "contact.tags",

  // Short aliases
  "first_name": "contact.first_name",
  "last_name": "contact.last_name",
  "email": "contact.email",
  "phone": "contact.phone",

  // Current date/time aliases
  "current_date": "system.current_date",
  "current_time": "system.current_time",
  "today": "system.current_date",
  "now": "system.now",
};

// --- Date/Time Formatting Helpers ---
function formatDate(val: any, format: string): string {
  const date = parseDate(val);
  if (!date) return String(val ?? "");

  // Simple token replacement
  return format
    .replace(/YYYY/g, String(date.getFullYear()))
    .replace(/YY/g, String(date.getFullYear()).slice(-2))
    .replace(/MMMM/g, getMonthName(date))
    .replace(/MMM/g, getMonthName(date).slice(0, 3))
    .replace(/MM/g, String(date.getMonth() + 1).padStart(2, "0"))
    .replace(/M/g, String(date.getMonth() + 1))
    .replace(/DDDD/g, getDayOfWeek(date))
    .replace(/DDD/g, getDayOfWeek(date).slice(0, 3))
    .replace(/DD/g, String(date.getDate()).padStart(2, "0"))
    .replace(/D/g, String(date.getDate()))
    .replace(/Do/g, getOrdinal(date.getDate()));
}

function formatTime(val: any, format: string): string {
  const date = parseDate(val);
  if (!date) return String(val ?? "");

  const hours24 = date.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const ampm = hours24 >= 12 ? "PM" : "AM";

  return format
    .replace(/HH/g, String(hours24).padStart(2, "0"))
    .replace(/H/g, String(hours24))
    .replace(/hh/g, String(hours12).padStart(2, "0"))
    .replace(/h/g, String(hours12))
    .replace(/mm/g, String(minutes).padStart(2, "0"))
    .replace(/m/g, String(minutes))
    .replace(/ss/g, String(seconds).padStart(2, "0"))
    .replace(/s/g, String(seconds))
    .replace(/A/g, ampm)
    .replace(/a/g, ampm.toLowerCase());
}

function formatDateTime(val: any, format: string): string {
  // Handle [at] or [on] literals
  const cleaned = format
    .replace(/\[at\]/g, "at")
    .replace(/\[on\]/g, "on");
  
  // First pass for date, second for time
  let result = formatDate(val, cleaned);
  result = formatTime(val, result);
  return result;
}

function parseDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function getDayOfWeek(val: any): string {
  const date = parseDate(val);
  if (!date) return "";
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getDay()];
}

function getMonthName(val: any): string {
  const date = parseDate(val);
  if (!date) return "";
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return months[date.getMonth()];
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// --- Phone Formatting Helpers ---
function normalizePhoneE164(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");
  
  // If it starts with 1 and has 11 digits, assume US
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  // If 10 digits, assume US and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  // Otherwise return with + prefix if not already
  return phone.startsWith("+") ? phone : `+${digits}`;
}

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  
  // Format as (XXX) XXX-XXXX for 10-11 digit US numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

function formatPhoneNational(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

// --- Pipe Parser ---
function parsePipe(pipeExpr: string): [string, string | undefined] {
  // Match: pipeName:"arg" or pipeName:'arg' or just pipeName
  const match = pipeExpr.match(/^(\w+)(?:\s*:\s*["']?([^"']+)["]?)?$/);
  if (match) {
    return [match[1], match[2]];
  }
  return [pipeExpr.trim(), undefined];
}

// --- Field Value Getter with Alias Resolution ---
export function getFieldValue(context: Record<string, any>, path: string): any {
  // Resolve aliases first
  const resolvedPath = ALIASES[path] || path;
  
  const keys = resolvedPath.split(".");
  let value: any = context;
  
  for (const key of keys) {
    if (value == null) return undefined;
    value = value[key];
  }
  
  return value;
}

// --- Build System Context (current date/time) ---
export function buildSystemContext(): Record<string, any> {
  const now = new Date();
  return {
    current_date: now.toISOString().split("T")[0],
    current_time: now.toTimeString().split(" ")[0],
    now: now.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timestamp: now.getTime(),
  };
}

// --- Enrich Context with Derived Fields ---
export function enrichContext(context: AutomationContext): Record<string, any> {
  const enriched: Record<string, any> = { ...context };
  
  // Add system context
  enriched.system = buildSystemContext();
  
  // Derive contact full_name if not present
  if (enriched.lead || enriched.contact) {
    const contact = enriched.contact || enriched.lead;
    if (contact && !contact.full_name && (contact.first_name || contact.last_name)) {
      contact.full_name = `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
    }
    // Ensure both lead and contact point to same data
    enriched.contact = contact;
    enriched.lead = contact;
  }
  
  // Derive appointment fields
  if (enriched.appointment) {
    const appt = enriched.appointment;
    const startDate = parseDate(appt.start_at_utc || appt.startAt || appt.start_datetime);
    
    if (startDate) {
      appt.start_datetime = startDate.toISOString();
      appt.start_date = startDate.toISOString().split("T")[0];
      appt.start_time = formatTime(startDate, "h:mm A");
      appt.day_of_week = getDayOfWeek(startDate);
      appt.month = startDate.getMonth() + 1;
      appt.name_of_month = getMonthName(startDate);
      
      // Calculate end time if duration is known
      const durationMinutes = appt.duration_minutes || 30;
      const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
      appt.end_datetime = endDate.toISOString();
      appt.end_date = endDate.toISOString().split("T")[0];
      appt.end_time = formatTime(endDate, "h:mm A");
    }
  }
  
  return enriched;
}

// --- Main Template Renderer ---
export function renderTemplate(template: string, context: AutomationContext): string {
  if (!template) return "";
  
  // Enrich context with derived fields
  const enrichedContext = enrichContext(context);
  
  // Match {{path.to.field | pipe:"arg" | pipe2}}
  return template.replace(/\{\{([^}]+)\}\}/g, (match, expr) => {
    const parts = expr.split("|").map((s: string) => s.trim());
    const pathPart = parts[0];
    const pipeParts = parts.slice(1);
    
    // Get the raw value
    let value = getFieldValue(enrichedContext, pathPart);
    
    // Apply each pipe in order
    for (const pipeExpr of pipeParts) {
      const [pipeName, pipeArg] = parsePipe(pipeExpr);
      const handler = PIPES[pipeName];
      if (handler) {
        value = handler(value, pipeArg);
      }
    }
    
    // Return empty string for null/undefined unless there's a default pipe
    if (value === null || value === undefined) {
      return "";
    }
    
    return String(value);
  });
}

// --- Extract Variables from Template (for logging/debugging) ---
export function extractTemplateVariables(template: string, context: AutomationContext): Record<string, any> {
  const enrichedContext = enrichContext(context);
  const matches = template.match(/\{\{([^}]+)\}\}/g) || [];
  const variables: Record<string, any> = {};
  
  for (const match of matches) {
    const expr = match.replace(/\{\{|\}\}/g, "").trim();
    const pathPart = expr.split("|")[0].trim();
    variables[pathPart] = getFieldValue(enrichedContext, pathPart);
  }
  
  return variables;
}

// --- Export all pipes for reference ---
export const AVAILABLE_PIPES = Object.keys(PIPES);

// --- Export aliases for variable picker ---
export const VARIABLE_ALIASES = ALIASES;
