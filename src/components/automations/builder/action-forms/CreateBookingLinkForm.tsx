import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface CreateBookingLinkConfig {
  calendarId?: string;
  expiresIn?: string;
  customSlug?: string;
  oneTimeUse?: boolean;
}

interface CreateBookingLinkFormProps {
  config: CreateBookingLinkConfig;
  onChange: (config: CreateBookingLinkConfig) => void;
}

export function CreateBookingLinkForm({ config, onChange }: CreateBookingLinkFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="calendarId">Calendar</Label>
        <Input
          id="calendarId"
          placeholder="Enter calendar ID or name"
          value={config.calendarId || ""}
          onChange={(e) => onChange({ ...config, calendarId: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="customSlug">Custom URL Slug (optional)</Label>
        <Input
          id="customSlug"
          placeholder="e.g., discovery-call"
          value={config.customSlug || ""}
          onChange={(e) => onChange({ ...config, customSlug: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">Custom link path for this booking</p>
      </div>

      <div className="space-y-2">
        <Label>Link Expiration</Label>
        <Select
          value={config.expiresIn || "never"}
          onValueChange={(value) => onChange({ ...config, expiresIn: value })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="never">Never</SelectItem>
            <SelectItem value="1h">1 hour</SelectItem>
            <SelectItem value="24h">24 hours</SelectItem>
            <SelectItem value="48h">48 hours</SelectItem>
            <SelectItem value="7d">7 days</SelectItem>
            <SelectItem value="30d">30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 p-3">
        <div>
          <Label htmlFor="one-time-toggle" className="cursor-pointer">One-Time Use</Label>
          <p className="text-xs text-muted-foreground">Link becomes invalid after first booking</p>
        </div>
        <Switch
          id="one-time-toggle"
          checked={config.oneTimeUse || false}
          onCheckedChange={(checked) => onChange({ ...config, oneTimeUse: checked })}
        />
      </div>
    </div>
  );
}
