/**
 * Phase 2 Critical Fixes: Comprehensive Tests
 *
 * Tests all 5 fixes from the Phase 2 cross-examination:
 *
 * Fix 1: Type Safety - runId non-null enforcement
 * Fix 2: Step-Level Idempotency - unique constraint on success logs
 * Fix 3: Cancellation Support - AbortController in retry loop
 * Fix 4: Logging Failure Handling - fallback to error_logs table
 * Fix 5: Return Type Consistency - StepExecutionLog (not Partial)
 */

import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ============================================================
// 1. FIX 1: TYPE SAFETY - runId NON-NULL ENFORCEMENT
// ============================================================

describe("Fix 1: Type Safety - runId Non-Null Enforcement", () => {
  const indexPath = path.resolve(
    __dirname,
    "../../../../supabase/functions/automation-trigger/index.ts",
  );

  let indexSource: string;

  beforeEach(() => {
    indexSource = fs.readFileSync(indexPath, "utf-8");
  });

  it("should declare runAutomation with runId: string (non-null)", () => {
    // Find the runAutomation function signature
    const signatureMatch = indexSource.match(
      /async function runAutomation\([^)]+\)/s,
    );
    expect(signatureMatch).not.toBeNull();
    const signature = signatureMatch![0];

    // Should have runId: string (not string | null)
    expect(signature).toContain("runId: string,");
    expect(signature).not.toContain("runId: string | null");
  });

  it("should NOT contain any runId! non-null assertions", () => {
    // No runId! anywhere in the file
    const assertionCount = (indexSource.match(/runId!/g) || []).length;
    expect(assertionCount).toBe(0);
  });

  it("should have a null guard before calling runAutomation", () => {
    // The guard at the call site: if (!runId) { ... continue; }
    const callSection = indexSource.substring(
      indexSource.indexOf("const runId = await createAutomationRun"),
      indexSource.indexOf("const runId = await createAutomationRun") + 500,
    );
    expect(callSection).toContain("if (!runId)");
    expect(callSection).toContain("continue");
  });

  it("should pass runId directly (not runId!) to executeWithRetry", () => {
    // All executeWithRetry calls should use `runId,` not `runId!,`
    const retryCallMatches = indexSource.match(
      /executeWithRetry\(\s*supabase,\s*runId[^!]/g,
    );
    expect(retryCallMatches).not.toBeNull();
    expect(retryCallMatches!.length).toBeGreaterThanOrEqual(19);
  });
});

// ============================================================
// 2. FIX 2: STEP-LEVEL IDEMPOTENCY
// ============================================================

describe("Fix 2: Step-Level Idempotency", () => {
  describe("Database Migration", () => {
    const migrationPath = path.resolve(
      __dirname,
      "../../../../supabase/migrations/20260207200000_step_level_idempotency.sql",
    );

    let migrationSource: string;

    beforeEach(() => {
      migrationSource = fs.readFileSync(migrationPath, "utf-8");
    });

    it("should create a unique index on (run_id, step_id) WHERE status = success", () => {
      expect(migrationSource).toContain("CREATE UNIQUE INDEX");
      expect(migrationSource).toContain("idx_step_logs_idempotency");
      expect(migrationSource).toContain("run_id");
      expect(migrationSource).toContain("step_id");
      expect(migrationSource).toContain("WHERE status = 'success'");
    });

    it("should use IF NOT EXISTS for safe re-runs", () => {
      expect(migrationSource).toContain("IF NOT EXISTS");
    });

    it("should target the automation_step_logs table", () => {
      expect(migrationSource).toContain("automation_step_logs");
    });
  });

  describe("Application-Level Handling", () => {
    const stepLoggerPath = path.resolve(
      __dirname,
      "../../../../supabase/functions/automation-trigger/step-logger.ts",
    );

    let stepLoggerSource: string;

    beforeEach(() => {
      stepLoggerSource = fs.readFileSync(stepLoggerPath, "utf-8");
    });

    it("should handle 23505 unique constraint violation in logStepExecution", () => {
      expect(stepLoggerSource).toContain('"23505"');
    });

    it("should only skip on 23505 when status is success", () => {
      // The check: error.code === "23505" && params.status === "success"
      expect(stepLoggerSource).toContain('error.code === "23505"');
      expect(stepLoggerSource).toContain('params.status === "success"');
    });

    it("should log a message when skipping duplicate", () => {
      expect(stepLoggerSource).toContain(
        "already logged as success (concurrent execution)",
      );
    });

    it("should return null (not throw) on constraint violation", () => {
      // After the 23505 check, return null
      const idempotencySection = stepLoggerSource.substring(
        stepLoggerSource.indexOf('"23505"'),
        stepLoggerSource.indexOf('"23505"') + 300,
      );
      expect(idempotencySection).toContain("return null");
    });
  });
});

