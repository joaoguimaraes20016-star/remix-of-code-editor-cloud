import { useEffect, useRef, useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);
  const hasHandledSuccessRef = useRef(false);
  const maxPolls = 15;

  // Parse setup status from URL
  const searchParams = new URLSearchParams(location.search);
  const setupStatus = searchParams.get("setup");

  const clearSetupParam = useCallback(() => {
    const params = new URLSearchParams(location.search);
    if (params.has("setup")) {
      params.delete("setup");
      const newSearch = params.toString();
      const newPath = location.pathname + (newSearch ? `?${newSearch}` : "");
      // Use window.history for atomic URL cleanup without React state churn
      window.history.replaceState(null, "", newPath);
    }
  }, [location.pathname, location.search]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    pollCountRef.current = 0;
  }, []);

  const finishSync = useCallback(() => {
    setIsSyncing(false);
    toast.dismiss("billing-sync");
    stopPolling();
    clearSetupParam();
  }, [stopPolling, clearSetupParam]);

  // SAFETY EXIT: If payment method exists, always exit syncing state
  // This is the single source of truth - DB has payment method = we're done
  useEffect(() => {
    if (billing?.stripe_payment_method_id && !hasHandledSuccessRef.current) {
      hasHandledSuccessRef.current = true;
      
      // Only show success toast if we were actually syncing
      if (isSyncing || setupStatus === "success") {
        toast.dismiss("billing-sync");
        toast.success("Payment method saved successfully!");
      }
      
      finishSync();
    }
  }, [billing?.stripe_payment_method_id, isSyncing, setupStatus, finishSync]);

  // Handle setup=success: start syncing if we don't have payment method yet
  useEffect(() => {
    if (setupStatus === "success" && !billing?.stripe_payment_method_id && !isLoading && !hasHandledSuccessRef.current) {
      // Start syncing mode
      if (!isSyncing) {
        setIsSyncing(true);
        toast.loading("Finalizing payment method...", { id: "billing-sync" });
      }

      // Start polling if not already
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(async () => {
          pollCountRef.current += 1;
          
          try {
            await refetch();
          } catch (error) {
            console.error("[BillingSync] Refetch error:", error);
          }

          if (pollCountRef.current >= maxPolls) {
            stopPolling();
            setIsSyncing(false);
            toast.dismiss("billing-sync");
            toast.error("Taking longer than expected. Please click 'Refresh Status'.");
            clearSetupParam();
          }
        }, 2000);
      }
    }

    return () => {
      // Cleanup on unmount only - don't stop on every render
    };
  }, [setupStatus, billing?.stripe_payment_method_id, isLoading, isSyncing, refetch, stopPolling, clearSetupParam]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Handle cancelled setup
  useEffect(() => {
    if (setupStatus === "cancelled") {
      toast.error("Card setup was cancelled");
      clearSetupParam();
    }
  }, [setupStatus, clearSetupParam]);

  return { isSyncing, stopPolling };
}
