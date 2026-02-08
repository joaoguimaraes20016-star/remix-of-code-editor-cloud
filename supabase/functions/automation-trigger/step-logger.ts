// supabase/functions/automation-trigger/step-logger.ts

import type { ActionType, StepExecutionLog } from "./types.ts";

interface StepLogParams {
  runId: string;
  stepId: string;
  actionType: ActionType;
  status: "running" | "success" | "error" | "skipped";
  inputSnapshot?: Record<string, any>;
  outputSnapshot?: Record<string, any>;
  errorMessage?: string;
  skipReason?: string;
  retryCount?: number;
  durationMs?: number;
}

/**
 * Logs individual step execution to automation_step_logs table.
 *
 * Handles 23505 unique constraint violations gracefully for idempotency:
 * if a 'success' log already exists for the same (run_id, step_id), the
 * duplicate is silently ignored (concurrent retry already succeeded).
 */
export async function logStepExecution(supabase: any, params: StepLogParams): Promise<string | null> {
  try {
    const startedAt = new Date().toISOString();
    const completedAt = params.status !== "running" ? startedAt : null;

    const { data, error } = await supabase
      .from("automation_step_logs")
      .insert([
        {
          run_id: params.runId,
          step_id: params.stepId,
          action_type: params.actionType,
          status: params.status,
          started_at: startedAt,
          completed_at: completedAt,
          duration_ms: params.durationMs || null,
          input_snapshot: params.inputSnapshot || null,
          output_snapshot: params.outputSnapshot || null,
          error_message: params.errorMessage || null,
          skip_reason: params.skipReason || null,
          retry_count: params.retryCount || 0,
        },
      ])
      .select("id")
      .single();

    if (error) {
      // Handle step-level idempotency constraint violation (23505)
      // This means a concurrent retry already logged this step as 'success'
      if (error.code === "23505" && params.status === "success") {
        console.log(
          `[step-logger] Step ${params.stepId} already logged as success (concurrent execution), skipping duplicate`,
        );
        return null; // Not an error - another retry already succeeded
      }

      // Fallback: log the logging failure to error_logs table
      console.error("[step-logger] Failed to log step:", error);
      try {
        await supabase.from("error_logs").insert([
          {
            error_type: "step_log_failure",
            error_message: error.message || String(error),
            context: {
              run_id: params.runId,
              step_id: params.stepId,
              action_type: params.actionType,
              status: params.status,
              retry_count: params.retryCount || 0,
              error_code: error.code,
            },
          },
        ]);
      } catch {
        // If even fallback logging fails, just console.error
        console.error("[step-logger] Fallback error_logs insert also failed");
      }
      return null;
    }

    return data?.id || null;
  } catch (err) {
    console.error("[step-logger] Exception logging step:", err);
    return null;
  }
}

/**
 * Updates an existing step log (e.g., when step completes)
 */
export async function updateStepLog(
  supabase: any,
  logId: string,
  updates: {
    status: "success" | "error" | "skipped";
    outputSnapshot?: Record<string, any>;
    errorMessage?: string;
    durationMs?: number;
  },
): Promise<void> {
  try {
    const { error } = await supabase
      .from("automation_step_logs")
      .update({
        status: updates.status,
        completed_at: new Date().toISOString(),
        duration_ms: updates.durationMs || null,
        output_snapshot: updates.outputSnapshot || null,
        error_message: updates.errorMessage || null,
      })
      .eq("id", logId);

    if (error) {
      console.error("[step-logger] Failed to update step log:", error);
    }
  } catch (err) {
    console.error("[step-logger] Exception updating step log:", err);
  }
}

/**
 * Wraps step execution with logging and timing
 */
