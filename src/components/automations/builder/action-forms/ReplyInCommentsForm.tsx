import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TemplateVariablePicker } from "../TemplateVariablePicker";
import { useRef } from "react";

interface ReplyInCommentsConfig {
  platform: "facebook" | "instagram" | "google";
  replyText: string;
  sendDm?: boolean;
}

interface ReplyInCommentsFormProps {
  config: ReplyInCommentsConfig;
  onChange: (config: ReplyInCommentsConfig) => void;
}

export function ReplyInCommentsForm({ config, onChange }: ReplyInCommentsFormProps) {
  const replyRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertVariable = (variable: string) => {
    if (replyRef.current) {
      const el = replyRef.current;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const current = config.replyText || "";
      const newValue = current.substring(0, start) + variable + current.substring(end);
      onChange({ ...config, replyText: newValue });
      setTimeout(() => { el.focus(); el.setSelectionRange(start + variable.length, start + variable.length); }, 0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Platform</Label>
        <Select
          value={config.platform || "facebook"}
          onValueChange={(value: ReplyInCommentsConfig["platform"]) => onChange({ ...config, platform: value })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="google">Google Business</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="replyText">Reply Text</Label>
          <TemplateVariablePicker onInsert={handleInsertVariable} triggerLabel="Insert Variable" />
        </div>
        <Textarea
          ref={replyRef}
          id="replyText"
          placeholder="Thanks for your comment, {{lead.first_name}}! We'll be in touch shortly."
          value={config.replyText || ""}
          onChange={(e) => onChange({ ...config, replyText: e.target.value })}
          rows={3}
          className="font-mono text-sm"
        />
      </div>
    </div>
  );
}