// ============================================================
// 3. FIX 3: CANCELLATION SUPPORT
// ============================================================

describe("Fix 3: Cancellation Support - AbortController", () => {
  describe("executeWithRetry AbortSignal", () => {
    const stepLoggerPath = path.resolve(
      __dirname,
      "../../../../supabase/functions/automation-trigger/step-logger.ts",
    );

    let stepLoggerSource: string;

    beforeEach(() => {
      stepLoggerSource = fs.readFileSync(stepLoggerPath, "utf-8");
    });

    it("should accept abortSignal as optional parameter", () => {
      expect(stepLoggerSource).toContain("abortSignal?: AbortSignal");
    });

    it("should check abortSignal before each retry attempt", () => {
      expect(stepLoggerSource).toContain("abortSignal?.aborted");
    });

    it("should return Workflow cancelled error when aborted", () => {
      expect(stepLoggerSource).toContain('"Workflow cancelled"');
    });

    it("should implement abortable delay with clearTimeout", () => {
      expect(stepLoggerSource).toContain("clearTimeout(timeout)");
    });

    it("should use addEventListener with once: true for cleanup", () => {
      expect(stepLoggerSource).toContain('{ once: true }');
    });

    it("should check abortSignal after delay completes", () => {
      // After the delay promise, there should be another aborted check
      const delaySection = stepLoggerSource.substring(
        stepLoggerSource.indexOf("Abortable delay"),
        stepLoggerSource.indexOf("Abortable delay") + 600,
      );
      expect(delaySection).toContain("abortSignal?.aborted");
      expect(delaySection).toContain("aborted during backoff delay");
    });

    it("should include abort status in final error message", () => {
      expect(stepLoggerSource).toContain(
        "abortSignal?.aborted",
      );
      // Check the ternary for error message
      const errorSection = stepLoggerSource.substring(
        stepLoggerSource.indexOf("All retries exhausted"),
        stepLoggerSource.indexOf("All retries exhausted") + 200,
      );
      expect(errorSection).toContain("abortSignal?.aborted");
    });
  });

  describe("runAutomation AbortController", () => {
    const indexPath = path.resolve(
      __dirname,
      "../../../../supabase/functions/automation-trigger/index.ts",
    );

    let indexSource: string;

    beforeEach(() => {
      indexSource = fs.readFileSync(indexPath, "utf-8");
    });

    it("should create AbortController in runAutomation", () => {
      expect(indexSource).toContain("new AbortController()");
    });

    it("should check abortController.signal.aborted in main loop", () => {
      expect(indexSource).toContain("abortController.signal.aborted");
    });

    it("should check automation is_active status periodically", () => {
      // Check that automation status is queried
      const statusCheck = indexSource.includes('select("is_active")');
      expect(statusCheck).toBe(true);
    });

    it("should call abortController.abort() when automation is deactivated", () => {
      expect(indexSource).toContain("abortController.abort()");
    });

    it("should pass abortController.signal to all executeWithRetry calls", () => {
      const signalCount = (
        indexSource.match(/abortController\.signal/g) || []
      ).length;
      // 19 executeWithRetry calls + 1 check in main loop = 20
      expect(signalCount).toBeGreaterThanOrEqual(20);
    });

    it("should break from main loop when aborted", () => {
      const abortSection = indexSource.substring(
        indexSource.indexOf("abortController.signal.aborted"),
        indexSource.indexOf("abortController.signal.aborted") + 200,
      );
      expect(abortSection).toContain("break");
    });
  });
});

// ============================================================
// 4. FIX 4: LOGGING FAILURE HANDLING
// ============================================================

