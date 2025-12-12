import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AutomationRunRow = {
  id: string;
  team_id: string;
  automation_id: string | null;
  trigger_type: string;
  status: "success" | "error" | string;
  error_message: string | null;
  steps_executed: any;
  context_snapshot: any;
  created_at: string;
};

function safeJson(value: any) {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return String(value);
  }
}

export default function AutomationRunsList({ teamId }: { teamId: string }) {
  const [runs, setRuns] = useState<AutomationRunRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const expandedRun = useMemo(() => runs.find((r) => r.id === expandedId) ?? null, [runs, expandedId]);

  async function loadRuns() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("automation_runs")
      .select(
        "id, team_id, automation_id, trigger_type, status, error_message, steps_executed, context_snapshot, created_at",
      )
      .eq("team_id", teamId)
      // IMPORTANT: no filter on automation_id — funnel/template runs often have NULL
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      setError(error.message);
      setRuns([]);
    } else {
      setRuns((data as AutomationRunRow[]) ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (!teamId) return;
    loadRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  return (
    <Card className="bg-background/40 border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Automation History</CardTitle>
        <Button variant="secondary" onClick={loadRuns} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {error ? <div className="text-sm text-red-400">History failed to load: {error}</div> : null}

        {!loading && !error && runs.length === 0 ? (
          <div className="text-sm text-muted-foreground">No automation runs found for this team yet.</div>
        ) : null}

        <div className="space-y-2">
          {runs.map((r) => {
            const label = r.automation_id ? "Saved Automation" : "Inline Automation";
            const statusOk = String(r.status).toLowerCase() === "success";
            const isOpen = expandedId === r.id;

            return (
              <div key={r.id} className="flex flex-col gap-2 rounded-xl border border-border bg-background/30 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-muted px-3 py-1 text-xs">{label}</span>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs">{r.trigger_type}</span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        statusOk ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
                      }`}
                    >
                      {r.status}
                    </span>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                  </div>

                  <Button variant="ghost" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                    {isOpen ? "Hide details" : "View details"}
                  </Button>
                </div>

                {isOpen ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-border bg-background/40 p-3">
                      <div className="mb-2 text-xs text-muted-foreground">steps_executed</div>
                      <pre className="max-h-72 overflow-auto text-xs">{safeJson(r.steps_executed)}</pre>
                    </div>

                    <div className="rounded-lg border border-border bg-background/40 p-3">
                      <div className="mb-2 text-xs text-muted-foreground">context_snapshot</div>
                      <pre className="max-h-72 overflow-auto text-xs">{safeJson(r.context_snapshot)}</pre>
                    </div>

                    {r.error_message ? (
                      <div className="md:col-span-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                        <div className="mb-1 text-xs text-red-300">error_message</div>
                        <pre className="text-xs text-red-200">{r.error_message}</pre>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
