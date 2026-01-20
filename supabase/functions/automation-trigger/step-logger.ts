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
 * Logs individual step execution to automation_step_logs table
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
      console.error("[step-logger] Failed to log step:", error);
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
 * Execute with retry logic
 */
export async function executeWithRetry<T>(
  supabase: any,
  runId: string,
  stepId: string,
  actionType: ActionType,
  inputSnapshot: Record<string, any>,
  executeFn: () => Promise<T>,
  maxRetries: number = 3,
  retryDelayMs: number = 1000,
): Promise<{ result: T | null; log: StepExecutionLog }> {
  let lastError: Error | null = null;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      const startTime = Date.now();
      const result = await executeFn();
      const durationMs = Date.now() - startTime;

      // Log successful execution
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
      retryCount++;

      if (retryCount <= maxRetries) {
        console.log(`[step-logger] Retry ${retryCount}/${maxRetries} for step ${stepId}`);
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * retryCount));
      }
    }
  }

  // All retries exhausted
  const errorMessage = lastError?.message || "Unknown error";

  await logStepExecution(supabase, {
    runId,
    stepId,
    actionType,
    status: "error",
    inputSnapshot,
    errorMessage,
    retryCount: retryCount - 1,
  });

  return {
    result: null,
    log: {
      stepId,
      actionType,
      status: "error",
      error: errorMessage,
      retryCount: retryCount - 1,
    },
  };
}