export async function executeWithLogging<T>(
  supabase: any,
  runId: string,
  stepId: string,
  actionType: ActionType,
  inputSnapshot: Record<string, any>,
  executeFn: () => Promise<T>,
): Promise<{ result: T | null; log: StepExecutionLog }> {
  const startTime = Date.now();

  // Log step start
  const logId = await logStepExecution(supabase, {
    runId,
    stepId,
    actionType,
    status: "running",
    inputSnapshot,
  });

  try {
    const result = await executeFn();
    const durationMs = Date.now() - startTime;

    // Update log with success
    if (logId) {
      await updateStepLog(supabase, logId, {
        status: "success",
        outputSnapshot: result as Record<string, any>,
        durationMs,
      });
    }

    return {
      result,
      log: {
        stepId,
        actionType,
        status: "success",
        durationMs,
      },
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    // Update log with error
    if (logId) {
      await updateStepLog(supabase, logId, {
        status: "error",
        errorMessage,
        durationMs,
      });
    }

    return {
      result: null,
      log: {
        stepId,
        actionType,
        status: "error",
        error: errorMessage,
        durationMs,
      },
    };
  }
}

/**
 * Execute with retry logic, error classification, and cancellation support.
 *
 * Accepts an optional RetryPolicy to control:
 * - maxRetries: number of retry attempts (default 2)
 * - initialDelayMs: base delay before first retry (default 1500ms)
 * - shouldRetry: function that classifies errors as transient vs permanent
 *
 * Accepts an optional AbortSignal for cancellation:
 * - Checked before each retry attempt
 * - Aborts the backoff delay when triggered
 * - Returns immediately with error status
 *
 * Uses exponential backoff: delay = initialDelayMs * 2^(attempt-1)
 * Example with initialDelayMs=1000, maxRetries=3: waits 1s, 2s, 4s (~7s total)
 *
 * Permanent errors (4xx, auth failures) are NOT retried.
 * Transient errors (timeouts, 5xx, rate limits) ARE retried.
 */
export async function executeWithRetry<T>(
  supabase: any,
  runId: string,
  stepId: string,
  actionType: ActionType,
  inputSnapshot: Record<string, any>,
  executeFn: () => Promise<T>,
  policy?: { maxRetries: number; initialDelayMs: number; shouldRetry: (error: Error) => boolean },
  abortSignal?: AbortSignal,
): Promise<{ result: T | null; log: StepExecutionLog }> {
  const maxRetries = policy?.maxRetries ?? 2;
  const initialDelayMs = policy?.initialDelayMs ?? 1500;
  const shouldRetry = policy?.shouldRetry ?? (() => true);

  let lastError: Error | null = null;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    // Check for cancellation before each attempt
    if (abortSignal?.aborted) {
      console.log(`[Retry] Step ${stepId} aborted before attempt ${retryCount}`);
      return {
        result: null,
        log: {
          stepId,
          actionType,
          status: "error",
          error: "Workflow cancelled",
          retryCount,
        },
      };
    }

    try {
      const startTime = Date.now();
      const result = await executeFn();
      const durationMs = Date.now() - startTime;

      // Log successful execution (only on final success, not every attempt)
      if (retryCount > 0) {
        console.log(`[Retry] Step ${stepId} succeeded after ${retryCount} retries`);
      }

      await logStepExecution(supabase, {
        runId,
        stepId,
        actionType,
        status: "success",
        inputSnapshot,
        outputSnapshot: result as Record<string, any>,
        retryCount,
        durationMs,
      });

      return {
        result,
        log: {
          stepId,
          actionType,
          status: "success",
          retryCount,
          durationMs,
        },
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Check if error is retryable
      if (!shouldRetry(lastError)) {
        console.log(`[Retry] Permanent error for step ${stepId}, not retrying: ${lastError.message}`);
        break; // Exit retry loop immediately
      }

      retryCount++;

      if (retryCount <= maxRetries) {
        const delay = initialDelayMs * Math.pow(2, retryCount - 1); // Exponential backoff
        console.log(`[Retry] Transient error for step ${stepId}, attempt ${retryCount}/${maxRetries}, waiting ${delay}ms: ${lastError.message}`);

        // Abortable delay - clears timeout if signal fires during backoff
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, delay);
          if (abortSignal) {
            const onAbort = () => {
              clearTimeout(timeout);
              resolve();
            };
            abortSignal.addEventListener("abort", onAbort, { once: true });
          }
        });

        // Check again after delay in case signal fired during wait
        if (abortSignal?.aborted) {
          console.log(`[Retry] Step ${stepId} aborted during backoff delay`);
          break;
        }
      }
    }
  }

  // All retries exhausted, permanent error, or aborted
  const errorMessage = abortSignal?.aborted
    ? "Workflow cancelled"
    : lastError?.message || "Unknown error";

  await logStepExecution(supabase, {
    runId,
    stepId,
    actionType,
    status: "error",
    inputSnapshot,
    errorMessage,
    retryCount: Math.max(retryCount - 1, 0),
  });

  return {
    result: null,
    log: {
      stepId,
      actionType,
      status: "error",
      error: errorMessage,
      retryCount: Math.max(retryCount - 1, 0),
    },
  };
}
