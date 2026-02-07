// src/components/automations/DebugPanel.tsx
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bug,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DebugResult {
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

interface RecentRun {
  id: string;
  automationId: string;
  automationName: string;
  triggerType: string;
  status: string;
  createdAt: string;
  stepsExecuted: number;
  errorMessage?: string;
}

interface DebugResponse {
  status: "ok" | "error";
  results: DebugResult[];
  recentRuns: RecentRun[];
  error?: string;
}

export function DebugPanel() {
  const { teamId } = useParams<{ teamId: string }>();
  const [isOpen, setIsOpen] = useState(false);
  const [triggerFilter, setTriggerFilter] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<DebugResponse>({
    queryKey: ["automation-debug", teamId, triggerFilter],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("automation-debug", {
        body: {
          teamId,
          triggerType: triggerFilter || undefined,
          limit: 100,
        },
      });

      if (error) throw error;
      return data as DebugResponse;
    },
    enabled: isOpen && !!teamId,
  });

  const triggerTypes = [
    { value: "", label: "All Triggers" },
    { value: "lead_created", label: "Lead Created" },
    { value: "appointment_booked", label: "Appointment Booked" },
    { value: "appointment_completed", label: "Appointment Completed" },
    { value: "appointment_no_show", label: "Appointment No Show" },
    { value: "payment_received", label: "Payment Received" },
    { value: "form_submitted", label: "Form Submitted" },
    { value: "stage_changed", label: "Stage Changed" },
  ];

  const getStatusIcon = (result: DebugResult) => {
    if (result.matchResult === "ran") {
      return <CheckCircle className="h-4 w-4 text-green-400" />;
    }
    if (!result.isActive) {
      return <XCircle className="h-4 w-4 text-red-400" />;
    }
    if (!result.hasPublishedVersion) {
      return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
    }
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusBadge = (result: DebugResult) => {
    if (result.matchResult === "ran") {
      return <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">Ran</Badge>;
    }
    if (!result.isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    if (!result.hasPublishedVersion) {
      return <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">Draft Only</Badge>;
    }
    return <Badge variant="secondary">Ready</Badge>;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bug className="h-4 w-4" />
          Debug
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[500px] sm:w-[600px] bg-background border-border">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Bug className="h-5 w-5 text-primary" />
            Why Didn't It Run?
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Select value={triggerFilter} onValueChange={setTriggerFilter}>
                <SelectTrigger className="bg-muted/30 border-border text-foreground">
                  <SelectValue placeholder="Filter by trigger" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {triggerTypes.map((t) => (
                    <SelectItem
                      key={t.value}
                      value={t.value}
                      className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground"
                    >
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
              className="border-border"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>

          <Separator className="bg-border" />

          {/* Results */}
          <ScrollArea className="h-[calc(100vh-250px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : data?.results && data.results.length > 0 ? (
              <div className="space-y-2">
                {/* Summary */}
                <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    {data.results.filter(r => r.matchResult === "ran").length} ran
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-400" />
                    {data.results.filter(r => !r.isActive).length} inactive
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-yellow-400" />
                    {data.results.filter(r => !r.hasPublishedVersion && r.isActive).length} draft only
                  </span>
                </div>

                {data.results.map((result) => (
                  <div
                    key={result.automationId}
                    className={cn(
                      "p-3 rounded-lg border transition-colors",
                      "bg-muted/30 border-border hover:border-border"
                    )}
                  >
                    <button
                      onClick={() => setExpandedId(expandedId === result.automationId ? null : result.automationId)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(result)}
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {result.automationName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {result.triggerType.replace(/_/g, " ")}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(result)}
                          {result.skipReasons.length > 0 && (
                            expandedId === result.automationId ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {expandedId === result.automationId && result.skipReasons.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="text-xs text-muted-foreground mb-2">
                          Potential reasons it didn't run:
                        </div>
                        <ul className="space-y-1">
                          {result.skipReasons.map((reason, idx) => (
                            <li key={idx} className="text-xs text-yellow-400/80 flex items-start gap-2">
                              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                        {result.ranAt && (
                          <div className="mt-2 text-xs text-green-400/80">
                            Last ran: {format(new Date(result.ranAt), "MMM d, h:mm a")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No automations found</p>
              </div>
            )}

            {/* Recent Runs Section */}
            {data?.recentRuns && data.recentRuns.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Runs
                </h4>
                <div className="space-y-2">
                  {data.recentRuns.slice(0, 10).map((run) => (
                    <div
                      key={run.id}
                      className="p-2 rounded-lg bg-muted/30 border border-border text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-foreground font-medium">{run.automationName}</span>
                        <Badge
                          variant={run.status === "success" ? "default" : "destructive"}
                          className={cn(
                            "text-xs",
                            run.status === "success" && "bg-green-500/20 text-green-400"
                          )}
                        >
                          {run.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-muted-foreground">
                        <span>{run.triggerType.replace(/_/g, " ")}</span>
                        <span>{format(new Date(run.createdAt), "MMM d, h:mm a")}</span>
                      </div>
                      {run.errorMessage && (
                        <div className="mt-1 text-red-400 truncate">
                          {run.errorMessage}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
