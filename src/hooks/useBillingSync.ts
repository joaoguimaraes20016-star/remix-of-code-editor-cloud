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
  const maxPolls = 15;

  // Derived state
  const searchParams = new URLSearchParams(location.search);
  const setupStatus = searchParams.get("setup");
  const hasPaymentMethod = !!billing?.stripe_payment_method_id;

  // Cleanup function - uses React Router navigate for proper state sync
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
    
    // Clean URL using React Router navigate (keeps internal state in sync)
    if (location.search.includes("setup=")) {
      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  // MAIN EFFECT - deterministic state machine with clear priority
  useEffect(() => {
    // PRIORITY 1: Handle cancelled - show error and cleanup
    if (setupStatus === "cancelled") {
      toast.error("Card setup was cancelled");
      cleanupAndFinish();
      return;
    }

    // PRIORITY 2: SUCCESS STATE - payment method exists with setup=success
    // This is the key fix: check this regardless of isSyncing state!
    if (setupStatus === "success" && hasPaymentMethod) {
      console.log("[BillingSync] Success: payment method found, cleaning up");
      cleanupAndFinish(true);
      return;
    }

    // PRIORITY 3: No setup param - ensure no stale sync state
    if (!setupStatus) {
      if (isSyncing) {
        console.log("[BillingSync] Cleaning up stale sync state");
        setIsSyncing(false);
        toast.dismiss("billing-sync");
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
      return;
    }

    // PRIORITY 4: Setup success but still loading - show toast, wait for data
    if (setupStatus === "success" && isLoading) {
      if (!isSyncing) {
        toast.loading("Finalizing payment method...", { id: "billing-sync" });
      }
      return;
    }

    // PRIORITY 5: Setup success + no payment method + not loading = poll
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
