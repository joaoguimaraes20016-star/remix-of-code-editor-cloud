// Shared billing utilities for edge functions
// Handles wallet deductions, refunds, and auto-recharge triggers

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface DeductResult {
  success: boolean;
  newBalanceCents: number;
  shouldAutoRecharge: boolean;
  error?: string;
}

export interface RefundResult {
  success: boolean;
  newBalanceCents: number;
  error?: string;
}

export interface ChannelPrice {
  channel: string;
  unitPriceCents: number;
  unitLabel: string;
}

/**
 * Get the current price for a channel from channel_pricing table
 */
export async function getChannelPrice(
  supabase: SupabaseClient,
  channel: string
): Promise<ChannelPrice | null> {
  const { data, error } = await supabase
    .from("channel_pricing")
    .select("channel, unit_price_cents, unit_label")
    .eq("channel", channel)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    console.error(`[billing] Failed to get price for channel ${channel}:`, error);
    return null;
  }

  return {
    channel: data.channel,
    unitPriceCents: data.unit_price_cents,
    unitLabel: data.unit_label,
  };
}

/**
 * Deduct from team wallet using the deduct_wallet_balance RPC
 * Returns success status, new balance, and whether auto-recharge should be triggered
 */
export async function deductFromWallet(
  supabase: SupabaseClient,
  params: {
    teamId: string;
    amountCents: number;
    channel: string;
    referenceId?: string | null;
    description?: string;
  }
): Promise<DeductResult> {
  const { teamId, amountCents, channel, referenceId, description } = params;

  // Round to nearest cent for very small amounts (fractional cents)
  // We use ceiling to ensure we always charge at least the minimum
  const roundedAmount = Math.max(1, Math.ceil(amountCents * 100) / 100);

  try {
    const { data, error } = await supabase.rpc("deduct_wallet_balance", {
      p_team_id: teamId,
      p_amount_cents: roundedAmount,
      p_channel: channel,
      p_reference_id: referenceId || null,
      p_description: description || `${channel} usage`,
    });

    if (error) {
      console.error("[billing] Wallet deduction failed:", error);
      
      // Check if it's an insufficient balance error
      if (error.message?.includes("Insufficient") || error.code === "P0001") {
        return {
          success: false,
          newBalanceCents: 0,
          shouldAutoRecharge: false,
          error: "Insufficient wallet balance",
        };
      }

      return {
        success: false,
        newBalanceCents: 0,
        shouldAutoRecharge: false,
        error: error.message,
      };
    }

    return {
      success: true,
      newBalanceCents: data?.new_balance_cents || 0,
      shouldAutoRecharge: data?.should_auto_recharge || false,
    };
  } catch (err) {
    console.error("[billing] Exception during wallet deduction:", err);
    return {
      success: false,
      newBalanceCents: 0,
      shouldAutoRecharge: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Refund to team wallet using add_wallet_balance RPC
 * Used when a message/call fails after deduction
 */
export async function refundToWallet(
  supabase: SupabaseClient,
  params: {
    teamId: string;
    amountCents: number;
    channel: string;
    referenceId?: string | null;
    description?: string;
  }
): Promise<RefundResult> {
  const { teamId, amountCents, channel, referenceId, description } = params;

  try {
    const { data, error } = await supabase.rpc("add_wallet_balance", {
      p_team_id: teamId,
      p_amount_cents: Math.ceil(amountCents * 100) / 100,
      p_transaction_type: "refund",
      p_reference_id: referenceId || null,
      p_description: description || `${channel} refund - send failed`,
    });

    if (error) {
      console.error("[billing] Wallet refund failed:", error);
      return {
        success: false,
        newBalanceCents: 0,
        error: error.message,
      };
    }

    return {
      success: true,
      newBalanceCents: data?.new_balance_cents || 0,
    };
  } catch (err) {
    console.error("[billing] Exception during wallet refund:", err);
    return {
      success: false,
      newBalanceCents: 0,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Trigger auto-recharge if needed
 * Calls the auto-recharge edge function
 */
export async function triggerAutoRechargeIfNeeded(
  teamId: string,
  shouldRecharge: boolean
): Promise<void> {
  if (!shouldRecharge) return;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[billing] Cannot trigger auto-recharge: missing env vars");
    return;
  }

  try {
    // Call auto-recharge function asynchronously (fire and forget)
    fetch(`${supabaseUrl}/functions/v1/auto-recharge`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ teamId }),
    }).catch((err) => {
      console.error("[billing] Auto-recharge trigger failed:", err);
    });

    console.log("[billing] Auto-recharge triggered for team:", teamId);
  } catch (err) {
    console.error("[billing] Exception triggering auto-recharge:", err);
  }
}

/**
 * Check wallet balance without deducting
 * Returns current balance and whether it's sufficient
 */
export async function checkWalletBalance(
  supabase: SupabaseClient,
  teamId: string,
  requiredCents: number
): Promise<{ sufficient: boolean; currentBalanceCents: number }> {
  const { data, error } = await supabase
    .from("team_billing")
    .select("wallet_balance_cents")
    .eq("team_id", teamId)
    .single();

  if (error || !data) {
    console.error("[billing] Failed to check wallet balance:", error);
    return { sufficient: false, currentBalanceCents: 0 };
  }

  const currentBalance = data.wallet_balance_cents || 0;
  return {
    sufficient: currentBalance >= requiredCents,
    currentBalanceCents: currentBalance,
  };
}
