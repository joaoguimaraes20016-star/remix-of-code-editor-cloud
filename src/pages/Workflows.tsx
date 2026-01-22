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
      {/* Page Header with Inline Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workflows</h1>
          <p className="text-muted-foreground text-sm">
            Automate your workflows and manage tasks
          </p>
        </div>
        
        {/* Compact Stats Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium">
            <Zap className="h-3.5 w-3.5" />
            <span>{totalCount} automations</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-sm font-medium">
            <Activity className="h-3.5 w-3.5" />
            <span>{folders.length} folders</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-medium">
            <ClipboardCheck className="h-3.5 w-3.5" />
            <span>3 task rules</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="automations" className="space-y-4">
        {/* Simplified Tab Bar */}
        <TabsList className="h-10 bg-transparent border-b border-border rounded-none p-0 gap-6 w-full justify-start">
          <TabsTrigger
            value="automations"
            className="h-10 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground"
          >
            Automations
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="h-10 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground"
          >
            Activity
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="h-10 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground"
          >
            Manual Tasks
          </TabsTrigger>
        </TabsList>

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
