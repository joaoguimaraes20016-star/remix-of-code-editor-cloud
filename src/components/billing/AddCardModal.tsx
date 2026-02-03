import { useState, useEffect, lazy, Suspense } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getStripePromise } from "@/lib/stripe";
import { CreditCard, Loader2 } from "lucide-react";

// Lazy load CardForm to prevent Stripe from loading until needed
const CardForm = lazy(() => import("./CardForm").then(module => ({ default: module.CardForm })));

interface AddCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  onSuccess: () => void;
}

export function AddCardModal({ open, onOpenChange, teamId, onSuccess }: AddCardModalProps) {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  const [StripeElements, setStripeElements] = useState<React.ComponentType<any> | null>(null);

  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess();
  };

  // Only load Stripe when modal is actually opened
  // This prevents Stripe from loading on custom domain funnel views
  useEffect(() => {
    if (open && !stripePromise) {
      // Load both Stripe promise and Elements component dynamically
      Promise.all([
        getStripePromise().catch((error) => {
          console.warn("Stripe not available:", error.message);
          return null;
        }),
        import("@stripe/react-stripe-js").then(module => module.Elements).catch((error) => {
          console.warn("Stripe React components not available:", error.message);
          return null;
        })
      ]).then(([promise, Elements]) => {
        if (promise && Elements) {
          setStripePromise(promise);
          setStripeElements(() => Elements);
        }
      });
    }
  }, [open, stripePromise]);

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

        {stripePromise && StripeElements ? (
          <StripeElements stripe={stripePromise}>
            <Suspense fallback={
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            }>
              <CardForm
                teamId={teamId}
                onSuccess={handleSuccess}
                onCancel={() => onOpenChange(false)}
              />
            </Suspense>
          </StripeElements>
        ) : stripePromise === null && StripeElements === null ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Payment form is not available on this domain.
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
