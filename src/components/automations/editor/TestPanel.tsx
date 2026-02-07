// src/components/automations/editor/TestPanel.tsx
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  SkipForward,
  Clock,
  MessageSquare,
  Tag,
  GitBranch,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AutomationDefinition } from "@/lib/automations/types";

interface TestPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automationId: string | null;
  teamId: string;
  definition: AutomationDefinition;
}

interface StepTraceResult {
  stepId: string;
  stepType: string;
  stepOrder: number;
  status: "success" | "skipped" | "error" | "would_execute";
  skipReason?: string;
  errorMessage?: string;
  conditionsEvaluated?: {
    field: string;
    operator: string;
    expected: any;
    actual: any;
    result: boolean;
  }[];
  resolvedConfig?: Record<string, any>;
  templatePreview?: string;
  durationMs?: number;
  branchTaken?: "true" | "false" | null;
}

interface TestResponse {
  success: boolean;
  automationName: string;
  triggerType: string;
  triggerMatched: boolean;
  stepsTrace: StepTraceResult[];
  contextSnapshot: Record<string, any>;
  totalDurationMs: number;
  error?: string;
}

const ACTION_ICONS: Record<string, typeof MessageSquare> = {
  send_message: MessageSquare,
  send_sms: MessageSquare,
  send_email: MessageSquare,
  time_delay: Clock,
  add_tag: Tag,
  condition: GitBranch,
};

