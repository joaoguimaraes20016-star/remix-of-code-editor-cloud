import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw } from "lucide-react";
import { useTeamLabels, TeamLabels } from "@/contexts/TeamLabelsContext";
import { toast } from "sonner";

const DEFAULT_LABELS: TeamLabels = {
  role_1: "Setter",
  role_2: "Closer",
  role_1_plural: "Setters",
  role_2_plural: "Closers",
  role_1_short: "S",
  role_2_short: "C",
};

export function TerminologySettings() {
  const { labels, updateLabels, loading: contextLoading } = useTeamLabels();
  const [localLabels, setLocalLabels] = useState<TeamLabels>(labels);
  const [saving, setSaving] = useState(false);

  // Sync local state when context labels change
  useState(() => {
    setLocalLabels(labels);
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateLabels(localLabels);
      toast.success("Terminology saved");
    } catch (error) {
      console.error("Failed to save terminology:", error);
      toast.error("Failed to save terminology");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLocalLabels(DEFAULT_LABELS);
  };

  const updateField = (field: keyof TeamLabels, value: string) => {
    setLocalLabels(prev => ({ ...prev, [field]: value }));
  };

  if (contextLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-violet-500 to-purple-600 text-white">
        <CardTitle className="text-lg text-white">Terminology</CardTitle>
        <CardDescription className="text-white/70">
          Customize role labels used throughout your CRM
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Role 1 (Setter) */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Role 1 (Database: setter)</Label>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="role_1">Singular</Label>
              <Input
                id="role_1"
                value={localLabels.role_1}
                onChange={(e) => updateField("role_1", e.target.value)}
                placeholder="Setter"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role_1_plural">Plural</Label>
              <Input
                id="role_1_plural"
                value={localLabels.role_1_plural}
                onChange={(e) => updateField("role_1_plural", e.target.value)}
                placeholder="Setters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role_1_short">Short</Label>
              <Input
                id="role_1_short"
                value={localLabels.role_1_short}
                onChange={(e) => updateField("role_1_short", e.target.value)}
                placeholder="S"
                maxLength={3}
              />
            </div>
          </div>
        </div>

        {/* Role 2 (Closer) */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Role 2 (Database: closer)</Label>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="role_2">Singular</Label>
              <Input
                id="role_2"
                value={localLabels.role_2}
                onChange={(e) => updateField("role_2", e.target.value)}
                placeholder="Closer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role_2_plural">Plural</Label>
              <Input
                id="role_2_plural"
                value={localLabels.role_2_plural}
                onChange={(e) => updateField("role_2_plural", e.target.value)}
                placeholder="Closers"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role_2_short">Short</Label>
              <Input
                id="role_2_short"
                value={localLabels.role_2_short}
                onChange={(e) => updateField("role_2_short", e.target.value)}
                placeholder="C"
                maxLength={3}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>

        {/* Preview */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <Label className="text-sm font-medium">Preview</Label>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• "{localLabels.role_1_plural} Activity Today" - shows {localLabels.role_1.toLowerCase()} team activity</p>
            <p>• "{localLabels.role_2_plural} Activity Today" - shows {localLabels.role_2.toLowerCase()} team activity</p>
            <p>• Task breakdown: "{localLabels.role_1_short}: 3 · {localLabels.role_2_short}: 2"</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
