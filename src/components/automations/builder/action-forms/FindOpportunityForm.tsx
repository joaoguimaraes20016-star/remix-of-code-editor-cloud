import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search } from "lucide-react";

interface FindOpportunityConfig {
  email?: string;
  phone?: string;
  pipelineStage?: string;
  status?: string;
  searchOrder?: "earliest" | "latest";
  failIfNotFound?: boolean;
}

interface FindOpportunityFormProps {
  config: FindOpportunityConfig;
  onChange: (config: FindOpportunityConfig) => void;
}

export function FindOpportunityForm({ config, onChange }: FindOpportunityFormProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-start gap-3">
          <Search className="h-5 w-5 text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Find Opportunity</p>
            <p className="text-xs text-muted-foreground mt-1">
              Search for an existing opportunity linked to the current contact. All filters use AND logic.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Contact Email (optional)</Label>
        <Input
          id="email"
          placeholder="e.g., {{lead.email}}"
          value={config.email || ""}
          onChange={(e) => onChange({ ...config, email: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Use template variables like {"{{lead.email}}"} for dynamic lookups
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Contact Phone (optional)</Label>
        <Input
          id="phone"
          placeholder="e.g., {{lead.phone}}"
          value={config.phone || ""}
          onChange={(e) => onChange({ ...config, phone: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Pipeline Stage (optional)</Label>
        <Select
          value={config.pipelineStage || ""}
          onValueChange={(v) => onChange({ ...config, pipelineStage: v || undefined })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="booked">Booked</SelectItem>
            <SelectItem value="showed">Showed</SelectItem>
            <SelectItem value="no_show">No Show</SelectItem>
            <SelectItem value="deposit">Deposit</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Search Order</Label>
        <Select
          value={config.searchOrder || "latest"}
          onValueChange={(v) => onChange({ ...config, searchOrder: v as "earliest" | "latest" })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest (most recent)</SelectItem>
            <SelectItem value="earliest">Earliest (first created)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Choose whether to find the most recent or oldest matching opportunity
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Fail If Not Found</Label>
          <p className="text-xs text-muted-foreground">Skip remaining steps if opportunity not found</p>
        </div>
        <Switch
          checked={config.failIfNotFound ?? false}
          onCheckedChange={(v) => onChange({ ...config, failIfNotFound: v })}
        />
      </div>
    </div>
  );
}
