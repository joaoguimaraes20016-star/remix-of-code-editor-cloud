// src/lib/integrations/providers.ts
import type {
  RevenueCustomer,
  RevenueSubscription,
  RevenuePaymentEvent,
  RevenueProviderId,
} from './types';

export interface RevenueProvider {
  id: RevenueProviderId;

  syncCustomer(params: {
    teamId: string;
    externalCustomerId: string;
  }): Promise<RevenueCustomer | null>;

  syncSubscription(params: {
    teamId: string;
    externalSubscriptionId: string;
  }): Promise<RevenueSubscription | null>;

  handleWebhook(params: {
    teamId: string;
    eventType: string;
    payload: any;
  }): Promise<RevenuePaymentEvent | null>;

  getCustomerPortalUrl?(params: {
    teamId: string;
    externalCustomerId: string;
    returnUrl?: string;
  }): Promise<string | null>;
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
