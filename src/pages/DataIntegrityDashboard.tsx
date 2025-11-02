import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, RefreshCw, Shield } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface IntegrityLog {
  id: string;
  created_at: string;
  issue_type: string;
  issue_count: number;
  details: any;
  resolved_at: string | null;
}

export default function DataIntegrityDashboard() {
  const [logs, setLogs] = useState<IntegrityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [healthScore, setHealthScore] = useState(100);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("data_integrity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setLogs(data || []);
      
      // Calculate health score
      const unresolvedIssues = data?.filter(log => !log.resolved_at) || [];
      const totalIssues = unresolvedIssues.reduce((sum, log) => sum + log.issue_count, 0);
      const score = Math.max(0, 100 - (totalIssues * 2));
      setHealthScore(score);
    } catch (error: any) {
      console.error("Error loading logs:", error);
      toast.error("Failed to load integrity logs");
    } finally {
      setLoading(false);
    }
  };

  const runIntegrityCheck = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('data-integrity-check');

      if (error) throw error;

      toast.success(`Integrity check completed. ${data.issues_found} issues found.`);
      loadLogs();
    } catch (error: any) {
      console.error("Error running integrity check:", error);
      toast.error("Failed to run integrity check");
    } finally {
      setChecking(false);
    }
  };

  const getIssueColor = (issueType: string) => {
    switch (issueType) {
      case "appointments_without_tasks":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
      case "duplicate_confirmation_tasks":
        return "bg-red-500/10 text-red-600 dark:text-red-400";
      case "closed_appointments_without_sales":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      case "orphaned_mrr_commissions":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
      default:
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400";
    }
  };

  const getIssueLabel = (issueType: string) => {
    return issueType
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Data Integrity Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and maintain data quality across your system
          </p>
        </div>
        <Button 
          onClick={runIntegrityCheck} 
          disabled={checking}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          Run Check
        </Button>
      </div>

      {/* Health Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {healthScore === 100 ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-orange-500" />
            )}
            Data Health Score
          </CardTitle>
          <CardDescription>
            Overall data integrity status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold">{healthScore}%</div>
              <div className="flex-1">
                <div className="w-full bg-secondary rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all ${
                      healthScore >= 95
                        ? "bg-green-500"
                        : healthScore >= 80
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${healthScore}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {healthScore === 100 && "Perfect! No data integrity issues detected."}
              {healthScore >= 95 && healthScore < 100 && "Excellent. Minor issues detected."}
              {healthScore >= 80 && healthScore < 95 && "Good. Some issues need attention."}
              {healthScore < 80 && "Action required. Multiple issues detected."}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Integrity Checks</CardTitle>
          <CardDescription>
            Last 50 integrity check results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>No integrity issues detected</p>
                <p className="text-sm mt-1">Run your first check to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <Card key={log.id} className={log.resolved_at ? "opacity-50" : ""}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className={getIssueColor(log.issue_type)}>
                              {getIssueLabel(log.issue_type)}
                            </Badge>
                            <span className="text-sm font-medium">
                              {log.issue_count} {log.issue_count === 1 ? "issue" : "issues"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Detected: {new Date(log.created_at).toLocaleString()}
                          </p>
                          {log.resolved_at && (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              ✓ Resolved: {new Date(log.resolved_at).toLocaleString()}
                            </p>
                          )}
                          {log.details && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                View details
                              </summary>
                              <pre className="mt-2 p-2 bg-secondary rounded text-xs overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
