// src/components/automations/editor/VersionHistoryPanel.tsx
import { useState } from "react";
import { format } from "date-fns";
import { History, RotateCcw, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useVersionHistory,
  useRollbackVersion,
  type WorkflowVersion,
} from "@/hooks/useAutomationVersioning";
import { cn } from "@/lib/utils";

interface VersionHistoryPanelProps {
  automationId: string | null;
  teamId: string;
  currentVersionId?: string | null;
}

export function VersionHistoryPanel({
  automationId,
  teamId,
  currentVersionId,
}: VersionHistoryPanelProps) {
  const [open, setOpen] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<WorkflowVersion | null>(null);
  
  const { data: versions = [], isLoading } = useVersionHistory(automationId);
  const rollbackMutation = useRollbackVersion(automationId, teamId);

  const handleRollback = async () => {
    if (!rollbackTarget) return;
    await rollbackMutation.mutateAsync(rollbackTarget.id);
    setRollbackTarget(null);
    setOpen(false);
  };

  const isEmpty = !isLoading && versions.length === 0;

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
            disabled={!automationId || automationId === "new"}
          >
            <History className="h-4 w-4 mr-1.5" />
            History
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[400px] bg-background border-border">
          <SheetHeader>
            <SheetTitle className="text-foreground">Version History</SheetTitle>
            <SheetDescription className="text-muted-foreground">
              View and restore previous versions of this workflow
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-140px)] mt-4 -mx-6 px-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : isEmpty ? (
              <div className="text-center py-12">
                <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No published versions yet</p>
                <p className="text-muted-foreground/60 text-xs mt-1">
                  Publish this workflow to create your first version
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {versions.map((version, index) => {
                  const isCurrent = version.id === currentVersionId;
                  const isLatest = index === 0;
                  
                  return (
                    <div
                      key={version.id}
                      className={cn(
                        "p-3 rounded-lg border transition-colors",
                        isCurrent
                          ? "bg-primary/10 border-primary/30"
                          : "bg-muted/30 border-border hover:border-border/80"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              v{version.version_number}
                            </span>
                            {isCurrent && (
                              <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                                Current
                              </span>
                            )}
                            {isLatest && !isCurrent && (
                              <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                                Latest
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(version.published_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-0.5">
                            {(version.definition_json as any)?.steps?.length || 0} steps
                          </p>
                        </div>
                        
                        {!isCurrent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRollbackTarget(version)}
                            className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1" />
                            Restore
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Rollback Confirmation Dialog */}
      <AlertDialog open={!!rollbackTarget} onOpenChange={() => setRollbackTarget(null)}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Restore to v{rollbackTarget?.version_number}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will create a new version with the same configuration as v
              {rollbackTarget?.version_number}. The current published version will remain in 
              history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted/50 border-border text-foreground hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRollback}
              disabled={rollbackMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {rollbackMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Restore Version
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
