import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TemplateVariablePicker } from "../TemplateVariablePicker";
import { useRef } from "react";

interface AddTaskConfig {
  title: string;
  description?: string;
  assignTo: "setter" | "closer" | "admin" | "specific";
  specificUserId?: string;
}

interface AddTaskFormProps {
  config: AddTaskConfig;
  onChange: (config: AddTaskConfig) => void;
}

export function AddTaskForm({ config, onChange }: AddTaskFormProps) {
  const titleRef = useRef<HTMLInputElement>(null);

  const handleInsertVariable = (variable: string) => {
    if (titleRef.current) {
      const input = titleRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newValue =
        config.title.substring(0, start) +
        variable +
        config.title.substring(end);
      onChange({ ...config, title: newValue });
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="title">Task Title</Label>
          <TemplateVariablePicker onInsert={handleInsertVariable} triggerLabel="Insert" />
        </div>
        <Input
          ref={titleRef}
          id="title"
          placeholder="e.g., Follow up with {{lead.first_name}}"
          value={config.title || ""}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          placeholder="Additional notes for the task..."
          value={config.description || ""}
          onChange={(e) => onChange({ ...config, description: e.target.value })}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Assign To</Label>
        <Select
          value={config.assignTo || "setter"}
          onValueChange={(value: AddTaskConfig["assignTo"]) =>
            onChange({ ...config, assignTo: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="setter">Assigned Setter</SelectItem>
            <SelectItem value="closer">Assigned Closer</SelectItem>
            <SelectItem value="admin">Team Admin</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Task will be assigned based on the lead's current assignment
        </p>
      </div>
    </div>
  );
}
