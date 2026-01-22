// supabase/functions/automation-trigger/actions/stripe-actions.ts
// Stripe automation actions for connected user accounts

import type { AutomationContext, StepExecutionLog } from "../types.ts";

type FlexibleConfig = Record<string, unknown>;

interface StripeCredentials {
  accessToken: string;
  accountId: string;
}

// Get Stripe credentials for a team
async function getStripeCredentials(
  supabase: any,
  teamId: string
): Promise<StripeCredentials | null> {
  const { data: integration, error } = await supabase
    .from("team_integrations")
    .select("config")
    .eq("team_id", teamId)
    .eq("provider", "stripe")
    .eq("is_connected", true)
    .single();

  if (error || !integration?.config) {
    return null;
  }

  const config = integration.config as Record<string, any>;
  return {
    accessToken: config.access_token,
    accountId: config.stripe_account_id,
  };
}

// Helper to render template variables in text
function renderTemplate(text: string, context: AutomationContext): string {
  if (!text) return text;
  
  return text.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
    const value = getNestedValue(context, path.trim());
    return value !== undefined ? String(value) : "";
  });
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

// Send Invoice
export async function executeSendInvoice(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  try {
    const credentials = await getStripeCredentials(supabase, context.teamId);
    if (!credentials) {
      log.status = "skipped";
      log.skipReason = "stripe_not_connected";
      return log;
    }

    // Get customer email from config or context
    const customerEmail = renderTemplate(
      (config.customerEmail as string) || "{{lead.email}}",
      context
    );

    if (!customerEmail) {
      log.status = "skipped";
      log.skipReason = "no_customer_email";
      return log;
    }

    const amount = Number(config.amount) || 0;
    const description = renderTemplate(
      (config.description as string) || "Invoice",
      context
    );
    const daysUntilDue = Number(config.daysUntilDue) || 7;

    // First, find or create customer
    const customerResponse = await fetch(
      `https://api.stripe.com/v1/customers?email=${encodeURIComponent(customerEmail)}&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
        },
      }
    );
    const customerData = await customerResponse.json();

    let customerId: string;

    if (customerData.data?.length > 0) {
      customerId = customerData.data[0].id;
    } else {
      // Create new customer
      const createCustomerResponse = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: customerEmail,
          name: context.lead?.name || "",
        }),
      });
      const newCustomer = await createCustomerResponse.json();
      
      if (newCustomer.error) {
        log.status = "error";
        log.error = newCustomer.error.message;
        return log;
      }
      
      customerId = newCustomer.id;
    }

    // Create invoice
    const invoiceResponse = await fetch("https://api.stripe.com/v1/invoices", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        customer: customerId,
        collection_method: "send_invoice",
        days_until_due: String(daysUntilDue),
        auto_advance: "true",
      }),
    });
    const invoice = await invoiceResponse.json();

    if (invoice.error) {
      log.status = "error";
      log.error = invoice.error.message;
      return log;
    }

    // Add invoice item
    await fetch("https://api.stripe.com/v1/invoiceitems", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        customer: customerId,
        invoice: invoice.id,
        amount: String(Math.round(amount * 100)), // Convert to cents
        currency: (config.currency as string) || "usd",
        description: description,
      }),
    });

    // Finalize and send invoice
    const finalizeResponse = await fetch(
      `https://api.stripe.com/v1/invoices/${invoice.id}/finalize`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
        },
      }
    );
    const finalizedInvoice = await finalizeResponse.json();

    // Send the invoice
    await fetch(`https://api.stripe.com/v1/invoices/${invoice.id}/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
      },
    });

    log.output = {
      invoiceId: invoice.id,
      invoiceUrl: finalizedInvoice.hosted_invoice_url,
      customerId,
      amount,
    };

    console.log("[stripe-actions] Invoice sent:", invoice.id);

  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// Charge Payment
export async function executeChargePayment(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  try {
    const credentials = await getStripeCredentials(supabase, context.teamId);
    if (!credentials) {
      log.status = "skipped";
      log.skipReason = "stripe_not_connected";
      return log;
    }

    const customerEmail = renderTemplate(
      (config.customerEmail as string) || "{{lead.email}}",
      context
    );

    if (!customerEmail) {
      log.status = "skipped";
      log.skipReason = "no_customer_email";
      return log;
    }

    const amount = Number(config.amount) || 0;
    const description = renderTemplate(
      (config.description as string) || "Payment",
      context
    );

    // Find customer
    const customerResponse = await fetch(
      `https://api.stripe.com/v1/customers?email=${encodeURIComponent(customerEmail)}&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
        },
      }
    );
    const customerData = await customerResponse.json();

    if (!customerData.data?.length) {
      log.status = "skipped";
      log.skipReason = "customer_not_found";
      return log;
    }

    const customerId = customerData.data[0].id;

    // Get default payment method
    const customer = customerData.data[0];
    const paymentMethodId = customer.invoice_settings?.default_payment_method ||
      customer.default_source;

    if (!paymentMethodId) {
      log.status = "skipped";
      log.skipReason = "no_payment_method";
      return log;
    }

    // Create and confirm payment intent
    const paymentResponse = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        amount: String(Math.round(amount * 100)),
        currency: (config.currency as string) || "usd",
        customer: customerId,
        payment_method: paymentMethodId,
        off_session: "true",
        confirm: "true",
        description: description,
      }),
    });
    const payment = await paymentResponse.json();

    if (payment.error) {
      log.status = "error";
      log.error = payment.error.message;
      return log;
    }

    log.output = {
      paymentId: payment.id,
      status: payment.status,
      customerId,
      amount,
    };

    console.log("[stripe-actions] Payment charged:", payment.id);

  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// Create Subscription
