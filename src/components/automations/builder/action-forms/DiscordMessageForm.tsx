import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TemplateVariablePicker } from "../TemplateVariablePicker";
import { useRef } from "react";

interface DiscordMessageConfig {
  channel_id: string;
  message: string;
  embed_title?: string;
  embed_description?: string;
}

interface DiscordMessageFormProps {
  config: DiscordMessageConfig;
  onChange: (config: DiscordMessageConfig) => void;
}

export function DiscordMessageForm({ config, onChange }: DiscordMessageFormProps) {
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertVariable = (variable: string) => {
    const textarea = messageRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentMessage = config.message || "";
    const newMessage =
      currentMessage.substring(0, start) +
      `{{${variable}}}` +
      currentMessage.substring(end);

    onChange({ ...config, message: newMessage });

    setTimeout(() => {
      textarea.focus();
      const newPos = start + variable.length + 4;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  return (
    <div className="space-y-4">
      {/* Channel ID */}
      <div className="space-y-2">
        <Label>Channel ID</Label>
        <Input
          placeholder="1234567890123456789"
          value={config.channel_id || ""}
          onChange={(e) => onChange({ ...config, channel_id: e.target.value })}
        />
        <p className="text-xs text-white/40">
          Right-click a channel in Discord &gt; Copy Channel ID (enable Developer Mode in Discord settings)
        </p>
      </div>

      {/* Message */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Message</Label>
          <TemplateVariablePicker onInsert={handleInsertVariable} />
        </div>
        <Textarea
          ref={messageRef}
          placeholder="New lead: {{lead.name}} ({{lead.email}})"
          value={config.message || ""}
          onChange={(e) => onChange({ ...config, message: e.target.value })}
          rows={4}
        />
      </div>

      {/* Optional: Embed Title */}
      <div className="space-y-2">
        <Label>Embed Title (optional)</Label>
        <Input
          placeholder="New Lead Alert"
          value={config.embed_title || ""}
          onChange={(e) => onChange({ ...config, embed_title: e.target.value })}
        />
        <p className="text-xs text-white/40">
          Add a rich embed card to the message
        </p>
      </div>

      {/* Optional: Embed Description */}
      {config.embed_title && (
        <div className="space-y-2">
          <Label>Embed Description (optional)</Label>
          <Textarea
            placeholder="Lead details will appear here"
            value={config.embed_description || ""}
            onChange={(e) => onChange({ ...config, embed_description: e.target.value })}
            rows={2}
          />
        </div>
      )}
    </div>
  );
}
