import { useEffect, useRef, useCallback, useState } from "react";
import { useLocation } from "react-router-dom";
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
  const [isSyncing, setIsSyncing] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);
  const maxPolls = 15;

  // Derived state - computed fresh each render
  const searchParams = new URLSearchParams(location.search);
  const setupStatus = searchParams.get("setup");
  const hasPaymentMethod = !!billing?.stripe_payment_method_id;

  // Single cleanup function - clears everything and optionally shows success
  const cleanupAndFinish = useCallback((showSuccess = false) => {
    // Stop polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    pollCountRef.current = 0;
    
    // Update state
    setIsSyncing(false);
    
    // Handle toasts
    toast.dismiss("billing-sync");
    if (showSuccess) {
      toast.success("Payment method saved successfully!");
    }
    
    // Clean URL atomically using replaceState to avoid React re-render issues
    const params = new URLSearchParams(window.location.search);
    if (params.has("setup")) {
      params.delete("setup");
      const newPath = window.location.pathname + (params.toString() ? `?${params}` : "");
      window.history.replaceState(null, "", newPath);
    }
  }, []);

  // SINGLE EFFECT - handles all setup status states deterministically
  useEffect(() => {
    // SAFETY CHECK 1: If we have payment method but still syncing, stop immediately
    // This handles cases where DB updated but state didn't sync properly
    if (hasPaymentMethod && isSyncing) {
      console.log("[BillingSync] Safety reset: have payment method while syncing");
      cleanupAndFinish(true);
      return;
    }

    // SAFETY CHECK 2: If syncing but no setup param, cleanup wasn't complete
    // This handles the race condition where URL was cleaned but state wasn't
    if (!setupStatus && isSyncing) {
      console.log("[BillingSync] Safety reset: syncing without setup param");
      setIsSyncing(false);
      toast.dismiss("billing-sync");
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // Case 1: No setup param - nothing to do
    if (!setupStatus) {
      return;
    }

    // Case 2: Setup cancelled - show error and cleanup
    if (setupStatus === "cancelled") {
      toast.error("Card setup was cancelled");
      cleanupAndFinish();
      return;
    }

    // Case 3: Setup success + already have payment method = done!
    // This is the KEY fix - check this FIRST before starting any polling
    if (setupStatus === "success" && hasPaymentMethod) {
      cleanupAndFinish(true);
      return;
    }

    // Case 4: Setup success + still loading data = wait
    if (setupStatus === "success" && isLoading) {
      // Don't start syncing yet, data is still loading
      return;
    }

    // Case 5: Setup success + no payment method yet + not loading = poll
    if (setupStatus === "success" && !hasPaymentMethod && !isLoading) {
      // Start syncing if not already
      if (!isSyncing) {
        setIsSyncing(true);
        toast.loading("Finalizing payment method...", { id: "billing-sync" });
      }

      // Start polling if not already
      if (!pollIntervalRef.current) {
        pollCountRef.current = 0;
        pollIntervalRef.current = setInterval(async () => {
          pollCountRef.current++;

          try {
            await refetch();
          } catch (error) {
            console.error("[BillingSync] Refetch error:", error);
          }

          // Give up after max polls
          if (pollCountRef.current >= maxPolls) {
            toast.error("Taking longer than expected. Please refresh the page.");
            cleanupAndFinish();
          }
        }, 2000);
      }
    }
  }, [setupStatus, hasPaymentMethod, isLoading, isSyncing, refetch, cleanupAndFinish]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  return { isSyncing };
}
