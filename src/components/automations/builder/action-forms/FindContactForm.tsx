import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface FindContactConfig {
  searchField: string;
  searchValue: string;
  updateTriggerContact?: boolean;
  failIfNotFound?: boolean;
}

interface FindContactFormProps {
  config: FindContactConfig;
  onChange: (config: FindContactConfig) => void;
}

export function FindContactForm({ config, onChange }: FindContactFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Search By</Label>
        <Select
          value={config.searchField || "email"}
          onValueChange={(v) => onChange({ ...config, searchField: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="searchValue">Search Value</Label>
        <Input
          id="searchValue"
          placeholder="e.g., {{lead.email}}"
          value={config.searchValue || ""}
          onChange={(e) => onChange({ ...config, searchValue: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Use template variables like {"{{lead.email}}"} for dynamic lookups
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Update Trigger Contact</Label>
          <p className="text-xs text-muted-foreground">Replace the current contact with the found contact</p>
        </div>
        <Switch
          checked={config.updateTriggerContact ?? false}
          onCheckedChange={(v) => onChange({ ...config, updateTriggerContact: v })}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Fail If Not Found</Label>
          <p className="text-xs text-muted-foreground">Skip remaining steps if contact not found</p>
        </div>
        <Switch
          checked={config.failIfNotFound ?? false}
          onCheckedChange={(v) => onChange({ ...config, failIfNotFound: v })}
        />
      </div>
    </div>
  );
}
