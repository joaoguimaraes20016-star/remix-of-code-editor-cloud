import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, HelpCircle } from "lucide-react";
import { TemplateVariablePicker } from "../TemplateVariablePicker";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ColumnMapping {
  column: string;
  value: string;
}

interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
  values: ColumnMapping[];
}

interface GoogleSheetsFormProps {
  config: GoogleSheetsConfig;
  onChange: (config: GoogleSheetsConfig) => void;
}

function extractSpreadsheetId(input: string): string {
  // If it's already just an ID (no slashes), return as-is
  if (!input.includes("/")) {
    return input.trim();
  }

  // Try to extract from Google Sheets URL
  // Format: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit...
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    return match[1];
  }

  return input.trim();
}

export function GoogleSheetsForm({ config, onChange }: GoogleSheetsFormProps) {
  const spreadsheetId = config.spreadsheetId || "";
  const sheetName = config.sheetName || "Sheet1";
  const values = config.values || [{ column: "A", value: "" }];

  const handleSpreadsheetChange = (input: string) => {
    const extractedId = extractSpreadsheetId(input);
    onChange({ ...config, spreadsheetId: extractedId });
  };

  const handleSheetNameChange = (name: string) => {
    onChange({ ...config, sheetName: name });
  };

  const handleColumnChange = (index: number, field: "column" | "value", newValue: string) => {
    const newValues = [...values];
    newValues[index] = { ...newValues[index], [field]: newValue };
    onChange({ ...config, values: newValues });
  };

  const handleAddColumn = () => {
    const nextColumn = String.fromCharCode(65 + values.length); // A, B, C, ...
    onChange({
      ...config,
      values: [...values, { column: nextColumn, value: "" }],
    });
  };

  const handleRemoveColumn = (index: number) => {
    if (values.length <= 1) return;
    const newValues = values.filter((_, i) => i !== index);
    onChange({ ...config, values: newValues });
  };

  const handleInsertVariable = (index: number, variable: string) => {
    const currentValue = values[index].value;
    const newValue = currentValue + `{{${variable}}}`;
    handleColumnChange(index, "value", newValue);
  };

  return (
    <div className="space-y-6">
      {/* Spreadsheet URL/ID */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="spreadsheet-id">Spreadsheet URL or ID</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Paste the full Google Sheets URL or just the spreadsheet ID.
                  The ID is the long string of characters in the URL after /d/
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Input
          id="spreadsheet-id"
          value={spreadsheetId}
          onChange={(e) => handleSpreadsheetChange(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/... or spreadsheet ID"
        />
        {spreadsheetId && spreadsheetId.includes("/") && (
          <p className="text-xs text-muted-foreground">
            Extracted ID: {extractSpreadsheetId(spreadsheetId)}
          </p>
        )}
      </div>

      {/* Sheet Name */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="sheet-name">Sheet Name (Tab)</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  The name of the tab/sheet within your spreadsheet. Default is "Sheet1".
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Input
          id="sheet-name"
          value={sheetName}
          onChange={(e) => handleSheetNameChange(e.target.value)}
          placeholder="Sheet1"
        />
      </div>

      {/* Column Mappings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Column Values</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddColumn}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Column
          </Button>
        </div>

        <div className="space-y-3">
          {values.map((mapping, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-16">
                <Input
                  value={mapping.column}
                  onChange={(e) => handleColumnChange(index, "column", e.target.value.toUpperCase())}
                  placeholder="A"
                  className="text-center"
                  maxLength={2}
                />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex gap-1">
                  <Input
                    value={mapping.value}
                    onChange={(e) => handleColumnChange(index, "value", e.target.value)}
                    placeholder="{{lead.name}} or static text"
                    className="flex-1"
                  />
                  <TemplateVariablePicker
                    onInsert={(variable) => handleInsertVariable(index, variable)}
                    triggerLabel=""
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveColumn(index)}
                disabled={values.length <= 1}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Use template variables like <code className="bg-muted px-1 rounded">{"{{lead.name}}"}</code>,{" "}
          <code className="bg-muted px-1 rounded">{"{{lead.email}}"}</code>,{" "}
          <code className="bg-muted px-1 rounded">{"{{appointment.start_at}}"}</code> to insert dynamic data.
        </p>
      </div>
    </div>
  );
}
