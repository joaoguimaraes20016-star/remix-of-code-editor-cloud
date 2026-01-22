import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CreditCard } from "lucide-react";

const US_STATES = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" }, { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" }, { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" }, { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" }, { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" }, { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" }, { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" }, { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" }, { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
];

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
];

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
  const [cardholderName, setCardholderName] = useState("");
  const [billingAddress, setBillingAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
  });

  const isFormValid = 
    cardComplete && 
    cardholderName.trim().length >= 2 &&
    billingAddress.line1.trim() &&
    billingAddress.city.trim() &&
    billingAddress.state.trim() &&
    billingAddress.postal_code.trim() &&
    billingAddress.country;

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

      // 2. Confirm card setup with billing details
      const { setupIntent, error: confirmError } = await stripe.confirmCardSetup(
        setupData.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: cardholderName,
              address: {
                line1: billingAddress.line1,
                line2: billingAddress.line2 || undefined,
                city: billingAddress.city,
                state: billingAddress.state,
                postal_code: billingAddress.postal_code,
                country: billingAddress.country,
              },
            },
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Cardholder Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Cardholder name
        </label>
        <Input
          placeholder="John Doe"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {/* Card Details */}
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
      </div>

      {/* Billing Address */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Billing address
        </label>
        
        <Input
          placeholder="Street address"
          value={billingAddress.line1}
          onChange={(e) => setBillingAddress(prev => ({ ...prev, line1: e.target.value }))}
          disabled={isLoading}
        />
        
        <Input
          placeholder="Apt, suite, etc. (optional)"
          value={billingAddress.line2}
          onChange={(e) => setBillingAddress(prev => ({ ...prev, line2: e.target.value }))}
          disabled={isLoading}
        />
        
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="City"
            value={billingAddress.city}
            onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
            disabled={isLoading}
          />
          
          {billingAddress.country === "US" ? (
            <Select
              value={billingAddress.state}
              onValueChange={(value) => setBillingAddress(prev => ({ ...prev, state: value }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder="State / Province"
              value={billingAddress.state}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, state: e.target.value }))}
              disabled={isLoading}
            />
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="ZIP / Postal code"
            value={billingAddress.postal_code}
            onChange={(e) => setBillingAddress(prev => ({ ...prev, postal_code: e.target.value }))}
            disabled={isLoading}
          />
          
          <Select
            value={billingAddress.country}
            onValueChange={(value) => setBillingAddress(prev => ({ ...prev, country: value, state: "" }))}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.value} value={country.value}>
                  {country.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <CreditCard className="h-3 w-3" />
        Your card will be saved securely for future charges
      </p>

      <div className="flex gap-3 pt-2">
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
          disabled={!stripe || !isFormValid || isLoading}
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
