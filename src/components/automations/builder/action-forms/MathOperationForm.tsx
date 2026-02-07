import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MathOperationConfig {
  operation: string;
  valueA: string;
  valueB: string;
  outputVariable: string;
}

interface MathOperationFormProps {
  config: MathOperationConfig;
  onChange: (config: MathOperationConfig) => void;
}

export function MathOperationForm({ config, onChange }: MathOperationFormProps) {
  const needsSecondValue = !["floor", "ceil", "abs"].includes(config.operation || "add");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Operation</Label>
        <Select
          value={config.operation || "add"}
          onValueChange={(v) => onChange({ ...config, operation: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="add">Add (+)</SelectItem>
            <SelectItem value="subtract">Subtract (-)</SelectItem>
            <SelectItem value="multiply">Multiply (x)</SelectItem>
            <SelectItem value="divide">Divide (/)</SelectItem>
            <SelectItem value="modulo">Modulo (%)</SelectItem>
            <SelectItem value="power">Power (^)</SelectItem>
            <SelectItem value="min">Minimum</SelectItem>
            <SelectItem value="max">Maximum</SelectItem>
            <SelectItem value="round">Round</SelectItem>
            <SelectItem value="floor">Floor</SelectItem>
            <SelectItem value="ceil">Ceiling</SelectItem>
            <SelectItem value="abs">Absolute Value</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="valueA">Value A</Label>
        <Input
          id="valueA"
          placeholder="e.g., {{deal.value}} or 100"
          value={config.valueA || ""}
          onChange={(e) => onChange({ ...config, valueA: e.target.value })}
        />
      </div>

      {needsSecondValue && (
        <div className="space-y-2">
          <Label htmlFor="valueB">
            {config.operation === "round" ? "Decimal Places" : "Value B"}
          </Label>
          <Input
            id="valueB"
            placeholder={config.operation === "round" ? "2" : "e.g., 1.1 or {{tax_rate}}"}
            value={config.valueB || ""}
            onChange={(e) => onChange({ ...config, valueB: e.target.value })}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="outputVariable">Save As Variable</Label>
        <Input
          id="outputVariable"
          placeholder="mathResult"
          value={config.outputVariable || "mathResult"}
          onChange={(e) => onChange({ ...config, outputVariable: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Access via {"{{stepOutputs.variables.<name>}}"}
        </p>
      </div>
    </div>
  );
}
