// supabase/functions/automation-trigger/actions/discord-message.ts
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { AutomationContext, StepExecutionLog } from "../types.ts";
import { renderTemplate } from "../template-engine.ts";

interface DiscordMessageConfig {
  channel_id: string;
  message: string;
  embed_title?: string;
  embed_description?: string;
  embed_color?: number;
}

export async function executeDiscordMessage(
  config: Record<string, any>,
  context: AutomationContext,
  supabase: SupabaseClient
): Promise<Partial<StepExecutionLog>> {
  const discordConfig = config as DiscordMessageConfig;

  if (!discordConfig.channel_id) {
    return {
      status: "error",
      error: "No Discord channel ID specified",
    };
  }

  if (!discordConfig.message && !discordConfig.embed_title) {
    return {
      status: "error",
      error: "No message content or embed specified",
    };
  }

  try {
    // Fetch the team's Discord integration from team_integrations
    const { data: integration, error: fetchError } = await supabase
      .from("team_integrations")
      .select("access_token, config")
      .eq("team_id", context.teamId)
      .eq("integration_type", "discord")
      .single();

    if (fetchError || !integration) {
      console.error("[Discord] No integration found for team:", context.teamId);
      return {
        status: "error",
        error: "Discord is not connected for this team. Please connect Discord in the Apps section.",
      };
    }

    const accessToken = integration.access_token;
    if (!accessToken) {
      return {
        status: "error",
        error: "Discord access token not found. Please reconnect Discord.",
      };
    }

    // Render template variables
    const renderedMessage = discordConfig.message
      ? renderTemplate(discordConfig.message, context)
      : "";

    // Build payload
    const payload: Record<string, any> = {};

    if (renderedMessage) {
      payload.content = renderedMessage;
    }

    // Build embed if provided
    if (discordConfig.embed_title || discordConfig.embed_description) {
      const embed: Record<string, any> = {};
      if (discordConfig.embed_title) {
        embed.title = renderTemplate(discordConfig.embed_title, context);
      }
      if (discordConfig.embed_description) {
        embed.description = renderTemplate(discordConfig.embed_description, context);
      }
      if (discordConfig.embed_color) {
        embed.color = discordConfig.embed_color;
      }
      embed.timestamp = new Date().toISOString();
      payload.embeds = [embed];
    }

    console.log("[Discord] Sending message to channel:", discordConfig.channel_id);

    // Call Discord API
    const response = await fetch(
      `https://discord.com/api/v10/channels/${discordConfig.channel_id}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bot ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("[Discord] API error:", data);
      return {
        status: "error",
        error: data.message || `Discord API call failed [${response.status}]`,
        output: { discordResponse: data },
      };
    }

    console.log("[Discord] Message sent successfully, id:", data.id);

    return {
      status: "success",
      channel: "discord",
      provider: "discord",
      messageId: data.id,
      output: {
        channel_id: data.channel_id,
        message_id: data.id,
        message: renderedMessage.substring(0, 100),
      },
    };
  } catch (error) {
    console.error("[Discord] Error sending message:", error);
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error sending Discord message",
    };
  }
}
