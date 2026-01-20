import { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TemplateVariablePicker } from "../TemplateVariablePicker";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell } from "lucide-react";

interface NotifyTeamConfig {
  message: string;
  notifyAdmin?: boolean;
  notifySetter?: boolean;
  notifyCloser?: boolean;
}

interface NotifyTeamFormProps {
  config: NotifyTeamConfig;
  onChange: (config: NotifyTeamConfig) => void;
}

export function NotifyTeamForm({ config, onChange }: NotifyTeamFormProps) {
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertVariable = (variable: string) => {
    if (messageRef.current) {
      const textarea = messageRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue =
        config.message.substring(0, start) +
        variable +
        config.message.substring(end);
      onChange({ ...config, message: newValue });
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="message">Notification Message</Label>
          <TemplateVariablePicker onInsert={handleInsertVariable} triggerLabel="Insert" />
        </div>
        <Textarea
          ref={messageRef}
          id="message"
          placeholder="New lead {{lead.first_name}} just booked an appointment!"
          value={config.message || ""}
          onChange={(e) => onChange({ ...config, message: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <Label>Notify</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="notify-admin"
              checked={config.notifyAdmin ?? true}
              onCheckedChange={(checked) =>
                onChange({ ...config, notifyAdmin: checked as boolean })
              }
            />
            <label htmlFor="notify-admin" className="text-sm cursor-pointer">
              Team Admin
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="notify-setter"
              checked={config.notifySetter ?? false}
              onCheckedChange={(checked) =>
                onChange({ ...config, notifySetter: checked as boolean })
              }
            />
            <label htmlFor="notify-setter" className="text-sm cursor-pointer">
              Assigned Setter
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="notify-closer"
              checked={config.notifyCloser ?? false}
              onCheckedChange={(checked) =>
                onChange({ ...config, notifyCloser: checked as boolean })
              }
            />
            <label htmlFor="notify-closer" className="text-sm cursor-pointer">
              Assigned Closer
            </label>
          </div>
        </div>
      </div>

      {config.message && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50">
          <Bell className="h-4 w-4 mt-0.5 text-primary" />
          <div className="text-sm">
            <span className="font-medium">Preview: </span>
            <span className="text-muted-foreground">{config.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
