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

  return (
    <div className="min-h-screen bg-background">
      <Tabs defaultValue="automations" className="h-full">
        {/* Top Tab Bar */}
        <div className="border-b border-border bg-card">
          <div className="px-6">
            <TabsList className="h-12 bg-transparent border-0 p-0 gap-6">
              <TabsTrigger
                value="automations"
                className="h-12 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <Zap className="h-4 w-4 mr-2" />
                Automations
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="h-12 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <Activity className="h-4 w-4 mr-2" />
                Activity
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="h-12 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Manual Tasks
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Automations Tab - Folder Layout */}
        <TabsContent value="automations" className="m-0">
          <div className="flex h-[calc(100vh-8rem)]">
            {/* Folder Sidebar */}
            <AutomationFoldersSidebar
              teamId={teamId}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              automationCounts={automationCounts}
              totalCount={totalCount}
            />

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto">
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
        <TabsContent value="activity" className="m-0 p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Activity Log</h2>
              <p className="text-sm text-muted-foreground">
                View recent automation runs and message delivery status
              </p>
            </div>

            <div className="grid gap-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Recent Automation Runs</h3>
                <AutomationRunsList teamId={teamId} />
              </div>
              <div>
                <h3 className="text-sm font-medium mb-3">Message Logs</h3>
                <MessageLogsList teamId={teamId} />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Manual Tasks Tab */}
        <TabsContent value="tasks" className="m-0 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Manual Tasks</h2>
              <p className="text-sm text-muted-foreground">
                Configure tasks your team handles manually — confirmations, follow-ups, and status changes
              </p>
            </div>

            <Accordion type="multiple" defaultValue={["reminders"]} className="space-y-4">
              <AccordionItem value="reminders" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
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

              <AccordionItem value="followups" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
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

              <AccordionItem value="mappings" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
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
          </div>
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
