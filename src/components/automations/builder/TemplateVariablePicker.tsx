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
import { Plus, User, Calendar, Users, Hash } from "lucide-react";

interface TemplateVariablePickerProps {
  onInsert: (variable: string) => void;
  triggerLabel?: string;
}

interface VariableGroup {
  label: string;
  icon: React.ReactNode;
  variables: { key: string; label: string; description?: string }[];
}

const VARIABLE_GROUPS: VariableGroup[] = [
  {
    label: "Lead",
    icon: <User className="h-4 w-4" />,
    variables: [
      { key: "lead.first_name", label: "First Name", description: "Lead's first name" },
      { key: "lead.last_name", label: "Last Name", description: "Lead's last name" },
      { key: "lead.email", label: "Email", description: "Lead's email address" },
      { key: "lead.phone", label: "Phone", description: "Lead's phone number" },
      { key: "lead.name", label: "Full Name", description: "Lead's full name" },
    ],
  },
  {
    label: "Appointment",
    icon: <Calendar className="h-4 w-4" />,
    variables: [
      { key: "appointment.date", label: "Date", description: "Appointment date" },
      { key: "appointment.time", label: "Time", description: "Appointment time" },
      { key: "appointment.meeting_link", label: "Meeting Link", description: "Video call URL" },
      { key: "appointment.product_name", label: "Product", description: "Product name" },
    ],
  },
  {
    label: "Team",
    icon: <Users className="h-4 w-4" />,
    variables: [
      { key: "team.name", label: "Team Name", description: "Your team name" },
      { key: "setter.name", label: "Setter Name", description: "Assigned setter" },
      { key: "closer.name", label: "Closer Name", description: "Assigned closer" },
    ],
  },
  {
    label: "Other",
    icon: <Hash className="h-4 w-4" />,
    variables: [
      { key: "current_date", label: "Current Date", description: "Today's date" },
      { key: "current_time", label: "Current Time", description: "Current time" },
    ],
  },
];

export function TemplateVariablePicker({ onInsert, triggerLabel = "Insert Variable" }: TemplateVariablePickerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          {triggerLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        {VARIABLE_GROUPS.map((group, index) => (
          <div key={group.label}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="flex items-center gap-2">
              {group.icon}
              {group.label}
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {group.variables.map((variable) => (
                <DropdownMenuItem
                  key={variable.key}
                  onClick={() => onInsert(`{{${variable.key}}}`)}
                  className="flex flex-col items-start gap-0.5 cursor-pointer"
                >
                  <span className="font-medium">{variable.label}</span>
                  {variable.description && (
                    <span className="text-xs text-muted-foreground">
                      {`{{${variable.key}}}`}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
