import { useParams, useNavigate } from "react-router-dom";
import { Bot, History, ClipboardCheck, Info } from "lucide-react";
import { TaskFlowBuilder } from "@/components/TaskFlowBuilder";
import { FollowUpSettings } from "@/components/FollowUpSettings";
import { ActionPipelineMappings } from "@/components/ActionPipelineMappings";
import { AutomationsList } from "@/components/automations/AutomationsList";
import AutomationRunsList from "@/components/automations/AutomationRunsList";
import { MessageLogsList } from "@/components/automations/MessageLogsList";
import { AutomationHeroPrompt } from "@/components/automations/AutomationHeroPrompt";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { TriggerType } from "@/lib/automations/types";

export default function Workflows() {
  const { teamId } = useParams();
  const navigate = useNavigate();

  if (!teamId) {
    return <div className="p-8 text-center text-muted-foreground">Team not found</div>;
  }

  const handleQuickStart = (triggerType: TriggerType) => {
    navigate(`/team/${teamId}/workflows/new/edit?trigger=${triggerType}`);
  };

  const handleCreateFromPrompt = (prompt: string) => {
    navigate(`/team/${teamId}/workflows/new/edit`);
  };

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      {/* Simplified Tabs - Automations list comes first */}
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
            <ClipboardCheck className="h-4 w-4" />
            Manual Tasks
          </TabsTrigger>
        </TabsList>

        {/* Automations Tab */}
        <TabsContent value="automations" className="space-y-8">
          {/* Automations List First */}
          <AutomationsList teamId={teamId} />
          
          {/* Hero Prompt Below */}
          <div className="pt-4 border-t border-border">
            <AutomationHeroPrompt 
              onQuickStart={handleQuickStart}
              onCreateFromPrompt={handleCreateFromPrompt}
            />
          </div>
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

        {/* Manual Tasks Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Section Header */}
          <Alert className="bg-muted/50 border-primary/20">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm text-muted-foreground">
              Configure tasks that your team handles manually — confirmations, follow-ups, and status updates.
            </AlertDescription>
          </Alert>

          {/* Accordion Sections */}
          <Accordion type="multiple" defaultValue={["reminders"]} className="space-y-4">
            {/* Pre-Appointment Reminders */}
            <AccordionItem value="reminders" className="border rounded-xl px-4 bg-card">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 text-left">
                  <span className="text-lg">📞</span>
                  <div>
                    <h3 className="font-semibold text-base">Pre-Appointment Reminders</h3>
                    <p className="text-sm text-muted-foreground font-normal">
                      Create tasks for your team to call and confirm appointments
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <TaskFlowBuilder teamId={teamId} />
              </AccordionContent>
            </AccordionItem>

            {/* Follow-Up Sequences */}
            <AccordionItem value="followups" className="border rounded-xl px-4 bg-card">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 text-left">
                  <span className="text-lg">🔄</span>
                  <div>
                    <h3 className="font-semibold text-base">Follow-Up Sequences</h3>
                    <p className="text-sm text-muted-foreground font-normal">
                      Auto-create follow-up tasks when leads hit certain stages
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <FollowUpSettings teamId={teamId} />
              </AccordionContent>
            </AccordionItem>

            {/* Status Change Rules */}
            <AccordionItem value="rules" className="border rounded-xl px-4 bg-card">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 text-left">
                  <span className="text-lg">⚡</span>
                  <div>
                    <h3 className="font-semibold text-base">Status Change Rules</h3>
                    <p className="text-sm text-muted-foreground font-normal">
                      Auto-move leads to stages when events happen (cancel, no-show, etc.)
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <ActionPipelineMappings teamId={teamId} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
      </Tabs>
    </div>
  );
}
