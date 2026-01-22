import { useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);
  const maxPolls = 15; // 30 seconds at 2s intervals
  const setupStatus = searchParams.get("setup");

  const isSyncing = setupStatus === "success" && !billing?.stripe_payment_method_id;

  const clearSetupParam = useCallback(() => {
    if (searchParams.has("setup")) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("setup");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    pollCountRef.current = 0;
  }, []);

  useEffect(() => {
    // If setup=success and we already have a payment method, just clean up
    if (setupStatus === "success" && billing?.stripe_payment_method_id) {
      toast.success("Payment method saved successfully!");
      clearSetupParam();
      stopPolling();
      return;
    }

    // If setup=success but no payment method yet, start polling
    if (setupStatus === "success" && !billing?.stripe_payment_method_id && !isLoading) {
      // Don't start a new poll if one is already running
      if (pollIntervalRef.current) return;

      toast.loading("Finalizing payment method...", { id: "billing-sync" });

      pollIntervalRef.current = setInterval(async () => {
        pollCountRef.current += 1;
        
        try {
          await refetch();
        } catch (error) {
          console.error("[BillingSync] Refetch error:", error);
        }

        if (pollCountRef.current >= maxPolls) {
          stopPolling();
          toast.dismiss("billing-sync");
          toast.error("Taking longer than expected. Please click 'Refresh Status'.");
          clearSetupParam();
        }
      }, 2000);
    }

    // Cleanup on unmount
    return () => {
      stopPolling();
    };
  }, [setupStatus, billing?.stripe_payment_method_id, isLoading, refetch, clearSetupParam, stopPolling]);

  // Handle cancelled setup
  useEffect(() => {
    if (setupStatus === "cancelled") {
      toast.error("Card setup was cancelled");
      clearSetupParam();
    }
  }, [setupStatus, clearSetupParam]);

  return { isSyncing, stopPolling };
}
