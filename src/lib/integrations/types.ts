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
