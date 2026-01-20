import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useState } from "react";

interface FieldUpdate {
  field: string;
  value: string;
}

interface UpdateContactConfig {
  fields: FieldUpdate[];
}

interface UpdateContactFormProps {
  config: UpdateContactConfig;
  onChange: (config: UpdateContactConfig) => void;
}

const COMMON_FIELDS = [
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "source", label: "Source" },
  { value: "custom_field", label: "Custom Field" },
];

export function UpdateContactForm({ config, onChange }: UpdateContactFormProps) {
  const fields = config.fields || [];

  const addField = () => {
    onChange({
      ...config,
      fields: [...fields, { field: "", value: "" }],
    });
  };

  const updateField = (index: number, update: Partial<FieldUpdate>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...update };
    onChange({ ...config, fields: newFields });
  };

  const removeField = (index: number) => {
    onChange({
      ...config,
      fields: fields.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Fields to Update</Label>
        <p className="text-xs text-muted-foreground">
          Use {"{{variable}}"} syntax for dynamic values
        </p>
      </div>

      {fields.map((field, index) => (
        <div key={index} className="flex gap-2">
          <Input
            placeholder="Field name"
            value={field.field}
            onChange={(e) => updateField(index, { field: e.target.value })}
            className="flex-1"
          />
          <Input
            placeholder="Value or {{variable}}"
            value={field.value}
            onChange={(e) => updateField(index, { value: e.target.value })}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeField(index)}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={addField} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Field
      </Button>
    </div>
  );
}
