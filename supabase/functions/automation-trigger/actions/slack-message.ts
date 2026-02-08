// supabase/functions/automation-trigger/actions/slack-message.ts
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { AutomationContext, StepExecutionLog } from "../types.ts";
import { renderTemplate } from "../template-engine.ts";

interface SlackMessageConfig {
  channel: string;
  message: string;
  username?: string;
  icon_emoji?: string;
}

export async function executeSlackMessage(
  config: Record<string, any>,
  context: AutomationContext,
  supabase: SupabaseClient
): Promise<StepExecutionLog> {
  const slackConfig = config as SlackMessageConfig;

  if (!slackConfig.channel) {
    return {
      status: "error",
      error: "No Slack channel specified",
    };
  }

  if (!slackConfig.message) {
    return {
      status: "error",
      error: "No message content specified",
    };
  }

  try {
    // Fetch the team's Slack integration from team_integrations
    const { data: integration, error: fetchError } = await supabase
      .from("team_integrations")
      .select("config")
      .eq("team_id", context.teamId)
      .eq("integration_type", "slack")
      .single();

    if (fetchError || !integration) {
      console.error("[Slack] No integration found for team:", context.teamId);
      return {
        status: "error",
        error: "Slack is not connected for this team. Please connect Slack in the Apps section.",
      };
    }

    const accessToken = integration.config?.access_token;
    if (!accessToken) {
      return {
        status: "error",
        error: "Slack access token not found. Please reconnect Slack.",
      };
    }

    // Render template variables in the message
    const renderedMessage = renderTemplate(slackConfig.message, context);

    const payload: Record<string, any> = {
      channel: slackConfig.channel,
      text: renderedMessage,
    };

    // Add optional fields if provided
    if (slackConfig.username) {
      payload.username = slackConfig.username;
    }
    if (slackConfig.icon_emoji) {
      payload.icon_emoji = slackConfig.icon_emoji;
    }

    console.log("[Slack] Sending message to channel:", slackConfig.channel);

    // Call Slack API directly with the team's access token
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error("[Slack] API error:", data);
      return {
        status: "error",
        error: data.error || `Slack API call failed [${response.status}]`,
        output: { slackResponse: data },
      };
    }

    console.log("[Slack] Message sent successfully, ts:", data.ts);

    return {
      status: "success",
      channel: "slack",
      provider: "slack",
      messageId: data.ts,
      output: {
        channel: data.channel,
        ts: data.ts,
        message: renderedMessage.substring(0, 100), // Preview
      },
    };
  } catch (error) {
    console.error("[Slack] Error sending message:", error);
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error sending Slack message",
    };
  }
}
