// supabase/functions/automation-trigger/actions/marketing-actions.ts
// Marketing automation actions: send review request, reply in comments

import type { AutomationContext, StepExecutionLog } from "../types.ts";
import { renderTemplate } from "../template-engine.ts";

type FlexibleConfig = Record<string, unknown>;

/**
 * Send a review request via SMS or email
 * Composes a message with the review URL and sends it through the messaging system
 */
export async function executeSendReviewRequest(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
  runId?: string,
  automationId?: string,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const platform = (config.platform as string) || "google";
    const channel = (config.channel as string) || "sms";
    const reviewUrl = config.reviewUrl as string;

    if (!reviewUrl) {
      log.status = "skipped";
      log.skipReason = "no_review_url_configured";
      return log;
    }

    // Render the message template, injecting review_url into context
    const extendedContext = {
      ...context,
      review_url: reviewUrl,
      review_platform: platform,
    };

    const message = config.message
      ? renderTemplate(config.message as string, extendedContext as any)
      : `Hi ${context.lead?.first_name || "there"}, we'd love your feedback! Please leave us a review: ${reviewUrl}`;

    // Resolve recipient
    let toAddress = "";
    if (channel === "email") {
      toAddress = context.lead?.email || context.appointment?.lead_email || "";
    } else {
      toAddress = context.lead?.phone || context.appointment?.lead_phone || "";
    }

    if (!toAddress) {
      log.status = "skipped";
      log.skipReason = `no_${channel === "email" ? "email" : "phone"}_address`;
      return log;
    }

    // Send via the appropriate channel
    const endpoint = channel === "email"
      ? `${supabaseUrl}/functions/v1/send-email`
      : `${supabaseUrl}/functions/v1/send-sms`;

    const payload: Record<string, any> = channel === "email"
      ? {
          to: toAddress,
          subject: `We'd love your review on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
          body: message,
          teamId: context.teamId,
          leadId: context.lead?.id,
          automationId,
          runId,
          appointmentId: context.appointment?.id,
        }
      : {
          to: toAddress,
          body: message,
          teamId: context.teamId,
          leadId: context.lead?.id,
          automationId,
          runId,
          appointmentId: context.appointment?.id,
        };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      log.status = "success";
      log.output = {
        channel,
        platform,
        reviewUrl,
        messageId: result.messageId,
        provider: result.provider,
      };
    } else {
      log.status = "error";
      log.error = result.error || "Review request delivery failed";
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

/**
 * Reply to a comment on social media (Facebook, Instagram, Google Business)
 * Posts a comment reply via the platform's API using stored integration credentials
 */
export async function executeReplyInComments(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  try {
    const platform = (config.platform as string) || "facebook";
    const replyText = config.replyText
      ? renderTemplate(config.replyText as string, context)
      : "Thank you for your comment!";

    // Get the comment ID from the event payload (if triggered by a comment event)
    const commentId = context.meta?.commentId;

    if (!commentId) {
      log.status = "skipped";
      log.skipReason = "no_comment_id_in_context";
      return log;
    }

    // Look up integration credentials for the platform
    const integrationTypes: Record<string, string> = {
      facebook: "facebook",
      instagram: "instagram",
      google: "google_business",
    };

    const { data: integration, error: integrationError } = await supabase
      .from("team_integrations")
      .select("config")
      .eq("team_id", context.teamId)
      .eq("integration_type", integrationTypes[platform] || platform)
      .eq("is_connected", true)
      .single();

    if (integrationError || !integration?.config) {
      log.status = "skipped";
      log.skipReason = `${platform}_not_connected`;
      return log;
    }

    const accessToken = (integration.config as Record<string, any>).access_token;

    if (!accessToken) {
      log.status = "skipped";
      log.skipReason = `${platform}_no_access_token`;
      return log;
    }

    // Post reply based on platform
    let apiUrl: string;
    let apiPayload: Record<string, any>;

    switch (platform) {
      case "facebook":
      case "instagram":
        // Facebook/Instagram Graph API
        apiUrl = `https://graph.facebook.com/v18.0/${commentId}/replies`;
        apiPayload = {
          message: replyText,
          access_token: accessToken,
        };
        break;

      case "google":
        // Google Business Profile API v4
        // commentId should be full resource name: accounts/{accountId}/locations/{locationId}/reviews/{reviewId}
        apiUrl = `https://mybusiness.googleapis.com/v4/${commentId}/reply`;
        apiPayload = {
          comment: {
            comment: replyText,
          },
        };
        break;

      default:
        log.status = "skipped";
        log.skipReason = `unsupported_platform_${platform}`;
        return log;
    }

    const response = await fetch(apiUrl, {
      method: platform === "google" ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(platform === "google" ? { "Authorization": `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(apiPayload),
    });

    const result = await response.json();

    if (response.ok) {
      log.status = "success";
      log.output = {
        platform,
        commentId,
        replyId: result.id,
      };
    } else {
      log.status = "error";
      log.error = result.error?.message || result.error || "Failed to post comment reply";
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}
