import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateDealConfig {
  name: string;
  value?: string;
  stageId?: string;
  pipelineId?: string;
}

interface CreateDealFormProps {
  config: CreateDealConfig;
  onChange: (config: CreateDealConfig) => void;
}

export function CreateDealForm({ config, onChange }: CreateDealFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Deal Name</Label>
        <Input
          id="name"
          placeholder="{{lead.name}} - New Deal"
          value={config.name || ""}
          onChange={(e) => onChange({ ...config, name: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Use {"{{lead.name}}"} for dynamic naming
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="value">Deal Value ($)</Label>
        <Input
          id="value"
          type="number"
          placeholder="0"
          value={config.value || ""}
          onChange={(e) => onChange({ ...config, value: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Initial Stage</Label>
        <Select
          value={config.stageId || ""}
          onValueChange={(value) => onChange({ ...config, stageId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="proposal">Proposal</SelectItem>
            <SelectItem value="negotiation">Negotiation</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
