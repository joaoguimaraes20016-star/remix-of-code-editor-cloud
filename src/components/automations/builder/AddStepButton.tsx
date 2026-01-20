import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  MessageSquare, 
  Clock, 
  Tag, 
  ClipboardList, 
  UserCheck, 
  ArrowRightLeft,
  Bell,
  Webhook
} from "lucide-react";
import type { ActionType } from "@/lib/automations/types";

interface AddStepButtonProps {
  onAddStep: (type: ActionType) => void;
}

interface ActionOption {
  type: ActionType;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: "communication" | "crm" | "flow" | "integrations";
}

const ACTION_OPTIONS: ActionOption[] = [
  // Communication
  {
    type: "send_message",
    label: "Send Message",
    description: "Email, SMS, or voice message",
    icon: <MessageSquare className="h-4 w-4" />,
    category: "communication",
  },
  {
    type: "notify_team",
    label: "Notify Team",
    description: "Send internal notification",
    icon: <Bell className="h-4 w-4" />,
    category: "communication",
  },
  // CRM Updates
  {
    type: "add_tag",
    label: "Add Tag",
    description: "Tag the lead",
    icon: <Tag className="h-4 w-4" />,
    category: "crm",
  },
  {
    type: "add_task",
    label: "Add Task",
    description: "Create a follow-up task",
    icon: <ClipboardList className="h-4 w-4" />,
    category: "crm",
  },
  {
    type: "assign_owner",
    label: "Assign Owner",
    description: "Set lead/deal owner",
    icon: <UserCheck className="h-4 w-4" />,
    category: "crm",
  },
  {
    type: "update_stage",
    label: "Update Stage",
    description: "Move in pipeline",
    icon: <ArrowRightLeft className="h-4 w-4" />,
    category: "crm",
  },
  // Flow Control
  {
    type: "time_delay",
    label: "Time Delay",
    description: "Wait before next step",
    icon: <Clock className="h-4 w-4" />,
    category: "flow",
  },
  // Integrations
  {
    type: "custom_webhook",
    label: "Webhook",
    description: "Call external URL",
    icon: <Webhook className="h-4 w-4" />,
    category: "integrations",
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  communication: "Communication",
  crm: "CRM Updates",
  flow: "Flow Control",
  integrations: "Integrations",
};

export function AddStepButton({ onAddStep }: AddStepButtonProps) {
  const grouped = ACTION_OPTIONS.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = [];
    }
    acc[option.category].push(option);
    return acc;
  }, {} as Record<string, ActionOption[]>);

  const categories = ["communication", "crm", "flow", "integrations"];

  return (
    <div className="flex justify-center py-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 border-dashed">
            <Plus className="h-4 w-4" />
            Add Step
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64">
          {categories.map((category, idx) => (
            <div key={category}>
              {idx > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel>{CATEGORY_LABELS[category]}</DropdownMenuLabel>
              <DropdownMenuGroup>
                {grouped[category]?.map((option) => (
                  <DropdownMenuItem
                    key={option.type}
                    onClick={() => onAddStep(option.type)}
                    className="flex items-start gap-3 cursor-pointer py-2"
                  >
                    <div className="mt-0.5">{option.icon}</div>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
