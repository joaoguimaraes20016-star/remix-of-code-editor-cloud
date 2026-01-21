import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap, GitBranch, Workflow, Bot, History, Settings2 } from "lucide-react";
import { TaskFlowBuilder } from "@/components/TaskFlowBuilder";
import { FollowUpSettings } from "@/components/FollowUpSettings";
import { ActionPipelineMappings } from "@/components/ActionPipelineMappings";
import { AutomationsList } from "@/components/automations/AutomationsList";
import AutomationRunsList from "@/components/automations/AutomationRunsList";
import { MessageLogsList } from "@/components/automations/MessageLogsList";
import { AutomationHeroPrompt } from "@/components/automations/AutomationHeroPrompt";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TriggerType } from "@/lib/automations/types";

export default function Workflows() {
  const { teamId } = useParams();
  const navigate = useNavigate();

  if (!teamId) {
    return <div className="p-8 text-center text-muted-foreground">Team not found</div>;
  }

  const handleQuickStart = (triggerType: TriggerType) => {
    // Navigate to editor with pre-selected trigger
    navigate(`/team/${teamId}/workflows/new/edit?trigger=${triggerType}`);
  };

  const handleCreateFromPrompt = (prompt: string) => {
    // For now, navigate to new automation - AI processing can be added later
    navigate(`/team/${teamId}/workflows/new/edit`);
  };

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      {/* Hero Prompt Section */}
      <AutomationHeroPrompt 
        onQuickStart={handleQuickStart}
        onCreateFromPrompt={handleCreateFromPrompt}
      />

      {/* Simplified Tabs */}
      <Tabs defaultValue="automations" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="automations" className="gap-2">
            <Bot className="h-4 w-4" />
            Automations
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <History className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Automations Tab */}
        <TabsContent value="automations" className="space-y-4">
          <AutomationsList teamId={teamId} />
        </TabsContent>

        {/* Activity Tab - Combines History + Messages */}
        <TabsContent value="activity" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Recent Runs</h3>
            <AutomationRunsList teamId={teamId} />
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Message Logs</h3>
            <MessageLogsList teamId={teamId} />
          </div>
        </TabsContent>

        {/* Advanced Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Call Confirmation Flow */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Call Confirmation Flow
              </CardTitle>
              <CardDescription>
                Configure when and how confirmation tasks are created for new appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TaskFlowBuilder teamId={teamId} />
            </CardContent>
          </Card>

          {/* Follow-Up Flows */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-primary" />
                Automated Follow-Up Flows
              </CardTitle>
              <CardDescription>Set up automatic follow-up tasks based on pipeline stage changes</CardDescription>
            </CardHeader>
            <CardContent>
              <FollowUpSettings teamId={teamId} />
            </CardContent>
          </Card>

          {/* Pipeline Action Mappings */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Workflow className="h-5 w-5 text-primary" />
                Action → Pipeline Mappings
              </CardTitle>
              <CardDescription>Define which pipeline stage leads move to when specific actions occur</CardDescription>
            </CardHeader>
            <CardContent>
              <ActionPipelineMappings teamId={teamId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