export function TestPanel({
  open,
  onOpenChange,
  automationId,
  teamId,
  definition,
}: TestPanelProps) {
  const [mockContact, setMockContact] = useState({
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone: "+14045551234",
  });
  
  const [testResult, setTestResult] = useState<TestResponse | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const testMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("automation-test", {
        body: {
          automationId,
          teamId,
          mockContact: {
            ...mockContact,
            full_name: `${mockContact.first_name} ${mockContact.last_name}`,
            tags: ["test"],
            timezone: "America/New_York",
          },
          dryRun: true,
        },
      });
      
      if (error) throw error;
      return data as TestResponse;
    },
    onSuccess: (data) => {
      setTestResult(data);
    },
  });

  const handleRunTest = () => {
    setTestResult(null);
    testMutation.mutate();
  };

  const getStatusIcon = (status: StepTraceResult["status"]) => {
    switch (status) {
      case "success":
      case "would_execute":
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case "skipped":
        return <SkipForward className="h-4 w-4 text-yellow-400" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-400" />;
    }
  };

  const getActionLabel = (type: string) => {
    const labels: Record<string, string> = {
      send_message: "Send Message",
      send_sms: "Send SMS",
      send_email: "Send Email",
      time_delay: "Wait",
      add_tag: "Add Tag",
      condition: "If/Else",
      add_task: "Create Task",
      update_stage: "Update Stage",
      custom_webhook: "Webhook",
    };
    return labels[type] || type;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-[500px] bg-background border-border p-0">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <SheetTitle className="text-foreground flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Test Automation
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Run a dry test with sample data to preview what would happen
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="setup" className="flex-1">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-6">
            <TabsTrigger
              value="setup"
              className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Setup
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              disabled={!testResult}
            >
              Results
              {testResult && (
                <span className="ml-2 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                  {testResult.stepsTrace.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="mt-0 p-6">
            <div className="space-y-6">
              {/* Mock Contact Data */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground">Test Contact</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">First Name</Label>
                    <Input
                      value={mockContact.first_name}
                      onChange={(e) => setMockContact({ ...mockContact, first_name: e.target.value })}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Last Name</Label>
                    <Input
                      value={mockContact.last_name}
                      onChange={(e) => setMockContact({ ...mockContact, last_name: e.target.value })}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <Input
                    value={mockContact.email}
                    onChange={(e) => setMockContact({ ...mockContact, email: e.target.value })}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <Input
                    value={mockContact.phone}
                    onChange={(e) => setMockContact({ ...mockContact, phone: e.target.value })}
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Dry Run Mode</p>
                    <p className="text-xs text-blue-600/70 mt-1">
                      No messages will be sent. You'll see exactly what would happen with this contact data.
                    </p>
                  </div>
                </div>
              </div>

              {/* Run Button */}
              <Button
                onClick={handleRunTest}
                disabled={testMutation.isPending || !automationId || definition.steps.length === 0}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {testMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running Test...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Test
                  </>
                )}
              </Button>

              {definition.steps.length === 0 && (
                <p className="text-xs text-yellow-400 text-center">
                  Add at least one step to test the automation
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="results" className="mt-0 flex-1">
            {testResult && (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="p-6 space-y-4">
                  {/* Summary */}
                  <div className="bg-muted/30 rounded-lg p-4 border border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {testResult.automationName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Trigger: {testResult.triggerType}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {testResult.stepsTrace.length} steps
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                          {testResult.totalDurationMs}ms
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Steps Trace */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Execution Trace
                    </h4>
                    
                    {testResult.stepsTrace.map((step, index) => {
                      const Icon = ACTION_ICONS[step.stepType] || ChevronRight;
                      const isExpanded = expandedStep === step.stepId;
                      
                      return (
                        <div
                          key={step.stepId}
                          className={cn(
                            "bg-muted/30 rounded-lg border border-border overflow-hidden transition-colors",
                            isExpanded && "border-primary/30"
                          )}
                        >
                          <button
                            onClick={() => setExpandedStep(isExpanded ? null : step.stepId)}
                            className="w-full p-3 flex items-center gap-3 text-left hover:bg-muted/50"
                          >
                            <span className="text-xs text-muted-foreground/60 w-6">{index + 1}</span>
                            {getStatusIcon(step.status)}
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1 text-sm text-foreground">
                              {getActionLabel(step.stepType)}
                            </span>
                            {step.branchTaken && (
                              <span className={cn(
                                "text-xs px-1.5 py-0.5 rounded",
                                step.branchTaken === "true" 
                                  ? "bg-green-500/20 text-green-400" 
                                  : "bg-orange-500/20 text-orange-400"
                              )}>
                                {step.branchTaken === "true" ? "True" : "False"}
                              </span>
                            )}
                            {step.status === "skipped" && (
                              <span className="text-xs text-yellow-400">
                                {step.skipReason}
                              </span>
                            )}
                            <ChevronRight className={cn(
                              "h-4 w-4 text-muted-foreground/60 transition-transform",
                              isExpanded && "rotate-90"
                            )} />
                          </button>
                          
                          {isExpanded && (
                            <div className="px-3 pb-3 border-t border-border pt-3 space-y-3">
                              {/* Template Preview */}
                              {step.templatePreview && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Message Preview:</p>
                                  <div className="bg-muted/40 rounded p-2 text-sm text-foreground/80 font-mono">
                                    {step.templatePreview}
                                  </div>
                                </div>
                              )}
                              
                              {/* Resolved Config */}
                              {step.resolvedConfig && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Configuration:</p>
                                  <pre className="bg-muted/40 rounded p-2 text-xs text-foreground/60 overflow-x-auto">
                                    {JSON.stringify(step.resolvedConfig, null, 2)}
                                  </pre>
                                </div>
                              )}
                              
                              {/* Conditions Evaluated */}
                              {step.conditionsEvaluated && step.conditionsEvaluated.length > 0 && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Conditions:</p>
                                  <div className="space-y-1">
                                    {step.conditionsEvaluated.map((cond, i) => (
                                      <div
                                        key={i}
                                        className={cn(
                                          "text-xs px-2 py-1 rounded flex items-center gap-2",
                                          cond.result ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                                        )}
                                      >
                                        {cond.result ? (
                                          <CheckCircle2 className="h-3 w-3" />
                                        ) : (
                                          <XCircle className="h-3 w-3" />
                                        )}
                                        <span>
                                          {cond.field} {cond.operator} {JSON.stringify(cond.expected)}
                                        </span>
                                        <span className="text-muted-foreground ml-auto">
                                          (actual: {JSON.stringify(cond.actual)})
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
