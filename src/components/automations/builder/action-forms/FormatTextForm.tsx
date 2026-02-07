import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormatTextConfig {
  input: string;
  operation: string;
  find?: string;
  replace?: string;
  maxLength?: number;
  delimiter?: string;
  index?: number;
  outputVariable: string;
}

interface FormatTextFormProps {
  config: FormatTextConfig;
  onChange: (config: FormatTextConfig) => void;
}

export function FormatTextForm({ config, onChange }: FormatTextFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="input">Input Text</Label>
        <Input
          id="input"
          placeholder="e.g., {{lead.name}}"
          value={config.input || ""}
          onChange={(e) => onChange({ ...config, input: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Operation</Label>
        <Select
          value={config.operation || "trim"}
          onValueChange={(v) => onChange({ ...config, operation: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="uppercase">UPPERCASE</SelectItem>
            <SelectItem value="lowercase">lowercase</SelectItem>
            <SelectItem value="capitalize">Capitalize</SelectItem>
            <SelectItem value="title_case">Title Case</SelectItem>
            <SelectItem value="trim">Trim Whitespace</SelectItem>
            <SelectItem value="slug">Slug (url-friendly)</SelectItem>
            <SelectItem value="truncate">Truncate</SelectItem>
            <SelectItem value="replace">Find & Replace</SelectItem>
            <SelectItem value="extract_email">Extract Email</SelectItem>
            <SelectItem value="extract_phone">Extract Phone</SelectItem>
            <SelectItem value="split">Split & Pick</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.operation === "replace" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="find">Find</Label>
            <Input
              id="find"
              placeholder="Text to find"
              value={config.find || ""}
              onChange={(e) => onChange({ ...config, find: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="replaceWith">Replace With</Label>
            <Input
              id="replaceWith"
              placeholder="Replacement text"
              value={config.replace || ""}
              onChange={(e) => onChange({ ...config, replace: e.target.value })}
            />
          </div>
        </>
      )}

      {config.operation === "truncate" && (
        <div className="space-y-2">
          <Label htmlFor="maxLength">Max Length</Label>
          <Input
            id="maxLength"
            type="number"
            min={1}
            value={config.maxLength ?? 100}
            onChange={(e) => onChange({ ...config, maxLength: parseInt(e.target.value) || 100 })}
          />
        </div>
      )}

      {config.operation === "split" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="delimiter">Delimiter</Label>
            <Input
              id="delimiter"
              placeholder=","
              value={config.delimiter || ","}
              onChange={(e) => onChange({ ...config, delimiter: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="index">Pick Index (0-based)</Label>
            <Input
              id="index"
              type="number"
              min={0}
              value={config.index ?? 0}
              onChange={(e) => onChange({ ...config, index: parseInt(e.target.value) || 0 })}
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="outputVariable">Save As Variable</Label>
        <Input
          id="outputVariable"
          placeholder="formattedText"
          value={config.outputVariable || "formattedText"}
          onChange={(e) => onChange({ ...config, outputVariable: e.target.value })}
        />
      </div>
    </div>
  );
}
