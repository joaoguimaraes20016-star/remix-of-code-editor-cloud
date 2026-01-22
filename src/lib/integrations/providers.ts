// src/lib/integrations/providers.ts
import type {
  RevenueCustomer,
  RevenueSubscription,
  RevenuePaymentEvent,
  RevenueProviderId,
  OAuthTokenSet,
  NormalizedWebhookEvent,
  StripeInvoiceParams,
  StripeChargeParams,
  StripeSubscriptionParams,
} from './types';

export interface RevenueProvider {
  id: RevenueProviderId;

  // OAuth flow
  getAuthUrl?(params: { teamId: string; redirectUri: string }): string;
  exchangeCode?(params: { code: string; redirectUri: string }): Promise<OAuthTokenSet>;
  refreshToken?(params: { refreshToken: string }): Promise<OAuthTokenSet>;

  // Data sync
  syncCustomer(params: {
    teamId: string;
    externalCustomerId: string;
  }): Promise<RevenueCustomer | null>;

  syncSubscription(params: {
    teamId: string;
    externalSubscriptionId: string;
  }): Promise<RevenueSubscription | null>;

  // Webhook handling
  verifyWebhook?(params: {
    signature: string;
    body: string;
    webhookSecret: string;
  }): boolean;

  handleWebhook(params: {
    teamId: string;
    eventType: string;
    payload: any;
  }): Promise<RevenuePaymentEvent | null>;

  normalizeWebhookEvent?(params: {
    teamId: string;
    event: any;
  }): NormalizedWebhookEvent | null;

  // Portal
  getCustomerPortalUrl?(params: {
    teamId: string;
    externalCustomerId: string;
    returnUrl?: string;
  }): Promise<string | null>;

  // Automation actions (optional - only for providers that support them)
  createInvoice?(params: {
    teamId: string;
    accessToken: string;
    invoice: StripeInvoiceParams;
  }): Promise<{ invoiceId: string; invoiceUrl: string } | null>;

  chargePayment?(params: {
    teamId: string;
    accessToken: string;
    charge: StripeChargeParams;
  }): Promise<{ paymentId: string; status: string } | null>;

  createSubscription?(params: {
    teamId: string;
    accessToken: string;
    subscription: StripeSubscriptionParams;
  }): Promise<{ subscriptionId: string; status: string } | null>;

  cancelSubscription?(params: {
    teamId: string;
    accessToken: string;
    subscriptionId: string;
  }): Promise<{ canceled: boolean } | null>;
}

const providers: Partial<Record<RevenueProviderId, RevenueProvider>> = {};

export const registerRevenueProvider = (provider: RevenueProvider) => {
  providers[provider.id] = provider;
};

export const getRevenueProvider = (
  providerId: RevenueProviderId,
): RevenueProvider | null => {
  return providers[providerId] ?? null;
};

export const getAllProviders = (): RevenueProvider[] => {
  return Object.values(providers).filter(Boolean) as RevenueProvider[];
};
