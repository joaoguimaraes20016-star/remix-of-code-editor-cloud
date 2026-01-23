// supabase/functions/automation-trigger/actions/slack-message.ts
import type { AutomationContext, StepExecutionLog } from "../types.ts";
import { renderTemplate } from "../template-engine.ts";

const GATEWAY_URL = 'https://gateway.lovable.dev/slack/api';

interface SlackMessageConfig {
  channel: string;
  message: string;
  username?: string;
  icon_emoji?: string;
}

export async function executeSlackMessage(
  config: Record<string, any>,
  context: AutomationContext
): Promise<Partial<StepExecutionLog>> {
  const slackConfig = config as SlackMessageConfig;
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return {
      status: "error",
      error: "LOVABLE_API_KEY is not configured",
    };
  }

  const SLACK_API_KEY = Deno.env.get('SLACK_API_KEY');
  if (!SLACK_API_KEY) {
    return {
      status: "error",
      error: "SLACK_API_KEY is not configured. Please connect Slack in the integrations portal.",
    };
  }

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

    const response = await fetch(`${GATEWAY_URL}/chat.postMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': SLACK_API_KEY,
        'Content-Type': 'application/json',
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