export async function executeCreateSubscription(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  try {
    const credentials = await getStripeCredentials(supabase, context.teamId);
    if (!credentials) {
      log.status = "skipped";
      log.skipReason = "stripe_not_connected";
      return log;
    }

    const customerEmail = renderTemplate(
      (config.customerEmail as string) || "{{lead.email}}",
      context
    );
    const priceId = config.priceId as string;

    if (!customerEmail) {
      log.status = "skipped";
      log.skipReason = "no_customer_email";
      return log;
    }

    if (!priceId) {
      log.status = "skipped";
      log.skipReason = "no_price_id";
      return log;
    }

    // Find or create customer
    const customerResponse = await fetch(
      `https://api.stripe.com/v1/customers?email=${encodeURIComponent(customerEmail)}&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
        },
      }
    );
    const customerData = await customerResponse.json();

    let customerId: string;

    if (customerData.data?.length > 0) {
      customerId = customerData.data[0].id;
    } else {
      const createCustomerResponse = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: customerEmail,
          name: context.lead?.name || "",
        }),
      });
      const newCustomer = await createCustomerResponse.json();
      
      if (newCustomer.error) {
        log.status = "error";
        log.error = newCustomer.error.message;
        return log;
      }
      
      customerId = newCustomer.id;
    }

    // Create subscription
    const params = new URLSearchParams({
      customer: customerId,
      "items[0][price]": priceId,
    });

    if (config.trialDays) {
      params.set("trial_period_days", String(config.trialDays));
    }

    const subscriptionResponse = await fetch("https://api.stripe.com/v1/subscriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const subscription = await subscriptionResponse.json();

    if (subscription.error) {
      log.status = "error";
      log.error = subscription.error.message;
      return log;
    }

    log.output = {
      subscriptionId: subscription.id,
      status: subscription.status,
      customerId,
    };

    console.log("[stripe-actions] Subscription created:", subscription.id);

  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// Cancel Subscription
export async function executeCancelSubscription(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  try {
    const credentials = await getStripeCredentials(supabase, context.teamId);
    if (!credentials) {
      log.status = "skipped";
      log.skipReason = "stripe_not_connected";
      return log;
    }

    // Get subscription ID from config or context
    const subscriptionId = (config.subscriptionId as string) ||
      context.payment?.subscriptionId;

    if (!subscriptionId) {
      log.status = "skipped";
      log.skipReason = "no_subscription_id";
      return log;
    }

    const cancelAtPeriodEnd = config.cancelAtPeriodEnd !== false;

    let response;
    if (cancelAtPeriodEnd) {
      // Schedule cancellation at period end
      response = await fetch(
        `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            cancel_at_period_end: "true",
          }),
        }
      );
    } else {
      // Cancel immediately
      response = await fetch(
        `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
          },
        }
      );
    }

    const result = await response.json();

    if (result.error) {
      log.status = "error";
      log.error = result.error.message;
      return log;
    }

    log.output = {
      subscriptionId,
      canceled: true,
      cancelAtPeriodEnd,
      status: result.status,
    };

    console.log("[stripe-actions] Subscription canceled:", subscriptionId);

  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}