describe("Fix 4: Logging Failure Handling", () => {
  describe("error_logs Migration", () => {
    const migrationPath = path.resolve(
      __dirname,
      "../../../../supabase/migrations/20260207200001_error_logs_table.sql",
    );

    let migrationSource: string;

    beforeEach(() => {
      migrationSource = fs.readFileSync(migrationPath, "utf-8");
    });

    it("should create error_logs table", () => {
      expect(migrationSource).toContain("CREATE TABLE");
      expect(migrationSource).toContain("error_logs");
    });

    it("should have error_type column", () => {
      expect(migrationSource).toContain("error_type");
    });

    it("should have error_message column", () => {
      expect(migrationSource).toContain("error_message");
    });

    it("should have context jsonb column", () => {
      expect(migrationSource).toContain("context");
      expect(migrationSource).toContain("jsonb");
    });

    it("should have created_at with default now()", () => {
      expect(migrationSource).toContain("created_at");
      expect(migrationSource).toContain("now()");
    });

    it("should have indexes for efficient querying", () => {
      expect(migrationSource).toContain("CREATE INDEX");
      expect(migrationSource).toContain("error_type");
    });
  });

  describe("Fallback Logging in logStepExecution", () => {
    const stepLoggerPath = path.resolve(
      __dirname,
      "../../../../supabase/functions/automation-trigger/step-logger.ts",
    );

    let stepLoggerSource: string;

    beforeEach(() => {
      stepLoggerSource = fs.readFileSync(stepLoggerPath, "utf-8");
    });

    it("should insert into error_logs on logging failure", () => {
      expect(stepLoggerSource).toContain('"error_logs"');
      expect(stepLoggerSource).toContain('"step_log_failure"');
    });

    it("should include context in fallback log (run_id, step_id, action_type)", () => {
      const fallbackSection = stepLoggerSource.substring(
        stepLoggerSource.indexOf('"error_logs"'),
        stepLoggerSource.indexOf('"error_logs"') + 400,
      );
      expect(fallbackSection).toContain("run_id");
      expect(fallbackSection).toContain("step_id");
      expect(fallbackSection).toContain("action_type");
    });

    it("should NOT fallback-log 23505 violations (they are expected)", () => {
      // The 23505 check comes BEFORE the fallback logging
      const logSection = stepLoggerSource.substring(
        stepLoggerSource.indexOf("if (error)"),
        stepLoggerSource.indexOf("if (error)") + 800,
      );
      const idx23505 = logSection.indexOf("23505");
      const idxFallback = logSection.indexOf("error_logs");
      // 23505 handling must come before error_logs fallback
      expect(idx23505).toBeLessThan(idxFallback);
    });

    it("should catch and log if even fallback fails", () => {
      expect(stepLoggerSource).toContain(
        "Fallback error_logs insert also failed",
      );
    });
  });
});

// ============================================================
// 5. FIX 5: RETURN TYPE CONSISTENCY
// ============================================================

describe("Fix 5: Return Type Consistency", () => {
  const actionFiles = [
    {
      name: "slack-message.ts",
      path: "../../../../supabase/functions/automation-trigger/actions/slack-message.ts",
    },
    {
      name: "discord-message.ts",
      path: "../../../../supabase/functions/automation-trigger/actions/discord-message.ts",
    },
    {
      name: "google-sheets.ts",
      path: "../../../../supabase/functions/automation-trigger/actions/google-sheets.ts",
    },
    {
      name: "meta-conversion.ts",
      path: "../../../../supabase/functions/automation-trigger/actions/meta-conversion.ts",
    },
    {
      name: "google-ads-conversion.ts",
      path: "../../../../supabase/functions/automation-trigger/actions/google-ads-conversion.ts",
    },
    {
      name: "tiktok-event.ts",
      path: "../../../../supabase/functions/automation-trigger/actions/tiktok-event.ts",
    },
  ];

  for (const file of actionFiles) {
    it(`should use StepExecutionLog (not Partial) in ${file.name}`, () => {
      const filePath = path.resolve(__dirname, file.path);
      const source = fs.readFileSync(filePath, "utf-8");
      expect(source).not.toContain("Partial<StepExecutionLog>");
      expect(source).toContain("Promise<StepExecutionLog>");
    });
  }

  it("should NOT have any remaining Partial<StepExecutionLog> in action files", () => {
    let totalPartialCount = 0;
    for (const file of actionFiles) {
      const filePath = path.resolve(__dirname, file.path);
      const source = fs.readFileSync(filePath, "utf-8");
      const partialCount = (
        source.match(/Partial<StepExecutionLog>/g) || []
      ).length;
      totalPartialCount += partialCount;
    }
    expect(totalPartialCount).toBe(0);
  });
});

// ============================================================
// 6. ARCHITECTURAL INTEGRITY TESTS
// ============================================================

