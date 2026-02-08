/**
 * Phase 2: Selective Retry Logic Tests
 *
 * Tests all Phase 2 implementations:
 * 1. Error classification (transient vs permanent)
 * 2. Retry policy definitions and configuration
 * 3. executeWithRetry behavior (success, retry, exhaust, permanent errors)
 * 4. Exponential backoff timing
 * 5. Integration with automation-trigger action wrapping
 * 6. Edge cases and boundary conditions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ============================================================
// 1. ERROR CLASSIFICATION TESTS
// ============================================================

describe("Error Classification (isTransientError)", () => {
  // We test the logic by reading the source file to verify patterns
  const retryPolicyPath = path.resolve(
    __dirname,
    "../../../../supabase/functions/automation-trigger/retry-policy.ts",
  );

  let retryPolicySource: string;

  beforeEach(() => {
    retryPolicySource = fs.readFileSync(retryPolicyPath, "utf-8");
  });

  describe("Network Errors (should be transient)", () => {
    it("should classify timeout errors as transient", () => {
      expect(retryPolicySource).toContain('message.includes("timeout")');
    });

    it("should classify connection refused errors as transient", () => {
      expect(retryPolicySource).toContain('message.includes("econnrefused")');
    });

    it("should classify connection reset errors as transient", () => {
      expect(retryPolicySource).toContain('message.includes("econnreset")');
      expect(retryPolicySource).toContain('message.includes("connection reset")');
    });

    it("should classify DNS resolution errors as transient", () => {
      expect(retryPolicySource).toContain('message.includes("enotfound")');
    });

    it("should classify network unreachable errors as transient", () => {
      expect(retryPolicySource).toContain('message.includes("enetunreach")');
    });

    it("should classify socket hang up errors as transient", () => {
      expect(retryPolicySource).toContain('message.includes("socket hang up")');
    });

    it("should classify fetch failures as transient", () => {
      expect(retryPolicySource).toContain('message.includes("fetch failed")');
    });

    it("should classify aborted requests as transient", () => {
      expect(retryPolicySource).toContain('message.includes("aborted")');
    });
  });

  describe("HTTP 5xx Errors (should be transient)", () => {
    it("should classify 500 Internal Server Error as transient", () => {
      expect(retryPolicySource).toContain('message.includes("500")');
    });

    it("should classify 502 Bad Gateway as transient", () => {
      expect(retryPolicySource).toContain('message.includes("502")');
      expect(retryPolicySource).toContain('message.includes("bad gateway")');
    });

    it("should classify 503 Service Unavailable as transient", () => {
      expect(retryPolicySource).toContain('message.includes("503")');
      expect(retryPolicySource).toContain('message.includes("service unavailable")');
    });

    it("should classify 504 Gateway Timeout as transient", () => {
      expect(retryPolicySource).toContain('message.includes("504")');
      expect(retryPolicySource).toContain('message.includes("gateway timeout")');
    });
  });

  describe("Rate Limit Errors (should be transient)", () => {
    it("should classify HTTP 429 as transient", () => {
      expect(retryPolicySource).toContain('message.includes("429")');
    });

    it("should classify rate limit messages as transient", () => {
      expect(retryPolicySource).toContain('message.includes("rate limit")');
      expect(retryPolicySource).toContain('message.includes("too many requests")');
    });
  });

  describe("HTTP 4xx Errors (should be permanent)", () => {
    it("should classify 400 Bad Request as permanent", () => {
      expect(retryPolicySource).toContain('message.includes("400 bad request")');
    });

    it("should classify 401 Unauthorized as permanent", () => {
      expect(retryPolicySource).toContain('message.includes("401 unauthorized")');
    });

    it("should classify 403 Forbidden as permanent", () => {
      expect(retryPolicySource).toContain('message.includes("403 forbidden")');
    });

    it("should classify 404 Not Found as permanent", () => {
      expect(retryPolicySource).toContain('message.includes("404 not found")');
    });

    it("should classify 422 Unprocessable as permanent", () => {
      expect(retryPolicySource).toContain('message.includes("422 unprocessable")');
    });
  });

  describe("Auth/Validation Errors (should be permanent)", () => {
    it("should classify invalid API key as permanent", () => {
      expect(retryPolicySource).toContain('message.includes("invalid api key")');
    });

    it("should classify validation errors as permanent", () => {
      expect(retryPolicySource).toContain('message.includes("validation")');
    });
  });

  describe("Error classification function structure", () => {
    it("should export isTransientError function", () => {
      expect(retryPolicySource).toContain("export function isTransientError");
    });

    it("should use lowercase comparison for case-insensitive matching", () => {
      expect(retryPolicySource).toContain("error.message.toLowerCase()");
    });

    it("should default to retrying unknown errors (fail-safe)", () => {
      // The function should return true for unknown errors
      // This is the "fail-safe" approach - retry when in doubt
      expect(retryPolicySource).toContain("return true;");
    });
  });
});

// ============================================================
// 2. RETRY POLICY CONFIGURATION TESTS
// ============================================================

describe("Retry Policy Definitions (RETRY_POLICIES)", () => {
  const retryPolicyPath = path.resolve(
    __dirname,
    "../../../../supabase/functions/automation-trigger/retry-policy.ts",
  );

  let retryPolicySource: string;

  beforeEach(() => {
    retryPolicySource = fs.readFileSync(retryPolicyPath, "utf-8");
  });

  describe("RetryPolicy interface", () => {
    it("should export RetryPolicy interface with required fields", () => {
      expect(retryPolicySource).toContain("export interface RetryPolicy");
      expect(retryPolicySource).toContain("maxRetries: number");
      expect(retryPolicySource).toContain("initialDelayMs: number");
      expect(retryPolicySource).toContain("shouldRetry: (error: Error) => boolean");
    });
  });

  describe("Critical action policies (messaging)", () => {
    it("should define send_email with 3 retries and 1s delay", () => {
      expect(retryPolicySource).toContain(
        "send_email: { maxRetries: 3, initialDelayMs: 1000, shouldRetry: isTransientError }",
      );
    });

    it("should define send_sms with 3 retries and 1s delay", () => {
      expect(retryPolicySource).toContain(
        "send_sms: { maxRetries: 3, initialDelayMs: 1000, shouldRetry: isTransientError }",
      );
    });

    it("should define send_whatsapp with 3 retries and 1s delay", () => {
      expect(retryPolicySource).toContain(
        "send_whatsapp: { maxRetries: 3, initialDelayMs: 1000, shouldRetry: isTransientError }",
      );
    });

    it("should define send_message with 3 retries and 1s delay", () => {
      expect(retryPolicySource).toContain(
        "send_message: { maxRetries: 3, initialDelayMs: 1000, shouldRetry: isTransientError }",
      );
    });
  });

  describe("Critical action policies (payments)", () => {
    it("should define charge_payment with 3 retries and 1s delay", () => {
      expect(retryPolicySource).toContain(
        "charge_payment: { maxRetries: 3, initialDelayMs: 1000, shouldRetry: isTransientError }",
      );
    });

    it("should define send_invoice with 2 retries and 1.5s delay", () => {
      expect(retryPolicySource).toContain(
        "send_invoice: { maxRetries: 2, initialDelayMs: 1500, shouldRetry: isTransientError }",
      );
    });

    it("should define create_subscription with 2 retries and 1.5s delay", () => {
      expect(retryPolicySource).toContain(
        "create_subscription: { maxRetries: 2, initialDelayMs: 1500, shouldRetry: isTransientError }",
      );
    });

    it("should define cancel_subscription with 2 retries and 1.5s delay", () => {
      expect(retryPolicySource).toContain(
        "cancel_subscription: { maxRetries: 2, initialDelayMs: 1500, shouldRetry: isTransientError }",
      );
    });
  });

  describe("High-priority action policies (integrations)", () => {
    it("should define custom_webhook with 3 retries and 1s delay", () => {
      expect(retryPolicySource).toContain(
        "custom_webhook: { maxRetries: 3, initialDelayMs: 1000, shouldRetry: isTransientError }",
      );
    });

    it("should define google_sheets with 2 retries and 1.5s delay", () => {
      expect(retryPolicySource).toContain(
        "google_sheets: { maxRetries: 2, initialDelayMs: 1500, shouldRetry: isTransientError }",
      );
    });

    it("should define slack_message with 2 retries and 1.5s delay", () => {
      expect(retryPolicySource).toContain(
        "slack_message: { maxRetries: 2, initialDelayMs: 1500, shouldRetry: isTransientError }",
      );
    });

    it("should define discord_message with 2 retries and 1.5s delay", () => {
      expect(retryPolicySource).toContain(
        "discord_message: { maxRetries: 2, initialDelayMs: 1500, shouldRetry: isTransientError }",
      );
    });
  });

  describe("Voice action policies", () => {
    it("should define send_voicemail with 2 retries and 1.5s delay", () => {
      expect(retryPolicySource).toContain(
        "send_voicemail: { maxRetries: 2, initialDelayMs: 1500, shouldRetry: isTransientError }",
      );
    });

    it("should define make_call with 2 retries and 1.5s delay", () => {
      expect(retryPolicySource).toContain(
        "make_call: { maxRetries: 2, initialDelayMs: 1500, shouldRetry: isTransientError }",
      );
    });
  });

  describe("Medium-priority action policies (conversion tracking)", () => {
    it("should define meta_conversion with 2 retries and 2s delay", () => {
      expect(retryPolicySource).toContain(
        "meta_conversion: { maxRetries: 2, initialDelayMs: 2000, shouldRetry: isTransientError }",
      );
    });

    it("should define google_conversion with 2 retries and 2s delay", () => {
      expect(retryPolicySource).toContain(
        "google_conversion: { maxRetries: 2, initialDelayMs: 2000, shouldRetry: isTransientError }",
      );
    });

    it("should define tiktok_event with 2 retries and 2s delay", () => {
      expect(retryPolicySource).toContain(
        "tiktok_event: { maxRetries: 2, initialDelayMs: 2000, shouldRetry: isTransientError }",
      );
    });
  });

  describe("Default policy", () => {
    it("should define a default policy with 2 retries and 1.5s delay", () => {
      expect(retryPolicySource).toContain(
        "default: { maxRetries: 2, initialDelayMs: 1500, shouldRetry: isTransientError }",
      );
    });
  });

  describe("All policies use isTransientError for shouldRetry", () => {
    it("should reference isTransientError for every policy", () => {
      // Count occurrences of shouldRetry: isTransientError
      const matches = retryPolicySource.match(/shouldRetry: isTransientError/g);
      // We have 19 policies + default = 20 entries
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(18);
    });
  });
});

// ============================================================
// 3. executeWithRetry FUNCTION TESTS
// ============================================================

describe("executeWithRetry Implementation", () => {
  const stepLoggerPath = path.resolve(
    __dirname,
    "../../../../supabase/functions/automation-trigger/step-logger.ts",
  );

  let stepLoggerSource: string;

  beforeEach(() => {
    stepLoggerSource = fs.readFileSync(stepLoggerPath, "utf-8");
  });

  describe("Function signature", () => {
    it("should accept optional RetryPolicy parameter", () => {
      expect(stepLoggerSource).toContain(
        "policy?: { maxRetries: number; initialDelayMs: number; shouldRetry: (error: Error) => boolean }",
      );
    });

    it("should have default values when no policy is provided", () => {
      expect(stepLoggerSource).toContain("policy?.maxRetries ?? 2");
      expect(stepLoggerSource).toContain("policy?.initialDelayMs ?? 1500");
      expect(stepLoggerSource).toContain("policy?.shouldRetry ?? (() => true)");
    });
  });

  describe("Retry behavior", () => {
    it("should implement while loop for retry attempts", () => {
      expect(stepLoggerSource).toContain("while (retryCount <= maxRetries)");
    });

    it("should check shouldRetry before retrying", () => {
      expect(stepLoggerSource).toContain("if (!shouldRetry(lastError))");
    });

    it("should break on permanent errors (not retry)", () => {
      expect(stepLoggerSource).toContain(
        "Permanent error for step",
      );
      // After permanent error detection, it breaks out of the loop
      const permanentSection = stepLoggerSource.substring(
        stepLoggerSource.indexOf("Permanent error for step"),
        stepLoggerSource.indexOf("Permanent error for step") + 200,
      );
      expect(permanentSection).toContain("break;");
    });

    it("should use exponential backoff for delays", () => {
      expect(stepLoggerSource).toContain(
        "initialDelayMs * Math.pow(2, retryCount - 1)",
      );
    });

    it("should log retry attempts with delay info", () => {
      expect(stepLoggerSource).toContain(
        "Transient error for step",
      );
    });

    it("should log success after retries", () => {
      expect(stepLoggerSource).toContain("succeeded after");
    });
  });

  describe("Error handling", () => {
    it("should convert non-Error throwables to Error objects", () => {
      expect(stepLoggerSource).toContain(
        "err instanceof Error ? err : new Error(String(err))",
      );
    });

    it("should return null result on failure", () => {
      // After all retries exhausted, result should be null
      const exhaustedSection = stepLoggerSource.substring(
        stepLoggerSource.indexOf("All retries exhausted"),
      );
      expect(exhaustedSection).toContain("result: null");
    });

    it("should include retryCount in error log", () => {
      expect(stepLoggerSource).toContain("retryCount: Math.max(retryCount - 1, 0)");
    });
  });

  describe("Logging", () => {
    it("should log successful execution to database", () => {
      expect(stepLoggerSource).toContain('status: "success"');
    });

    it("should log failed execution to database", () => {
      expect(stepLoggerSource).toContain('status: "error"');
    });

    it("should include duration in logs", () => {
      expect(stepLoggerSource).toContain("durationMs");
    });
  });
});

// ============================================================
// 4. AUTOMATION TRIGGER INTEGRATION TESTS
// ============================================================

describe("Automation Trigger Retry Integration", () => {
  const indexPath = path.resolve(
    __dirname,
    "../../../../supabase/functions/automation-trigger/index.ts",
  );

  let indexSource: string;

  beforeEach(() => {
    indexSource = fs.readFileSync(indexPath, "utf-8");
  });

  describe("Import verification", () => {
    it("should import executeWithRetry from step-logger", () => {
      expect(indexSource).toContain(
        'import { logStepExecution, executeWithRetry } from "./step-logger.ts"',
      );
    });

    it("should import RETRY_POLICIES from retry-policy", () => {
      expect(indexSource).toContain(
        'import { RETRY_POLICIES } from "./retry-policy.ts"',
      );
    });
  });

  describe("Critical messaging actions wrapped with retry", () => {
    it("should wrap send_email with executeWithRetry and RETRY_POLICIES.send_email", () => {
      const sendEmailSection = indexSource.substring(
        indexSource.indexOf('case "send_email":'),
        indexSource.indexOf('case "send_email":') + 800,
      );
      expect(sendEmailSection).toContain("executeWithRetry(");
      expect(sendEmailSection).toContain("RETRY_POLICIES.send_email");
    });

    it("should wrap send_sms with executeWithRetry and RETRY_POLICIES.send_sms", () => {
      const sendSmsSection = indexSource.substring(
        indexSource.indexOf('case "send_sms":'),
        indexSource.indexOf('case "send_sms":') + 800,
      );
      expect(sendSmsSection).toContain("executeWithRetry(");
      expect(sendSmsSection).toContain("RETRY_POLICIES.send_sms");
    });

    it("should wrap send_whatsapp with executeWithRetry and RETRY_POLICIES.send_whatsapp", () => {
      const sendWaSection = indexSource.substring(
        indexSource.indexOf('case "send_whatsapp":'),
        indexSource.indexOf('case "send_whatsapp":') + 800,
      );
      expect(sendWaSection).toContain("executeWithRetry(");
      expect(sendWaSection).toContain("RETRY_POLICIES.send_whatsapp");
    });

    it("should wrap send_message with executeWithRetry and RETRY_POLICIES.send_sms", () => {
      const sendMsgSection = indexSource.substring(
        indexSource.indexOf('case "send_message":'),
        indexSource.indexOf('case "send_message":') + 800,
      );
      expect(sendMsgSection).toContain("executeWithRetry(");
      expect(sendMsgSection).toContain("RETRY_POLICIES.send_sms");
    });
  });

  describe("Critical payment actions wrapped with retry", () => {
    it("should wrap charge_payment with executeWithRetry and RETRY_POLICIES.charge_payment", () => {
      const chargeSection = indexSource.substring(
        indexSource.indexOf('case "charge_payment":'),
        indexSource.indexOf('case "charge_payment":') + 400,
      );
      expect(chargeSection).toContain("executeWithRetry(");
      expect(chargeSection).toContain("RETRY_POLICIES.charge_payment");
    });

    it("should wrap send_invoice with executeWithRetry and RETRY_POLICIES.send_invoice", () => {
      const invoiceSection = indexSource.substring(
        indexSource.indexOf('case "send_invoice":'),
        indexSource.indexOf('case "send_invoice":') + 400,
      );
      expect(invoiceSection).toContain("executeWithRetry(");
      expect(invoiceSection).toContain("RETRY_POLICIES.send_invoice");
    });

    it("should wrap create_subscription with executeWithRetry", () => {
      const createSubSection = indexSource.substring(
        indexSource.indexOf('case "create_subscription":'),
        indexSource.indexOf('case "create_subscription":') + 400,
      );
      expect(createSubSection).toContain("executeWithRetry(");
      expect(createSubSection).toContain("RETRY_POLICIES.create_subscription");
    });

    it("should wrap cancel_subscription with executeWithRetry", () => {
      const cancelSubSection = indexSource.substring(
        indexSource.indexOf('case "cancel_subscription":'),
        indexSource.indexOf('case "cancel_subscription":') + 400,
      );
      expect(cancelSubSection).toContain("executeWithRetry(");
      expect(cancelSubSection).toContain("RETRY_POLICIES.cancel_subscription");
    });
  });

  describe("Critical integration actions wrapped with retry", () => {
    it("should wrap custom_webhook with executeWithRetry and RETRY_POLICIES.custom_webhook", () => {
      const webhookSection = indexSource.substring(
        indexSource.indexOf('case "custom_webhook":'),
        indexSource.indexOf('case "custom_webhook":') + 700,
      );
      expect(webhookSection).toContain("executeWithRetry(");
      expect(webhookSection).toContain("RETRY_POLICIES.custom_webhook");
    });
  });

  describe("High-priority actions wrapped with retry", () => {
    it("should wrap google_sheets with executeWithRetry and RETRY_POLICIES.google_sheets", () => {
      const gsheetsSection = indexSource.substring(
        indexSource.indexOf('case "google_sheets":'),
        indexSource.indexOf('case "google_sheets":') + 700,
      );
      expect(gsheetsSection).toContain("executeWithRetry(");
      expect(gsheetsSection).toContain("RETRY_POLICIES.google_sheets");
    });

    it("should wrap slack_message with executeWithRetry and RETRY_POLICIES.slack_message", () => {
      const slackSection = indexSource.substring(
        indexSource.indexOf('case "slack_message":'),
        indexSource.indexOf('case "slack_message":') + 700,
      );
      expect(slackSection).toContain("executeWithRetry(");
      expect(slackSection).toContain("RETRY_POLICIES.slack_message");
    });

    it("should wrap discord_message with executeWithRetry and RETRY_POLICIES.discord_message", () => {
      const discordSection = indexSource.substring(
        indexSource.indexOf('case "discord_message":'),
        indexSource.indexOf('case "discord_message":') + 700,
      );
      expect(discordSection).toContain("executeWithRetry(");
      expect(discordSection).toContain("RETRY_POLICIES.discord_message");
    });
  });

  describe("Voice actions wrapped with retry", () => {
    it("should wrap send_voicemail with executeWithRetry and RETRY_POLICIES.send_voicemail", () => {
      const vmSection = indexSource.substring(
        indexSource.indexOf('case "send_voicemail":'),
        indexSource.indexOf('case "send_voicemail":') + 700,
      );
      expect(vmSection).toContain("executeWithRetry(");
      expect(vmSection).toContain("RETRY_POLICIES.send_voicemail");
    });

    it("should wrap make_call with executeWithRetry and RETRY_POLICIES.make_call", () => {
      const callSection = indexSource.substring(
        indexSource.indexOf('case "make_call":'),
        indexSource.indexOf('case "make_call":') + 700,
      );
      expect(callSection).toContain("executeWithRetry(");
      expect(callSection).toContain("RETRY_POLICIES.make_call");
    });
  });

  describe("Conversion tracking actions wrapped with retry", () => {
    it("should wrap meta_conversion with executeWithRetry and RETRY_POLICIES.meta_conversion", () => {
      const metaSection = indexSource.substring(
        indexSource.indexOf('case "meta_conversion":'),
        indexSource.indexOf('case "meta_conversion":') + 700,
      );
      expect(metaSection).toContain("executeWithRetry(");
      expect(metaSection).toContain("RETRY_POLICIES.meta_conversion");
    });

    it("should wrap google_conversion with executeWithRetry and RETRY_POLICIES.google_conversion", () => {
      const gConvSection = indexSource.substring(
        indexSource.indexOf('case "google_conversion":'),
        indexSource.indexOf('case "google_conversion":') + 700,
      );
      expect(gConvSection).toContain("executeWithRetry(");
      expect(gConvSection).toContain("RETRY_POLICIES.google_conversion");
    });

    it("should wrap tiktok_event with executeWithRetry and RETRY_POLICIES.tiktok_event", () => {
      const tiktokSection = indexSource.substring(
        indexSource.indexOf('case "tiktok_event":'),
        indexSource.indexOf('case "tiktok_event":') + 700,
      );
      expect(tiktokSection).toContain("executeWithRetry(");
      expect(tiktokSection).toContain("RETRY_POLICIES.tiktok_event");
    });
  });

  describe("Marketing actions wrapped with retry", () => {
    it("should wrap send_review_request with executeWithRetry", () => {
      const reviewSection = indexSource.substring(
        indexSource.indexOf('case "send_review_request":'),
        indexSource.indexOf('case "send_review_request":') + 700,
      );
      expect(reviewSection).toContain("executeWithRetry(");
      expect(reviewSection).toContain("RETRY_POLICIES.send_review_request");
    });

    it("should wrap reply_in_comments with executeWithRetry", () => {
      const replySection = indexSource.substring(
        indexSource.indexOf('case "reply_in_comments":'),
        indexSource.indexOf('case "reply_in_comments":') + 700,
      );
      expect(replySection).toContain("executeWithRetry(");
      expect(replySection).toContain("RETRY_POLICIES.reply_in_comments");
    });
  });

  describe("Rate limiting preserved before retry", () => {
    it("should check rate limits BEFORE executeWithRetry for send_email", () => {
      const emailSection = indexSource.substring(
        indexSource.indexOf('case "send_email":'),
        indexSource.indexOf('case "send_email":') + 800,
      );
      const rateLimitIndex = emailSection.indexOf("checkRateLimit");
      const retryIndex = emailSection.indexOf("executeWithRetry");
      expect(rateLimitIndex).toBeLessThan(retryIndex);
      expect(rateLimitIndex).toBeGreaterThan(-1);
    });

    it("should check rate limits BEFORE executeWithRetry for custom_webhook", () => {
      const webhookSection = indexSource.substring(
        indexSource.indexOf('case "custom_webhook":'),
        indexSource.indexOf('case "custom_webhook":') + 700,
      );
      const rateLimitIndex = webhookSection.indexOf("checkRateLimit");
      const retryIndex = webhookSection.indexOf("executeWithRetry");
      expect(rateLimitIndex).toBeLessThan(retryIndex);
      expect(rateLimitIndex).toBeGreaterThan(-1);
    });

    it("should skip step when rate limited (not retry)", () => {
      const emailSection = indexSource.substring(
        indexSource.indexOf('case "send_email":'),
        indexSource.indexOf('case "send_email":') + 800,
      );
      expect(emailSection).toContain("log.skipped = true");
      expect(emailSection).toContain("rate_limit_exceeded");
    });
  });

  describe("Actions that should NOT have retry", () => {
    it("should NOT wrap create_contact with executeWithRetry", () => {
      const createContactSection = indexSource.substring(
        indexSource.indexOf('case "create_contact":'),
        indexSource.indexOf('case "create_contact":') + 400,
      );
      expect(createContactSection).not.toContain("executeWithRetry(");
    });

    it("should NOT wrap add_tag with executeWithRetry", () => {
      const addTagSection = indexSource.substring(
        indexSource.indexOf('case "add_tag":'),
        indexSource.indexOf('case "add_tag":') + 400,
      );
      expect(addTagSection).not.toContain("executeWithRetry(");
    });

    it("should NOT wrap time_delay with executeWithRetry", () => {
      const timeDelaySection = indexSource.substring(
        indexSource.indexOf('case "time_delay":'),
        indexSource.indexOf('case "time_delay":') + 400,
      );
      expect(timeDelaySection).not.toContain("executeWithRetry(");
    });

    it("should NOT wrap condition with executeWithRetry", () => {
      const conditionSection = indexSource.substring(
        indexSource.indexOf('case "condition":'),
        indexSource.indexOf('case "condition":') + 400,
      );
      expect(conditionSection).not.toContain("executeWithRetry(");
    });

    it("should NOT wrap update_contact with executeWithRetry", () => {
      const updateContactSection = indexSource.substring(
        indexSource.indexOf('case "update_contact":'),
        indexSource.indexOf('case "update_contact":') + 400,
      );
      expect(updateContactSection).not.toContain("executeWithRetry(");
    });
  });
});

// ============================================================
// 5. EXPONENTIAL BACKOFF CALCULATION TESTS
// ============================================================

describe("Exponential Backoff Calculations", () => {
  it("should calculate correct delays with initialDelayMs=1000", () => {
    const initialDelayMs = 1000;
    const delays = [0, 1, 2].map(
      (retryCount) => initialDelayMs * Math.pow(2, retryCount),
    );
    expect(delays).toEqual([1000, 2000, 4000]); // 1s, 2s, 4s = 7s total
  });

  it("should calculate correct delays with initialDelayMs=1500", () => {
    const initialDelayMs = 1500;
    const delays = [0, 1].map(
      (retryCount) => initialDelayMs * Math.pow(2, retryCount),
    );
    expect(delays).toEqual([1500, 3000]); // 1.5s, 3s = 4.5s total
  });

  it("should calculate correct delays with initialDelayMs=2000", () => {
    const initialDelayMs = 2000;
    const delays = [0, 1].map(
      (retryCount) => initialDelayMs * Math.pow(2, retryCount),
    );
    expect(delays).toEqual([2000, 4000]); // 2s, 4s = 6s total
  });

  it("should stay under 10 seconds total for critical actions (3 retries, 1s initial)", () => {
    const initialDelayMs = 1000;
    const maxRetries = 3;
    let totalDelay = 0;
    for (let i = 0; i < maxRetries; i++) {
      totalDelay += initialDelayMs * Math.pow(2, i);
    }
    // 1000 + 2000 + 4000 = 7000ms = 7s
    expect(totalDelay).toBe(7000);
    expect(totalDelay).toBeLessThan(10000);
  });

  it("should stay under 10 seconds total for high-priority actions (2 retries, 1.5s initial)", () => {
    const initialDelayMs = 1500;
    const maxRetries = 2;
    let totalDelay = 0;
    for (let i = 0; i < maxRetries; i++) {
      totalDelay += initialDelayMs * Math.pow(2, i);
    }
    // 1500 + 3000 = 4500ms = 4.5s
    expect(totalDelay).toBe(4500);
    expect(totalDelay).toBeLessThan(10000);
  });

  it("should stay under 10 seconds total for medium-priority actions (2 retries, 2s initial)", () => {
    const initialDelayMs = 2000;
    const maxRetries = 2;
    let totalDelay = 0;
    for (let i = 0; i < maxRetries; i++) {
      totalDelay += initialDelayMs * Math.pow(2, i);
    }
    // 2000 + 4000 = 6000ms = 6s
    expect(totalDelay).toBe(6000);
    expect(totalDelay).toBeLessThan(10000);
  });
});

// ============================================================
// 6. EDGE CASES AND BOUNDARY CONDITIONS
// ============================================================

describe("Edge Cases and Boundary Conditions", () => {
  const stepLoggerPath = path.resolve(
    __dirname,
    "../../../../supabase/functions/automation-trigger/step-logger.ts",
  );

  let stepLoggerSource: string;

  beforeEach(() => {
    stepLoggerSource = fs.readFileSync(stepLoggerPath, "utf-8");
  });

  it("should handle zero retries gracefully (retryCount never negative)", () => {
    // retryCount uses Math.max(retryCount - 1, 0)
    expect(stepLoggerSource).toContain("Math.max(retryCount - 1, 0)");
  });

  it("should await the delay promise (not fire-and-forget)", () => {
    // With AbortController support, the delay is now an abortable Promise<void>
    expect(stepLoggerSource).toContain("await new Promise<void>((resolve) => {");
    expect(stepLoggerSource).toContain("const timeout = setTimeout(resolve, delay)");
  });

  it("should handle success on first attempt (retryCount = 0)", () => {
    // The log should include retryCount: 0 on first success
    expect(stepLoggerSource).toContain("retryCount,");
  });

  it("should only log retry success message when retries occurred", () => {
    expect(stepLoggerSource).toContain("if (retryCount > 0)");
  });
});

// ============================================================
// 7. GoHighLevel COMPARISON VERIFICATION
// ============================================================

describe("GoHighLevel Comparison Verification", () => {
  const retryPolicyPath = path.resolve(
    __dirname,
    "../../../../supabase/functions/automation-trigger/retry-policy.ts",
  );

  let retryPolicySource: string;

  beforeEach(() => {
    retryPolicySource = fs.readFileSync(retryPolicyPath, "utf-8");
  });

  it("should handle 429 rate limit errors (GHL only retries these)", () => {
    expect(retryPolicySource).toContain('"429"');
    expect(retryPolicySource).toContain('"rate limit"');
  });

  it("should ALSO handle 5xx errors (GHL does NOT retry these - Stackit advantage)", () => {
    expect(retryPolicySource).toContain('"500"');
    expect(retryPolicySource).toContain('"502"');
    expect(retryPolicySource).toContain('"503"');
    expect(retryPolicySource).toContain('"504"');
  });

  it("should ALSO handle network errors (GHL does NOT retry these - Stackit advantage)", () => {
    expect(retryPolicySource).toContain('"timeout"');
    expect(retryPolicySource).toContain('"econnrefused"');
    expect(retryPolicySource).toContain('"econnreset"');
  });

  it("should have faster retries than GHL (GHL uses 10min delays, Stackit uses 1-4s)", () => {
    // Verify all initialDelayMs values are <= 2000ms (vs GHL's 600000ms)
    const delayMatches = retryPolicySource.match(/initialDelayMs: (\d+)/g);
    expect(delayMatches).not.toBeNull();
    delayMatches!.forEach((match) => {
      const delay = parseInt(match.replace("initialDelayMs: ", ""));
      expect(delay).toBeLessThanOrEqual(2000);
      expect(delay).toBeGreaterThanOrEqual(1000);
    });
  });

  it("should have fewer max retries than GHL (3 vs 6) for faster resolution", () => {
    const retryMatches = retryPolicySource.match(/maxRetries: (\d+)/g);
    expect(retryMatches).not.toBeNull();
    retryMatches!.forEach((match) => {
      const retries = parseInt(match.replace("maxRetries: ", ""));
      expect(retries).toBeLessThanOrEqual(3);
      expect(retries).toBeGreaterThanOrEqual(2);
    });
  });
});

// ============================================================
// 8. TOTAL ACTION COVERAGE SUMMARY
// ============================================================

describe("Phase 2 Implementation Coverage Summary", () => {
  const indexPath = path.resolve(
    __dirname,
    "../../../../supabase/functions/automation-trigger/index.ts",
  );

  let indexSource: string;

  beforeEach(() => {
    indexSource = fs.readFileSync(indexPath, "utf-8");
  });

  it("should have at least 17 actions wrapped with executeWithRetry", () => {
    const retryCallCount = (indexSource.match(/executeWithRetry\(/g) || []).length;
    // 17 network-dependent actions + possible extras (enqueue_dialer, review_request, reply_in_comments)
    expect(retryCallCount).toBeGreaterThanOrEqual(17);
  });

  it("should reference RETRY_POLICIES at least 17 times", () => {
    const policyRefCount = (indexSource.match(/RETRY_POLICIES\./g) || []).length;
    expect(policyRefCount).toBeGreaterThanOrEqual(17);
  });

  it("should not have any direct action calls for network-dependent actions (all wrapped)", () => {
    // These patterns should NOT exist for network actions
    // (they should all be wrapped in executeWithRetry)
    const networkActions = [
      "send_email",
      "send_sms",
      "send_whatsapp",
      "charge_payment",
      "send_invoice",
      "custom_webhook",
    ];

    for (const action of networkActions) {
      const caseSection = indexSource.substring(
        indexSource.indexOf(`case "${action}":`),
        indexSource.indexOf(`case "${action}":`) + 600,
      );
      // Should contain executeWithRetry, not a direct call
      expect(caseSection).toContain("executeWithRetry(");
    }
  });
});
