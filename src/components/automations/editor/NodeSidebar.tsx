import { useState } from "react";
import {
  Search,
  MessageSquare,
  Clock,
  Tag,
  ClipboardList,
  UserCheck,
  ArrowRightLeft,
  Bell,
  Webhook,
  GitBranch,
  ChevronDown,
  ChevronRight,
  UserPlus,
  UserCog,
  StickyNote,
  Briefcase,
  CheckCircle,
  CalendarClock,
  Building2,
  Split,
  CornerDownRight,
  PlayCircle,
  StopCircle,
  Phone,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ActionType } from "@/lib/automations/types";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NodeSidebarProps {
  onAddNode: (type: ActionType) => void;
}

interface NodeOption {
  type: ActionType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface NodeCategory {
  id: string;
  label: string;
  nodes: NodeOption[];
}

const NODE_CATEGORIES: NodeCategory[] = [
  {
    id: "messaging",
    label: "Messaging",
    nodes: [
      {
        type: "send_message",
        label: "Send Message",
        description: "SMS, Email, or Voice",
        icon: <MessageSquare className="h-4 w-4" />,
        color: "text-blue-400",
      },
      {
        type: "notify_team",
        label: "Notify Team",
        description: "Alert team members",
        icon: <Bell className="h-4 w-4" />,
        color: "text-yellow-400",
      },
    ],
  },
  {
    id: "crm",
    label: "CRM Actions",
    nodes: [
      {
        type: "add_tag",
        label: "Add Tag",
        description: "Tag the lead for segmentation",
        icon: <Tag className="h-4 w-4" />,
        color: "text-green-400",
      },
      {
        type: "remove_tag",
        label: "Remove Tag",
        description: "Remove a tag from lead",
        icon: <Tag className="h-4 w-4" />,
        color: "text-red-400",
      },
      {
        type: "create_contact",
        label: "Create Contact",
        description: "Add a new contact",
        icon: <UserPlus className="h-4 w-4" />,
        color: "text-emerald-400",
      },
      {
        type: "update_contact",
        label: "Update Contact",
        description: "Modify contact fields",
        icon: <UserCog className="h-4 w-4" />,
        color: "text-sky-400",
      },
      {
        type: "add_task",
        label: "Create Task",
        description: "Assign a follow-up task",
        icon: <ClipboardList className="h-4 w-4" />,
        color: "text-purple-400",
      },
      {
        type: "add_note",
        label: "Add Note",
        description: "Add a note to record",
        icon: <StickyNote className="h-4 w-4" />,
        color: "text-amber-400",
      },
      {
        type: "assign_owner",
        label: "Assign Owner",
        description: "Set lead or deal owner",
        icon: <UserCheck className="h-4 w-4" />,
        color: "text-cyan-400",
      },
    ],
  },
  {
    id: "pipeline",
    label: "Pipeline",
    nodes: [
      {
        type: "update_stage",
        label: "Update Stage",
        description: "Move in pipeline",
        icon: <ArrowRightLeft className="h-4 w-4" />,
        color: "text-indigo-400",
      },
      {
        type: "create_deal",
        label: "Create Deal",
        description: "Create a new deal",
        icon: <Briefcase className="h-4 w-4" />,
        color: "text-violet-400",
      },
      {
        type: "close_deal",
        label: "Close Deal",
        description: "Mark deal as won/lost",
        icon: <CheckCircle className="h-4 w-4" />,
        color: "text-primary",
      },
    ],
  },
  {
    id: "flow",
    label: "Flow Control",
    nodes: [
      {
        type: "time_delay",
        label: "Wait",
        description: "Pause before next step",
        icon: <Clock className="h-4 w-4" />,
        color: "text-primary",
      },
      {
        type: "wait_until",
        label: "Wait Until",
        description: "Wait until date/time",
        icon: <CalendarClock className="h-4 w-4" />,
        color: "text-primary",
      },
      {
        type: "business_hours",
        label: "Business Hours",
        description: "Wait for business hours",
        icon: <Building2 className="h-4 w-4" />,
        color: "text-teal-400",
      },
      {
        type: "condition",
        label: "If / Else",
        description: "Branch based on conditions",
        icon: <GitBranch className="h-4 w-4" />,
        color: "text-primary",
      },
      {
        type: "split_test",
        label: "A/B Split",
        description: "Random split testing",
        icon: <Split className="h-4 w-4" />,
        color: "text-primary",
      },
      {
        type: "go_to",
        label: "Go To",
        description: "Jump to another step",
        icon: <CornerDownRight className="h-4 w-4" />,
        color: "text-slate-400",
      },
      {
        type: "run_workflow",
        label: "Run Workflow",
        description: "Trigger another automation",
        icon: <PlayCircle className="h-4 w-4" />,
        color: "text-primary",
      },
      {
        type: "stop_workflow",
        label: "Stop",
        description: "End this workflow",
        icon: <StopCircle className="h-4 w-4" />,
        color: "text-red-500",
      },
    ],
  },
  {
    id: "integrations",
    label: "Integrations",
    nodes: [
      {
        type: "custom_webhook",
        label: "Webhook",
        description: "Call external API",
        icon: <Webhook className="h-4 w-4" />,
        color: "text-gray-400",
      },
      {
        type: "enqueue_dialer",
        label: "Power Dialer",
        description: "Add to dialer queue",
        icon: <Phone className="h-4 w-4" />,
        color: "text-red-400",
      },
    ],
  },
];

export function NodeSidebar({ onAddNode }: NodeSidebarProps) {
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    NODE_CATEGORIES.map((c) => c.id)
  );

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const filteredCategories = NODE_CATEGORIES.map((category) => ({
    ...category,
    nodes: category.nodes.filter(
      (node) =>
        node.label.toLowerCase().includes(search.toLowerCase()) ||
        node.description.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((category) => category.nodes.length > 0);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search nodes..."
          className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
        />
      </div>

      {/* Categories */}
      <div className="space-y-2">
        {filteredCategories.map((category) => (
          <Collapsible
            key={category.id}
            open={expandedCategories.includes(category.id)}
            onOpenChange={() => toggleCategory(category.id)}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors">
              <span className="text-xs font-medium text-white/60 uppercase tracking-wide">
                {category.label}
              </span>
              {expandedCategories.includes(category.id) ? (
                <ChevronDown className="h-3 w-3 text-white/40" />
              ) : (
                <ChevronRight className="h-3 w-3 text-white/40" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-1 mt-1">
                {category.nodes.map((node) => (
                  <button
                    key={node.type}
                    onClick={() => onAddNode(node.type)}
                    className="w-full flex items-start gap-3 p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.08] border border-transparent hover:border-white/10 transition-all group"
                  >
                    <div
                      className={cn(
                        "p-2 rounded-md bg-white/5 group-hover:bg-white/10 transition-colors",
                        node.color
                      )}
                    >
                      {node.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-white">
                        {node.label}
                      </div>
                      <div className="text-xs text-white/50 mt-0.5">
                        {node.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
