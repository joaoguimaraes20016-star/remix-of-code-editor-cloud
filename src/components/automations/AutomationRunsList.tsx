import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

function formatDate(ts: string) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export default function AutomationRunsList({ teamId }: { teamId: string }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AutomationRunRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(() => rows, [rows]);

  async function load() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("automation_runs")
      .select(
        "id, team_id, automation_id, trigger_type, status, error_message, steps_executed, context_snapshot, created_at",
      )
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      setError(error.message);
      setRows([]);
      setLoading(false);
      return;
    }

    setRows((data ?? []) as AutomationRunRow[]);
    setLoading(false);
  }

  useEffect(() => {
    if (!teamId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Automation History</div>
          <div className="text-sm text-muted-foreground">
            Shows ALL rows from <code>public.automation_runs</code> for this team.
          </div>
        </div>
        <button onClick={load} className="rounded-md border px-3 py-2 text-sm hover:bg-muted" disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <div className="font-medium">Query error</div>
          <div className="opacity-90">{error}</div>
          <div className="mt-2 opacity-80">
            If you see an RLS error here, the table policy isn’t letting your user read runs for this team.
          </div>
        </div>
      )}

      {!error && !loading && sorted.length === 0 && (
        <div className="rounded-md border p-6 text-sm text-muted-foreground">
          No automation runs found for this team yet.
        </div>
      )}

      <div className="space-y-2">
        {sorted.map((r) => {
          const isExpanded = expandedId === r.id;
          const label = r.automation_id ? "Saved Automation" : "Inline Automation";
          return (
            <div key={r.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-1 text-xs">{label}</span>
                  <span className="rounded-full bg-muted px-2 py-1 text-xs">{r.trigger_type}</span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      r.status === "success"
                        ? "bg-emerald-500/15 text-emerald-200"
                        : r.status === "error"
                          ? "bg-red-500/15 text-red-200"
                          : "bg-muted text-foreground"
                    }`}
                  >
                    {r.status}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
                </div>

                <button
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
                >
                  {isExpanded ? "Hide details" : "View details"}
                </button>
              </div>

              {r.error_message && (
                <div className="mt-2 text-sm text-red-200">
                  <span className="font-medium">Error:</span> {r.error_message}
                </div>
              )}

              {isExpanded && (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-md border p-3">
                    <div className="text-xs font-medium mb-2">steps_executed</div>
                    <pre className="text-xs overflow-auto whitespace-pre-wrap">
                      {JSON.stringify(r.steps_executed, null, 2)}
                    </pre>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs font-medium mb-2">context_snapshot</div>
                    <pre className="text-xs overflow-auto whitespace-pre-wrap">
                      {JSON.stringify(r.context_snapshot, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
