import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TemplateVariablePicker } from "../TemplateVariablePicker";
import { useRef } from "react";

interface SendReviewRequestConfig {
  platform: "google" | "facebook" | "yelp" | "trustpilot" | "custom";
  message: string;
  reviewUrl?: string;
  channel: "sms" | "email";
}

interface SendReviewRequestFormProps {
  config: SendReviewRequestConfig;
  onChange: (config: SendReviewRequestConfig) => void;
}

export function SendReviewRequestForm({ config, onChange }: SendReviewRequestFormProps) {
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertVariable = (variable: string) => {
    if (messageRef.current) {
      const el = messageRef.current;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const current = config.message || "";
      const newValue = current.substring(0, start) + variable + current.substring(end);
      onChange({ ...config, message: newValue });
      setTimeout(() => { el.focus(); el.setSelectionRange(start + variable.length, start + variable.length); }, 0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Review Platform</Label>
        <Select
          value={config.platform || "google"}
          onValueChange={(value: SendReviewRequestConfig["platform"]) => onChange({ ...config, platform: value })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="google">Google</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="yelp">Yelp</SelectItem>
            <SelectItem value="trustpilot">Trustpilot</SelectItem>
            <SelectItem value="custom">Custom URL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reviewUrl">Review Page URL</Label>
        <Input
          id="reviewUrl"
          placeholder="https://g.page/r/your-business/review"
          value={config.reviewUrl || ""}
          onChange={(e) => onChange({ ...config, reviewUrl: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Send Via</Label>
        <Select
          value={config.channel || "sms"}
          onValueChange={(value: "sms" | "email") => onChange({ ...config, channel: value })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="message">Message</Label>
          <TemplateVariablePicker onInsert={handleInsertVariable} triggerLabel="Insert Variable" />
        </div>
        <Textarea
          ref={messageRef}
          id="message"
          placeholder="Hi {{lead.first_name}}, we'd love your feedback! Please leave us a review: {{review_url}}"
          value={config.message || ""}
          onChange={(e) => onChange({ ...config, message: e.target.value })}
          rows={4}
          className="font-mono text-sm"
        />
      </div>
    </div>
  );
}
