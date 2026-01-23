import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TemplateVariablePicker } from "../TemplateVariablePicker";
import { useRef } from "react";

interface SlackMessageConfig {
  channel: string;
  message: string;
  username?: string;
  icon_emoji?: string;
}

interface SlackMessageFormProps {
  config: SlackMessageConfig;
  onChange: (config: SlackMessageConfig) => void;
}

export function SlackMessageForm({ config, onChange }: SlackMessageFormProps) {
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

    // Restore cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus();
      const newPos = start + variable.length + 4; // +4 for {{ and }}
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  return (
    <div className="space-y-4">
      {/* Channel */}
      <div className="space-y-2">
        <Label>Channel</Label>
        <Input
          placeholder="#general or C1234567890"
          value={config.channel || ""}
          onChange={(e) => onChange({ ...config, channel: e.target.value })}
        />
        <p className="text-xs text-white/40">
          Enter a channel name (with #) or channel ID
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
          placeholder="Hello {{lead.name}}, your appointment is confirmed!"
          value={config.message || ""}
          onChange={(e) => onChange({ ...config, message: e.target.value })}
          rows={4}
        />
      </div>

      {/* Optional: Username Override */}
      <div className="space-y-2">
        <Label>Bot Username (optional)</Label>
        <Input
          placeholder="InfostackBot"
          value={config.username || ""}
          onChange={(e) => onChange({ ...config, username: e.target.value })}
        />
        <p className="text-xs text-white/40">
          Override the default bot display name
        </p>
      </div>

      {/* Optional: Icon Emoji */}
      <div className="space-y-2">
        <Label>Icon Emoji (optional)</Label>
        <Input
          placeholder=":robot_face:"
          value={config.icon_emoji || ""}
          onChange={(e) => onChange({ ...config, icon_emoji: e.target.value })}
        />
        <p className="text-xs text-white/40">
          Use a Slack emoji as the bot icon (e.g., :bell:)
        </p>
      </div>
    </div>
  );
}
