import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Zap, Activity, ClipboardCheck, Loader2 } from "lucide-react";
import { AutomationFoldersSidebar } from "@/components/automations/AutomationFoldersSidebar";
import { FolderHeader } from "@/components/automations/FolderHeader";
import { AutomationsGrid } from "@/components/automations/AutomationsGrid";
import { CreateFolderDialog } from "@/components/automations/CreateFolderDialog";
import AutomationRunsList from "@/components/automations/AutomationRunsList";
import { MessageLogsList } from "@/components/automations/MessageLogsList";
import { TaskFlowBuilder } from "@/components/TaskFlowBuilder";
import { FollowUpSettings } from "@/components/FollowUpSettings";
import { ActionPipelineMappings } from "@/components/ActionPipelineMappings";
import { cn } from "@/lib/utils";

interface AutomationFolder {
  id: string;
  name: string;
  color: string;
}

export default function Workflows() {
  const { teamId } = useParams<{ teamId: string }>();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);

  // Fetch folders for sidebar
  const { data: folders = [] } = useQuery({
    queryKey: ["automation-folders", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_folders")
        .select("id, name, color")
        .eq("team_id", teamId!)
        .order("position", { ascending: true });

      if (error) throw error;
      return data as AutomationFolder[];
    },
    enabled: !!teamId,
  });

  // Fetch automation counts per folder
  const { data: automations = [] } = useQuery({
    queryKey: ["automations", teamId, "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automations")
        .select("id, folder_id")
        .eq("team_id", teamId!);

      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });

  const automationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    automations.forEach((a) => {
      if (a.folder_id) {
        counts[a.folder_id] = (counts[a.folder_id] || 0) + 1;
      }
    });
    return counts;
  }, [automations]);

  const totalCount = automations.length;

  const selectedFolderName = useMemo(() => {
    if (!selectedFolderId) return "All Automations";
    if (selectedFolderId === "uncategorized") return "Uncategorized";
    const folder = folders.find((f) => f.id === selectedFolderId);
    return folder?.name || "All Automations";
  }, [selectedFolderId, folders]);

  const selectedFolderCount = useMemo(() => {
    if (!selectedFolderId) return totalCount;
    if (selectedFolderId === "uncategorized") {
      return automations.filter((a) => !a.folder_id).length;
    }
    return automationCounts[selectedFolderId] || 0;
  }, [selectedFolderId, automationCounts, automations, totalCount]);

  if (!teamId) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const activeAutomations = automations.filter((a) => a.folder_id !== null).length;
  const uncategorizedCount = automations.filter((a) => !a.folder_id).length;

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Workflows</h1>
        <p className="text-muted-foreground">
          Automate your workflows, track activity, and manage manual tasks
        </p>
      </div>

      {/* Hero Stats Cards - 3 column layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Automations Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-white/20">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-white/80">Total Automations</span>
            </div>
            <div className="text-3xl font-bold mb-1">{totalCount}</div>
            <p className="text-sm text-white/60">{folders.length} folders</p>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 p-6 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-white/20">
                <Activity className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-white/80">Activity</span>
            </div>
            <div className="text-3xl font-bold mb-1">—</div>
            <p className="text-sm text-white/60">View recent runs</p>
          </div>
        </div>

        {/* Manual Tasks Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 p-6 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-white/20">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-white/80">Manual Tasks</span>
            </div>
            <div className="text-3xl font-bold mb-1">3</div>
            <p className="text-sm text-white/60">Task rule types</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="automations" className="space-y-4">
        {/* Tab Bar */}
        <div className="border-b border-border">
          <div className="px-6">
            <TabsList className="h-12 bg-transparent border-0 p-0 gap-6">
              <TabsTrigger
                value="automations"
                className={cn(
                  "h-12 px-0 rounded-none border-b-2 border-transparent",
                  "data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  "data-[state=active]:text-purple-600"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-gradient-to-br from-purple-500/10 to-indigo-500/10">
                    <Zap className="h-4 w-4" />
                  </div>
                  Automations
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className={cn(
                  "h-12 px-0 rounded-none border-b-2 border-transparent",
                  "data-[state=active]:border-teal-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  "data-[state=active]:text-teal-600"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-gradient-to-br from-teal-500/10 to-cyan-500/10">
                    <Activity className="h-4 w-4" />
                  </div>
                  Activity
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className={cn(
                  "h-12 px-0 rounded-none border-b-2 border-transparent",
                  "data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  "data-[state=active]:text-orange-600"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-gradient-to-br from-orange-500/10 to-rose-500/10">
                    <ClipboardCheck className="h-4 w-4" />
                  </div>
                  Manual Tasks
                </div>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Automations Tab - Folder Layout */}
        <TabsContent value="automations" className="mt-0 pt-4">
          <div className="flex gap-6 min-h-[500px]">
            {/* Folder Sidebar */}
            <AutomationFoldersSidebar
              teamId={teamId}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              automationCounts={automationCounts}
              totalCount={totalCount}
            />

            {/* Main Content */}
            <div className="flex-1">
              <FolderHeader
                teamId={teamId}
                folderName={selectedFolderName}
                automationCount={selectedFolderCount}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                folderId={selectedFolderId}
                onCreateFolder={() => setShowCreateFolderDialog(true)}
              />

              <AutomationsGrid
                teamId={teamId}
                folderId={selectedFolderId}
                searchQuery={searchQuery}
              />
            </div>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-0 pt-4">
          <div className="space-y-6">
            <div className="grid gap-6">
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                  Recent Automation Runs
                </h3>
                <AutomationRunsList teamId={teamId} />
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-500" />
                  Message Logs
                </h3>
                <MessageLogsList teamId={teamId} />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Manual Tasks Tab */}
        <TabsContent value="tasks" className="mt-0 pt-4">
          <Accordion type="multiple" defaultValue={["reminders"]} className="space-y-4">
            <AccordionItem value="reminders" className="border rounded-xl px-4 bg-card">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500">
                    <ClipboardCheck className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="font-medium">Pre-Appointment Reminders</span>
                  <span className="text-xs text-muted-foreground">
                    Create tasks for your team to confirm appointments
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <TaskFlowBuilder teamId={teamId} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="followups" className="border rounded-xl px-4 bg-card">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500">
                    <Activity className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="font-medium">Follow-Up Sequences</span>
                  <span className="text-xs text-muted-foreground">
                    Auto-create tasks based on lead status
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <FollowUpSettings teamId={teamId} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="mappings" className="border rounded-xl px-4 bg-card">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500">
                    <Zap className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="font-medium">Status Change Rules</span>
                  <span className="text-xs text-muted-foreground">
                    Automatically move leads when events happen
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <ActionPipelineMappings teamId={teamId} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
      </Tabs>

      <CreateFolderDialog
        open={showCreateFolderDialog}
        onOpenChange={setShowCreateFolderDialog}
        teamId={teamId}
      />
    </div>
  );
}