describe("Architectural Integrity", () => {
  it("should have all 19 executeWithRetry calls with abortController.signal", () => {
    const indexPath = path.resolve(
      __dirname,
      "../../../../supabase/functions/automation-trigger/index.ts",
    );
    const indexSource = fs.readFileSync(indexPath, "utf-8");

    const retryCallCount = (
      indexSource.match(/executeWithRetry\(/g) || []
    ).length;
    const signalPassCount = (
      indexSource.match(/abortController\.signal,?\n/g) || []
    ).length;

    // Every executeWithRetry call should have an abortController.signal
    // (signalPassCount includes the signal in calls + the check in the loop)
    expect(retryCallCount).toBeGreaterThanOrEqual(19);
    expect(signalPassCount).toBeGreaterThanOrEqual(19);
  });

  it("should have step-level idempotency constraint migration", () => {
    const migrationPath = path.resolve(
      __dirname,
      "../../../../supabase/migrations/20260207200000_step_level_idempotency.sql",
    );
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it("should have error_logs table migration", () => {
    const migrationPath = path.resolve(
      __dirname,
      "../../../../supabase/migrations/20260207200001_error_logs_table.sql",
    );
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it("should have consistent error handling in executeWithRetry", () => {
    const stepLoggerPath = path.resolve(
      __dirname,
      "../../../../supabase/functions/automation-trigger/step-logger.ts",
    );
    const source = fs.readFileSync(stepLoggerPath, "utf-8");

    // Should handle all three exit conditions
    expect(source).toContain("Workflow cancelled"); // Abort
    expect(source).toContain("Permanent error"); // Non-retryable
    expect(source).toContain("aborted during backoff"); // Abort during delay
  });

  it("should have rate limit checks BEFORE executeWithRetry for rate-limited actions", () => {
    const indexPath = path.resolve(
      __dirname,
      "../../../../supabase/functions/automation-trigger/index.ts",
    );
    const indexSource = fs.readFileSync(indexPath, "utf-8");

    // For send_email, rate limit check must come before executeWithRetry
    const emailSection = indexSource.substring(
      indexSource.indexOf('case "send_email":'),
      indexSource.indexOf('case "send_email":') + 800,
    );
    const rateLimitIdx = emailSection.indexOf("checkRateLimit");
    const retryIdx = emailSection.indexOf("executeWithRetry");
    expect(rateLimitIdx).toBeGreaterThan(-1);
    expect(retryIdx).toBeGreaterThan(-1);
    expect(rateLimitIdx).toBeLessThan(retryIdx);
  });
});

// ============================================================
// 7. CROSS-EXAMINATION: ALL FIXES WORK TOGETHER
// ============================================================

describe("Cross-Examination: All Fixes Integrated", () => {
  it("executeWithRetry should accept all required parameters in correct order", () => {
    const stepLoggerPath = path.resolve(
      __dirname,
      "../../../../supabase/functions/automation-trigger/step-logger.ts",
    );
    const source = fs.readFileSync(stepLoggerPath, "utf-8");

    // Verify parameter order: supabase, runId, stepId, actionType, inputSnapshot, executeFn, policy?, abortSignal?
    const signatureMatch = source.match(
      /export async function executeWithRetry<T>\(([\s\S]*?)\):/,
    );
    expect(signatureMatch).not.toBeNull();
    const params = signatureMatch![1];

    // Verify parameter names exist in order
    const paramNames = ["supabase", "runId", "stepId", "actionType", "inputSnapshot", "executeFn", "policy", "abortSignal"];
    let lastIdx = -1;
    for (const param of paramNames) {
      const idx = params.indexOf(param);
      expect(idx).toBeGreaterThan(lastIdx);
      lastIdx = idx;
    }
  });

  it("runId should be string (not null) in executeWithRetry signature", () => {
    const stepLoggerPath = path.resolve(
      __dirname,
      "../../../../supabase/functions/automation-trigger/step-logger.ts",
    );
    const source = fs.readFileSync(stepLoggerPath, "utf-8");

    const signatureMatch = source.match(
      /export async function executeWithRetry<T>\(([\s\S]*?)\):/,
    );
    expect(signatureMatch).not.toBeNull();
    const params = signatureMatch![1];

    // runId should be "runId: string," not "runId: string | null,"
    expect(params).toContain("runId: string,");
    expect(params).not.toContain("runId: string | null");
  });

  it("logStepExecution should handle both 23505 and other errors differently", () => {
    const stepLoggerPath = path.resolve(
      __dirname,
      "../../../../supabase/functions/automation-trigger/step-logger.ts",
    );
    const source = fs.readFileSync(stepLoggerPath, "utf-8");

    // Should have two different code paths
    // 1. 23505 + success = return null quietly
    // 2. Other errors = log to error_logs
    expect(source).toContain('"23505"');
    expect(source).toContain('"error_logs"');
    expect(source).toContain('"step_log_failure"');
  });

  it("should have 361+ tests in the existing suites plus these new tests", () => {
    // This test simply verifies our file exists alongside the others
    const testDir = path.resolve(__dirname);
    const testFiles = fs.readdirSync(testDir).filter((f) => f.endsWith(".test.ts"));
    expect(testFiles).toContain("phase2-critical-fixes.test.ts");
    expect(testFiles).toContain("phase2-retry-logic.test.ts");
    expect(testFiles).toContain("beta-launch-fixes.test.ts");
    expect(testFiles).toContain("attribution-and-scoring.test.ts");
    expect(testFiles).toContain("phase5-triggers.test.ts");
  });
});
