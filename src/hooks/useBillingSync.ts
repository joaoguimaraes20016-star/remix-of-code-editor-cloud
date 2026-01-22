import { useEffect, useRef, useCallback, useState } from "react";
import { toast } from "sonner";

interface TeamBilling {
  stripe_payment_method_id: string | null;
}

interface UseBillingSyncOptions {
  billing: TeamBilling | null;
  refetch: () => Promise<unknown>;
  isLoading: boolean;
}

export function useBillingSync({ billing, refetch, isLoading }: UseBillingSyncOptions) {
  const [isSyncing, setIsSyncing] = useState(false);
  const syncCompleteRef = useRef(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);
  const maxPolls = 15;
  
  // Capture URL params ONCE on mount - prevents re-reading stale values
  const initialSetupStatusRef = useRef<string | null>(
    new URLSearchParams(window.location.search).get("setup")
  );

  const hasPaymentMethod = !!billing?.stripe_payment_method_id;

  const cleanupAndFinish = useCallback((showSuccess = false) => {
    // Stop polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    pollCountRef.current = 0;
    
    // Update state
    setIsSyncing(false);
    syncCompleteRef.current = true;
    initialSetupStatusRef.current = null; // Clear to prevent re-processing
    
    // Handle toasts
    toast.dismiss("billing-sync");
    if (showSuccess) {
      toast.success("Payment method saved successfully!");
    }
    
    // Clean URL
    const params = new URLSearchParams(window.location.search);
    if (params.has("setup")) {
      params.delete("setup");
      const newPath = window.location.pathname + 
        (params.toString() ? `?${params}` : "");
      window.history.replaceState(null, "", newPath);
    }
  }, []);

  // MAIN EFFECT
  useEffect(() => {
    const setupStatus = initialSetupStatusRef.current;
    
    // EARLY EXIT: Already processed or no setup param
    if (syncCompleteRef.current || setupStatus === null) {
      return;
    }

    // Handle cancelled
    if (setupStatus === "cancelled") {
      toast.error("Card setup was cancelled");
      cleanupAndFinish();
      return;
    }

    // SUCCESS - payment method exists
    if (setupStatus === "success" && hasPaymentMethod) {
      console.log("[BillingSync] Success: payment method found");
      cleanupAndFinish(true);
      return;
    }

    // Still loading - wait
    if (setupStatus === "success" && isLoading) {
      if (!isSyncing) {
        toast.loading("Finalizing payment method...", { id: "billing-sync" });
      }
      return;
    }

    // Need to poll
    if (setupStatus === "success" && !hasPaymentMethod && !isLoading) {
      if (!isSyncing) {
        setIsSyncing(true);
        toast.loading("Finalizing payment method...", { id: "billing-sync" });
      }

      if (!pollIntervalRef.current) {
        pollCountRef.current = 0;
        pollIntervalRef.current = setInterval(async () => {
          pollCountRef.current++;
          try {
            await refetch();
          } catch (error) {
            console.error("[BillingSync] Refetch error:", error);
          }
          if (pollCountRef.current >= maxPolls) {
            toast.error("Taking longer than expected. Please refresh.");
            cleanupAndFinish();
          }
        }, 2000);
      }
    }
  }, [hasPaymentMethod, isLoading, isSyncing, refetch, cleanupAndFinish]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  return { isSyncing };
}
