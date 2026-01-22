import { Elements } from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { stripePromise } from "@/lib/stripe";
import { CardForm } from "./CardForm";
import { CreditCard } from "lucide-react";

interface AddCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  onSuccess: () => void;
}

export function AddCardModal({ open, onOpenChange, teamId, onSuccess }: AddCardModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Add payment method</DialogTitle>
              <DialogDescription>
                Add a card to deposit funds and enable auto-recharge
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Elements stripe={stripePromise}>
          <CardForm
            teamId={teamId}
            onSuccess={handleSuccess}
            onCancel={() => onOpenChange(false)}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}
