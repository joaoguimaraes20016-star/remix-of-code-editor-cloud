import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSystemPrompt } from "./prompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================
// PROVIDER CONFIGURATION - Change these 2 lines to swap providers
// ============================================================
// Current: Lovable AI Gateway (auto-configured, no setup needed)
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const getApiKey = () => Deno.env.get("LOVABLE_API_KEY");

// To use OpenAI directly, uncomment these and add OPENAI_API_KEY secret:
// const AI_URL = "https://api.openai.com/v1/chat/completions";
// const getApiKey = () => Deno.env.get("OPENAI_API_KEY");

// To use Anthropic (requires different payload format):
// const AI_URL = "https://api.anthropic.com/v1/messages";
// const getApiKey = () => Deno.env.get("ANTHROPIC_API_KEY");
// ============================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task, context, prompt, mode, stream = true } = await req.json();
    
    const API_KEY = getApiKey();
    if (!API_KEY) {
      console.error("API key not configured");
      return new Response(
        JSON.stringify({ error: "AI provider not configured. Please check your API key settings." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the appropriate system prompt based on task type and mode
    const systemPrompt = getSystemPrompt(task, context, mode, prompt);

    // Increase max tokens for funnel and workflow generation
    const maxTokens = (mode === 'funnel' || mode === 'workflow') ? 4096 : 2048;

    console.log(`[ai-copilot] Task: ${task}, Mode: ${mode || 'block'}, Stream: ${stream}`);

    const response = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        stream,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI gateway error: ${response.status}`, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue using AI features." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For streaming, pass through the response body
    if (stream) {
      return new Response(response.body, {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }

    // For non-streaming, parse and return
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[ai-copilot] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
