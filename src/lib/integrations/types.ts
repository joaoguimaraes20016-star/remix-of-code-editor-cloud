// src/lib/integrations/types.ts

export type RevenueProviderId = 'stripe' | 'whop' | 'fanbasis' | 'manual';

export interface RevenueCustomer {
  id: string; // provider customer id
  email: string | null;
  name: string | null;
}

export interface RevenueSubscription {
  id: string;
  provider: RevenueProviderId;
  customerId: string;
  planId: string;
  status:
    | 'active'
    | 'trialing'
    | 'past_due'
    | 'canceled'
    | 'incomplete';
  currentPeriodEnd: string | null; // ISO
  metadata?: Record<string, any>;
}

export interface RevenuePaymentEvent {
  id: string; // provider event id
  provider: RevenueProviderId;
  teamId: string;
  customerId: string | null;
  amount: number;
  currency: string;
  type: 'initial' | 'renewal' | 'upsell' | 'refund';
  occurredAt: string; // ISO
  raw: any;
}

// OAuth token set for connected accounts
export interface OAuthTokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number; // Unix timestamp
  scope?: string;
  accountId?: string; // Provider-specific account ID
}

// Integration configuration stored in team_integrations
export interface IntegrationConfig {
  provider: RevenueProviderId;
  accountId?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  webhookSecret?: string;
  livemode?: boolean;
  metadata?: Record<string, any>;
}

// Webhook event normalized structure
export interface NormalizedWebhookEvent {
  id: string;
  provider: RevenueProviderId;
  type: string; // e.g., 'payment_intent.succeeded', 'membership.went_valid'
  teamId: string;
  customerId?: string;
  customerEmail?: string;
  amount?: number;
  currency?: string;
  subscriptionId?: string;
  productId?: string;
  occurredAt: string;
  raw: any;
}

// Automation action params for Stripe
export interface StripeInvoiceParams {
  customerId?: string;
  customerEmail?: string;
  items: Array<{
    description: string;
    amount: number; // in cents
    quantity?: number;
  }>;
  dueDate?: string;
  memo?: string;
}

export interface StripeChargeParams {
  customerId?: string;
  customerEmail?: string;
  amount: number; // in cents
  currency?: string;
  description?: string;
  paymentMethodId?: string;
}

export interface StripeSubscriptionParams {
  customerId?: string;
  customerEmail?: string;
  priceId: string;
  trialDays?: number;
  metadata?: Record<string, any>;
}
