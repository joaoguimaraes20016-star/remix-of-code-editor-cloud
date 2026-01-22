import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CreditCard } from "lucide-react";

interface CardFormProps {
  teamId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CardForm({ teamId, onSuccess, onCancel }: CardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe not loaded");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast.error("Card element not found");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Get SetupIntent clientSecret from backend
      const { data: setupData, error: setupError } = await supabase.functions.invoke(
        "create-setup-intent",
        { body: { teamId } }
      );

      if (setupError || !setupData?.clientSecret) {
        throw new Error(setupError?.message || "Failed to create setup intent");
      }

      // 2. Confirm card setup (no redirect!)
      const { setupIntent, error: confirmError } = await stripe.confirmCardSetup(
        setupData.clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (!setupIntent?.payment_method) {
        throw new Error("No payment method returned");
      }

      // 3. Save to our database
      const { error: saveError } = await supabase.functions.invoke(
        "save-payment-method",
        {
          body: {
            teamId,
            paymentMethodId: setupIntent.payment_method,
          },
        }
      );

      if (saveError) {
        throw new Error(saveError.message || "Failed to save payment method");
      }

      toast.success("Card saved successfully!");
      onSuccess();
    } catch (error) {
      console.error("[CardForm] Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save card");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Card details
        </label>
        <div className="p-4 border rounded-lg bg-background">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "hsl(var(--foreground))",
                  "::placeholder": {
                    color: "hsl(var(--muted-foreground))",
                  },
                },
                invalid: {
                  color: "hsl(var(--destructive))",
                },
              },
            }}
            onChange={(e) => setCardComplete(e.complete)}
          />
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <CreditCard className="h-3 w-3" />
          Your card will be saved securely for future charges
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !cardComplete || isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Card"
          )}
        </Button>
      </div>
    </form>
  );
}
