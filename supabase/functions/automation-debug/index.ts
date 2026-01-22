// supabase/functions/automation-debug/index.ts
// Explains why automations didn't run for a given event/contact

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DebugRequest {
  teamId: string;
  // Search by contact/appointment/date
  contactId?: string;
  appointmentId?: string;
  triggerType?: string;
  startDate?: string; // ISO date
  endDate?: string;   // ISO date
  limit?: number;
}

interface AutomationMatchResult {
  automationId: string;
  automationName: string;
  triggerType: string;
  isActive: boolean;
  hasPublishedVersion: boolean;
  matchResult: "ran" | "skipped" | "no_match";
  skipReasons: string[];
  runId?: string;
  runStatus?: string;
  ranAt?: string;
}

interface DebugResponse {
  status: "ok" | "error";
  results: AutomationMatchResult[];
  recentRuns: Array<{
    id: string;
    automationId: string;
    automationName: string;
    triggerType: string;
    status: string;
    createdAt: string;
    stepsExecuted: number;
    errorMessage?: string;
  }>;
  error?: string;
}

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabaseClient();

  try {
    const body: DebugRequest = await req.json();
    const { teamId, contactId, appointmentId, triggerType, startDate, endDate, limit = 50 } = body;

    if (!teamId) {
      return new Response(
        JSON.stringify({ status: "error", error: "Missing teamId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[automation-debug] Request:", { teamId, contactId, appointmentId, triggerType });

    // 1. Get all automations for the team
    const { data: automations, error: automationsError } = await supabase
      .from("automations")
      .select(`
        id,
        name,
        trigger_type,
        is_active,
        current_version_id,
        definition
      `)
      .eq("team_id", teamId)
      .order("name");

    if (automationsError) {
      console.error("[automation-debug] Error fetching automations:", automationsError);
      return new Response(
        JSON.stringify({ status: "error", error: "Failed to fetch automations" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get recent runs for the team
    let runsQuery = supabase
      .from("automation_runs")
      .select(`
        id,
        automation_id,
        trigger_type,
        status,
        created_at,
        steps_executed,
        error_message,
        context_snapshot
      `)
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (triggerType) {
      runsQuery = runsQuery.eq("trigger_type", triggerType);
    }

    if (startDate) {
      runsQuery = runsQuery.gte("created_at", startDate);
    }

    if (endDate) {
      runsQuery = runsQuery.lte("created_at", endDate);
    }

    const { data: runs, error: runsError } = await runsQuery;

    if (runsError) {
      console.error("[automation-debug] Error fetching runs:", runsError);
    }

    // 3. Build automation name map
    const automationMap = new Map(automations?.map(a => [a.id, a]) || []);

    // 4. Analyze each automation for why it might not have run
    const results: AutomationMatchResult[] = [];

    for (const automation of automations || []) {
      const skipReasons: string[] = [];
      let matchResult: "ran" | "skipped" | "no_match" = "no_match";
      let matchingRun: any = null;

      // Check if it ran recently
      const recentRun = runs?.find(r => r.automation_id === automation.id);
      if (recentRun) {
        matchResult = recentRun.status === "success" ? "ran" : "skipped";
        matchingRun = recentRun;
      }

      // Check if inactive
      if (!automation.is_active) {
        skipReasons.push("Automation is inactive (paused)");
      }

      // Check if no published version
      if (!automation.current_version_id) {
        skipReasons.push("No published version - automation only has draft");
      }

      // Check trigger type filter
      if (triggerType && automation.trigger_type !== triggerType) {
        skipReasons.push(`Trigger type mismatch: automation expects "${automation.trigger_type}", searched for "${triggerType}"`);
      }

      // Check trigger constraints
      const triggerConfig = automation.definition?.trigger?.config || {};
      const configKeys = Object.keys(triggerConfig).filter(k => triggerConfig[k]);
      
      if (configKeys.length > 0) {
        skipReasons.push(`Has trigger constraints: ${configKeys.join(", ")}`);
      }

      results.push({
        automationId: automation.id,
        automationName: automation.name,
        triggerType: automation.trigger_type,
        isActive: automation.is_active,
        hasPublishedVersion: !!automation.current_version_id,
        matchResult,
        skipReasons,
        runId: matchingRun?.id,
        runStatus: matchingRun?.status,
        ranAt: matchingRun?.created_at,
      });
    }

    // Sort: runs first, then by name
    results.sort((a, b) => {
      if (a.matchResult === "ran" && b.matchResult !== "ran") return -1;
      if (a.matchResult !== "ran" && b.matchResult === "ran") return 1;
      return a.automationName.localeCompare(b.automationName);
    });

    // 5. Format recent runs with automation names
    const recentRuns = (runs || []).map(run => ({
      id: run.id,
      automationId: run.automation_id,
      automationName: automationMap.get(run.automation_id)?.name || "Unknown",
      triggerType: run.trigger_type,
      status: run.status,
      createdAt: run.created_at,
      stepsExecuted: Array.isArray(run.steps_executed) ? run.steps_executed.length : 0,
      errorMessage: run.error_message || undefined,
    }));

    const response: DebugResponse = {
      status: "ok",
      results,
      recentRuns,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[automation-debug] Error:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
