import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Percent, RefreshCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CommissionSettingsProps {
  teamId: string;
}

export function CommissionSettings({ teamId }: CommissionSettingsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [setterPercentage, setSetterPercentage] = useState("5");
  const [closerPercentage, setCloserPercentage] = useState("10");

  useEffect(() => {
    loadSettings();
  }, [teamId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('setter_commission_percentage, closer_commission_percentage')
        .eq('id', teamId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSetterPercentage(String(data.setter_commission_percentage || 5));
        setCloserPercentage(String(data.closer_commission_percentage || 10));
      }
    } catch (error: any) {
      console.error('Error loading commission settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const setter = parseFloat(setterPercentage);
    const closer = parseFloat(closerPercentage);

    if (isNaN(setter) || setter < 0 || setter > 100) {
      toast({
        title: 'Invalid setter percentage',
        description: 'Please enter a value between 0 and 100',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(closer) || closer < 0 || closer > 100) {
      toast({
        title: 'Invalid closer percentage',
        description: 'Please enter a value between 0 and 100',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          setter_commission_percentage: setter,
          closer_commission_percentage: closer,
        })
        .eq('id', teamId);

      if (error) throw error;

      toast({
        title: 'Commission settings saved',
        description: 'New commission rates will apply to future sales',
      });
    } catch (error: any) {
      toast({
        title: 'Error saving settings',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      // Get current commission percentages
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('setter_commission_percentage, closer_commission_percentage')
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;

      const setterPct = Number(teamData.setter_commission_percentage) || 5;
      const closerPct = Number(teamData.closer_commission_percentage) || 10;

      // Call the transaction-safe database function
      const { data, error } = await supabase.rpc('recalculate_team_commissions', {
        p_team_id: teamId,
        p_setter_percentage: setterPct,
        p_closer_percentage: closerPct,
      });

      if (error) throw error;

      // Data is an array with one result
      const result = data?.[0];
      
      if (result?.error_message) {
        throw new Error(result.error_message);
      }

      toast({
        title: "Commissions recalculated",
        description: `Successfully updated ${result?.updated_count || 0} sales records with new commission rates.`,
      });
    } catch (error: any) {
      console.error('Error recalculating:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to recalculate commissions",
        variant: "destructive",
      });
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return <div>Loading commission settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5" />
          Commission Rates
        </CardTitle>
        <CardDescription>
          Set the commission percentages for setters and closers. These rates will be used to calculate commissions on Cash Collected (CC).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="setter-percentage">Setter Commission %</Label>
            <Input
              id="setter-percentage"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={setterPercentage}
              onChange={(e) => setSetterPercentage(e.target.value)}
              placeholder="5.0"
            />
            <p className="text-sm text-muted-foreground">
              Current: {setterPercentage}% of CC
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="closer-percentage">Closer Commission %</Label>
            <Input
              id="closer-percentage"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={closerPercentage}
              onChange={(e) => setCloserPercentage(e.target.value)}
              placeholder="10.0"
            />
            <p className="text-sm text-muted-foreground">
              Current: {closerPercentage}% of CC
            </p>
          </div>
        </div>

        <div className="pt-4 flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Commission Rates'}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={recalculating}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                {recalculating ? 'Recalculating...' : 'Recalculate All Commissions'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Recalculate All Commissions</AlertDialogTitle>
                <AlertDialogDescription>
                  This will recalculate commissions for ALL existing sales based on the current commission rates ({setterPercentage}% setter, {closerPercentage}% closer) and the revenue amount. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRecalculate} disabled={recalculating}>
                  Recalculate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="rounded-lg bg-muted p-4 text-sm">
          <p className="font-semibold mb-2">Note:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>These rates apply to Cash Collected (CC) only</li>
            <li>MRR commissions always use the same percentages</li>
            <li>Existing sales are not automatically recalculated</li>
            <li>Use "Recalculate Commissions" button to update existing sales</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}