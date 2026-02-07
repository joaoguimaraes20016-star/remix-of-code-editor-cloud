// supabase/functions/automation-trigger/actions/data-transform.ts
// Data transformation actions for automations

import type { AutomationContext, StepExecutionLog } from "../types.ts";
import { renderTemplate } from "../template-engine.ts";

type FlexibleConfig = Record<string, unknown>;

/**
 * Format a date value using configurable format strings
 */
export async function executeFormatDate(
  config: FlexibleConfig,
  context: AutomationContext,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  try {
    const rawInput = (config.input as string) || "";
    const input = renderTemplate(rawInput, context);
    const format = (config.format as string) || "YYYY-MM-DD";
    const timezone = (config.timezone as string) || "UTC";
    const variableName = (config.outputVariable as string) || "formattedDate";

    if (!input) {
      log.status = "skipped";
      log.skipReason = "no_input_value";
      return log;
    }

    const date = new Date(input);
    if (isNaN(date.getTime())) {
      log.status = "error";
      log.error = `Invalid date: ${input}`;
      return log;
    }

    // Format using Intl.DateTimeFormat for timezone support
    const options: Intl.DateTimeFormatOptions = { timeZone: timezone };
    let formatted: string;

    switch (format) {
      case "YYYY-MM-DD":
        formatted = date.toLocaleDateString("en-CA", { ...options, year: "numeric", month: "2-digit", day: "2-digit" });
        break;
      case "MM/DD/YYYY":
        formatted = date.toLocaleDateString("en-US", { ...options, year: "numeric", month: "2-digit", day: "2-digit" });
        break;
      case "DD/MM/YYYY": {
        const d = new Intl.DateTimeFormat("en-GB", { ...options, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
        formatted = d;
        break;
      }
      case "MMMM D, YYYY":
        formatted = date.toLocaleDateString("en-US", { ...options, year: "numeric", month: "long", day: "numeric" });
        break;
      case "relative": {
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) formatted = "today";
        else if (diffDays === 1) formatted = "tomorrow";
        else if (diffDays === -1) formatted = "yesterday";
        else if (diffDays > 0) formatted = `in ${diffDays} days`;
        else formatted = `${Math.abs(diffDays)} days ago`;
        break;
      }
      case "ISO":
        formatted = date.toISOString();
        break;
      case "unix":
        formatted = String(Math.floor(date.getTime() / 1000));
        break;
      default:
        formatted = date.toISOString();
    }

    log.output = { input, format, formatted, variableName };
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

/**
 * Format a number value with configurable options
 */
export async function executeFormatNumber(
  config: FlexibleConfig,
  context: AutomationContext,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  try {
    const rawInput = (config.input as string) || "";
    const input = renderTemplate(rawInput, context);
    const format = (config.format as string) || "decimal";
    const locale = (config.locale as string) || "en-US";
    const currency = (config.currency as string) || "USD";
    const decimals = (config.decimals as number) ?? 2;
    const variableName = (config.outputVariable as string) || "formattedNumber";

    const num = parseFloat(input);
    if (isNaN(num)) {
      log.status = "error";
      log.error = `Invalid number: ${input}`;
      return log;
    }

    let formatted: string;

    switch (format) {
      case "currency":
        formatted = new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(num);
        break;
      case "percent":
        formatted = new Intl.NumberFormat(locale, {
          style: "percent",
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(num);
        break;
      case "compact":
        formatted = new Intl.NumberFormat(locale, {
          notation: "compact",
          compactDisplay: "short",
        }).format(num);
        break;
      case "decimal":
      default:
        formatted = new Intl.NumberFormat(locale, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(num);
        break;
    }

    log.output = { input: num, format, formatted, variableName };
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

/**
 * Format/transform text strings
 */
export async function executeFormatText(
  config: FlexibleConfig,
  context: AutomationContext,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  try {
    const rawInput = (config.input as string) || "";
    const input = renderTemplate(rawInput, context);
    const operation = (config.operation as string) || "trim";
    const variableName = (config.outputVariable as string) || "formattedText";

    let result: string;

    switch (operation) {
      case "uppercase":
        result = input.toUpperCase();
        break;
      case "lowercase":
        result = input.toLowerCase();
        break;
      case "capitalize":
        result = input.length > 0
          ? input.charAt(0).toUpperCase() + input.slice(1).toLowerCase()
          : "";
        break;
      case "title_case":
        result = input.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
        break;
      case "trim":
        result = input.trim();
        break;
      case "slug":
        result = input.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
        break;
      case "truncate": {
        const maxLength = (config.maxLength as number) || 100;
        const suffix = (config.suffix as string) || "...";
        result = input.length > maxLength ? input.substring(0, maxLength) + suffix : input;
        break;
      }
      case "replace": {
        const find = (config.find as string) || "";
        const replacement = (config.replace as string) || "";
        result = input.replaceAll(find, replacement);
        break;
      }
      case "extract_email": {
        const emailMatch = input.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
        result = emailMatch ? emailMatch[0] : "";
        break;
      }
      case "extract_phone": {
        const phoneMatch = input.match(/[\d+().\s-]{7,}/);
        result = phoneMatch ? phoneMatch[0].trim() : "";
        break;
      }
      case "split": {
        const delimiter = (config.delimiter as string) || ",";
        const index = (config.index as number) ?? 0;
        const parts = input.split(delimiter);
        result = parts[index]?.trim() || "";
        break;
      }
      default:
        result = input;
    }

    log.output = { input, operation, result, variableName };
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

/**
 * Perform math operations on numeric values
 */
export async function executeMathOperation(
  config: FlexibleConfig,
  context: AutomationContext,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  try {
    const operation = (config.operation as string) || "add";
    const rawA = renderTemplate((config.valueA as string) || "0", context);
    const rawB = renderTemplate((config.valueB as string) || "0", context);
    const variableName = (config.outputVariable as string) || "mathResult";

    const a = parseFloat(rawA);
    const b = parseFloat(rawB);

    if (isNaN(a)) {
      log.status = "error";
      log.error = `Invalid number for valueA: ${rawA}`;
      return log;
    }

    let result: number;

    switch (operation) {
      case "add":
        result = a + b;
        break;
      case "subtract":
        result = a - b;
        break;
      case "multiply":
        result = a * b;
        break;
      case "divide":
        if (b === 0) {
          log.status = "error";
          log.error = "Division by zero";
          return log;
        }
        result = a / b;
        break;
      case "modulo":
        if (b === 0) {
          log.status = "error";
          log.error = "Modulo by zero";
          return log;
        }
        result = a % b;
        break;
      case "power":
        result = Math.pow(a, b);
        break;
      case "min":
        result = Math.min(a, b);
        break;
      case "max":
        result = Math.max(a, b);
        break;
      case "round":
        result = Math.round(a * Math.pow(10, b)) / Math.pow(10, b);
        break;
      case "floor":
        result = Math.floor(a);
        break;
      case "ceil":
        result = Math.ceil(a);
        break;
      case "abs":
        result = Math.abs(a);
        break;
      default:
        result = a + b;
    }

    log.output = { valueA: a, valueB: b, operation, result, variableName };
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}
