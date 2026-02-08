// supabase/functions/automation-trigger/retry-policy.ts
// Error classification and action-specific retry policies for network-dependent actions

export interface RetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  shouldRetry: (error: Error) => boolean;
}

/**
 * Classify errors as transient (retryable) vs permanent (not retryable).
 *
 * Transient errors include:
 * - Network errors (timeout, connection refused, DNS failures)
 * - HTTP 5xx server errors (502, 503, 504)
 * - HTTP 429 rate limit errors
 *
 * Permanent errors include:
 * - HTTP 4xx client errors (400, 401, 403, 404)
 * - Validation errors
 * - Authentication/authorization errors
 */
export function isTransientError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Network errors (transient)
  if (
    message.includes("timeout") ||
    message.includes("econnrefused") ||
    message.includes("econnreset") ||
    message.includes("enotfound") ||
    message.includes("enetunreach") ||
    message.includes("epipe") ||
    message.includes("connection reset") ||
    message.includes("socket hang up") ||
    message.includes("fetch failed") ||
    message.includes("network error") ||
    message.includes("aborted")
  ) {
    return true;
  }

  // HTTP 5xx errors (transient - server-side issues)
  if (
    message.includes("500") ||
    message.includes("502") ||
    message.includes("503") ||
    message.includes("504") ||
    message.includes("internal server error") ||
    message.includes("bad gateway") ||
    message.includes("service unavailable") ||
    message.includes("gateway timeout")
  ) {
    return true;
  }

  // Rate limit (transient - should back off and retry)
  if (message.includes("429") || message.includes("rate limit") || message.includes("too many requests")) {
    return true;
  }

  // HTTP 4xx errors (permanent - client-side issues, won't resolve on retry)
  if (
    message.includes("400 bad request") ||
    message.includes("401 unauthorized") ||
    message.includes("403 forbidden") ||
    message.includes("404 not found") ||
    message.includes("405 method not allowed") ||
    message.includes("409 conflict") ||
    message.includes("422 unprocessable")
  ) {
    return false;
  }

  // Explicit auth/validation errors (permanent)
  if (
    message.includes("invalid api key") ||
    message.includes("unauthorized") ||
    message.includes("forbidden") ||
    message.includes("not found") ||
    message.includes("invalid request") ||
    message.includes("validation")
  ) {
    return false;
  }

  // Default: retry unknown errors (more likely transient in network contexts)
  return true;
}

/**
 * Action-specific retry policies.
 *
 * Critical actions (messaging, payments): 3 retries, 1s initial delay
 * High-priority actions (integrations): 2 retries, 1.5s initial delay
 * Medium-priority actions (tracking): 2 retries, 2s initial delay
 *
 * All use exponential backoff: delay = initialDelayMs * 2^(attempt-1)
 * e.g., 1000ms → 1s, 2s, 4s for 3 retries (~7s total)
 */
export const RETRY_POLICIES: Record<string, RetryPolicy> & { default: RetryPolicy } = {
  // === Critical: Customer-facing communications ===
  send_email: { maxRetries: 3, initialDelayMs: 1000, shouldRetry: isTransientError },
  send_sms: { maxRetries: 3, initialDelayMs: 1000, shouldRetry: isTransientError },
  send_whatsapp: { maxRetries: 3, initialDelayMs: 1000, shouldRetry: isTransientError },
  send_message: { maxRetries: 3, initialDelayMs: 1000, shouldRetry: isTransientError },

  // === Critical: Revenue-impacting ===
  charge_payment: { maxRetries: 3, initialDelayMs: 1000, shouldRetry: isTransientError },
  send_invoice: { maxRetries: 2, initialDelayMs: 1500, shouldRetry: isTransientError },
  create_subscription: { maxRetries: 2, initialDelayMs: 1500, shouldRetry: isTransientError },
  cancel_subscription: { maxRetries: 2, initialDelayMs: 1500, shouldRetry: isTransientError },

  // === High priority: External integrations ===
  custom_webhook: { maxRetries: 3, initialDelayMs: 1000, shouldRetry: isTransientError },
  google_sheets: { maxRetries: 2, initialDelayMs: 1500, shouldRetry: isTransientError },
  slack_message: { maxRetries: 2, initialDelayMs: 1500, shouldRetry: isTransientError },
  discord_message: { maxRetries: 2, initialDelayMs: 1500, shouldRetry: isTransientError },

  // === High priority: Voice ===
  send_voicemail: { maxRetries: 2, initialDelayMs: 1500, shouldRetry: isTransientError },
  make_call: { maxRetries: 2, initialDelayMs: 1500, shouldRetry: isTransientError },

  // === Medium priority: Conversion tracking ===
  meta_conversion: { maxRetries: 2, initialDelayMs: 2000, shouldRetry: isTransientError },
  google_conversion: { maxRetries: 2, initialDelayMs: 2000, shouldRetry: isTransientError },
  tiktok_event: { maxRetries: 2, initialDelayMs: 2000, shouldRetry: isTransientError },

  // === Medium priority: Marketing ===
  send_review_request: { maxRetries: 2, initialDelayMs: 1500, shouldRetry: isTransientError },
  reply_in_comments: { maxRetries: 2, initialDelayMs: 1500, shouldRetry: isTransientError },

  // === Default policy for unlisted actions ===
  default: { maxRetries: 2, initialDelayMs: 1500, shouldRetry: isTransientError },
};
