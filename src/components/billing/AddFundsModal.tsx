import React, { useState } from "react";
import { Loader2, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddFundsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  onSuccess: () => void;
}

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];

export const AddFundsModal = React.forwardRef<HTMLDivElement, AddFundsModalProps>(
  function AddFundsModal({ open, onOpenChange, teamId, onSuccess }, ref) {
    const [amount, setAmount] = useState("10");
    const [isLoading, setIsLoading] = useState(false);

    const amountNumber = parseFloat(amount) || 0;
    const isValidAmount = amountNumber >= 5;

    const handleAddFunds = async () => {
      if (!isValidAmount) {
        toast.error("Minimum deposit is $5.00");
        return;
      }

      setIsLoading(true);
      try {
        const amountCents = Math.round(amountNumber * 100);

        const response = await supabase.functions.invoke("add-wallet-funds", {
          body: {
            teamId,
            amountCents,
          },
        });

        if (response.error) {
          throw new Error(response.error.message || "Failed to add funds");
        }

        if (!response.data?.success) {
          throw new Error(response.data?.error || "Payment failed");
        }

        const newBalance = (response.data.newBalanceCents / 100).toFixed(2);
        toast.success(`$${amountNumber.toFixed(2)} added! New balance: $${newBalance}`);
        onSuccess();
        onOpenChange(false);
      } catch (error) {
        console.error("Add funds error:", error);
        toast.error(error instanceof Error ? error.message : "Failed to add funds");
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent ref={ref} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Funds to Wallet</DialogTitle>
            <DialogDescription>
              Your card on file will be charged immediately. Minimum deposit is $5.00.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex flex-wrap gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <Button
                  key={preset}
                  variant={amountNumber === preset ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAmount(preset.toString())}
                >
                  ${preset}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Custom Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  min="5"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-9"
                  placeholder="5.00"
                />
              </div>
              {!isValidAmount && amount !== "" && (
                <p className="text-xs text-destructive">Minimum deposit is $5.00</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleAddFunds} disabled={!isValidAmount || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Add $${amountNumber.toFixed(2)}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);
