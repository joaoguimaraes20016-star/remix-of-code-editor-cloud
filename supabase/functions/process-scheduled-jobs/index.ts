// supabase/functions/process-scheduled-jobs/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScheduledJob {
  id: string;
  team_id: string;
  automation_id: string;
  run_id: string | null;
  step_id: string | null;
  resume_at: string;
  status: string;
  context_snapshot: Record<string, any>;
  error_message: string | null;
}

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Process scheduled automation jobs that are due
 * This function should be called via cron (e.g., every minute)
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  try {
    // Fetch pending jobs that are due
    const { data: jobs, error: fetchError } = await supabase
      .from("scheduled_automation_jobs")
      .select("*")
      .eq("status", "pending")
      .lte("resume_at", now)
      .limit(50); // Process in batches

    if (fetchError) {
      console.error("[process-scheduled-jobs] Error fetching jobs:", fetchError);
      return new Response(
        JSON.stringify({ status: "error", error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ status: "ok", processed: 0, message: "No pending jobs" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`[process-scheduled-jobs] Found ${jobs.length} pending jobs`);

    const results: { jobId: string; status: string; error?: string }[] = [];

    for (const job of jobs as ScheduledJob[]) {
      try {
        // Mark job as processing
        await supabase
          .from("scheduled_automation_jobs")
          .update({ status: "processing" })
          .eq("id", job.id);

        // Get the automation definition
        const { data: automation, error: autoError } = await supabase
          .from("automations")
          .select("*")
          .eq("id", job.automation_id)
          .single();

        if (autoError || !automation) {
          throw new Error(`Automation not found: ${job.automation_id}`);
        }

        if (!automation.is_active) {
          // Automation was deactivated, mark job as cancelled
          await supabase
            .from("scheduled_automation_jobs")
            .update({
              status: "cancelled",
              processed_at: now,
              error_message: "Automation is no longer active",
            })
            .eq("id", job.id);

          results.push({ jobId: job.id, status: "cancelled", error: "Automation inactive" });
          continue;
        }

        // Get the remaining steps to execute
        const definition = automation.definition || {};
        const allSteps = definition.steps || [];
        const remainingStepIds = job.context_snapshot.remainingSteps || [];
        const remainingSteps = allSteps.filter((s: any) => remainingStepIds.includes(s.id));

        if (remainingSteps.length === 0) {
          await supabase
            .from("scheduled_automation_jobs")
            .update({
              status: "completed",
              processed_at: now,
            })
            .eq("id", job.id);

          results.push({ jobId: job.id, status: "completed" });
          continue;
        }

        // Call the automation-trigger function to continue execution
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        const response = await fetch(`${supabaseUrl}/functions/v1/automation-trigger`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            triggerType: automation.trigger_type,
            teamId: job.team_id,
            eventPayload: {
              ...job.context_snapshot,
              resumeFromStep: remainingSteps[0]?.id,
              isScheduledResume: true,
            },
            eventId: `scheduled:${job.id}:${Date.now()}`,
          }),
        });

        if (!response.ok) {
          throw new Error(`Trigger failed: HTTP ${response.status}`);
        }

        // Mark job as completed
        await supabase
          .from("scheduled_automation_jobs")
          .update({
            status: "completed",
            processed_at: now,
          })
          .eq("id", job.id);

        results.push({ jobId: job.id, status: "completed" });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error(`[process-scheduled-jobs] Job ${job.id} failed:`, errorMessage);

        // Mark job as failed
        await supabase
          .from("scheduled_automation_jobs")
          .update({
            status: "failed",
            processed_at: now,
            error_message: errorMessage,
          })
          .eq("id", job.id);

        results.push({ jobId: job.id, status: "failed", error: errorMessage });
      }
    }

    const successful = results.filter((r) => r.status === "completed").length;
    const failed = results.filter((r) => r.status === "failed").length;

    console.log(`[process-scheduled-jobs] Processed: ${successful} success, ${failed} failed`);

    return new Response(
      JSON.stringify({
        status: "ok",
        processed: jobs.length,
        successful,
        failed,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[process-scheduled-jobs] Error:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
