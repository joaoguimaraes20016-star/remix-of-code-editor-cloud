import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSystemPrompt } from "./prompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================
// PROVIDER CONFIGURATION - Claude (Anthropic)
// ============================================================
const AI_URL = "https://api.anthropic.com/v1/messages";
const API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const CLAUDE_VERSION = "2023-06-01";
// ============================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task, context, prompt, mode, stream = true } = await req.json();
    
    if (!API_KEY) {
      console.error("ANTHROPIC_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI provider not configured. Please check your API key settings." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the appropriate system prompt based on task type and mode
    const systemPrompt = getSystemPrompt(task, context, mode, prompt);

    // Increase max tokens for funnel and workflow generation
    const maxTokens = (mode === 'funnel' || mode === 'workflow') ? 4096 : 2048;

    console.log(`[ai-copilot] Task: ${task}, Mode: ${mode || 'block'}, Stream: ${stream}, Model: ${CLAUDE_MODEL}`);

    const response = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "anthropic-version": CLAUDE_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: maxTokens,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          { role: "user", content: prompt },
        ],
        stream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Claude API error: ${response.status}`, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "Invalid API key. Please check your Anthropic API key." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For streaming, transform Anthropic SSE format to OpenAI format (keeps client code unchanged)
    if (stream) {
      const transformedStream = new ReadableStream({
        async start(controller) {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          const encoder = new TextEncoder();
          let buffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6).trim();
                  if (data === '[DONE]') {
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    continue;
                  }

                  try {
                    const parsed = JSON.parse(data);

                    // Anthropic: { type: "content_block_delta", delta: { type: "text_delta", text: "..." } }
                    // Transform to OpenAI: { choices: [{ delta: { content: "..." } }] }
                    if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                      const openAIFormat = {
                        choices: [{ delta: { content: parsed.delta.text } }]
                      };
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify(openAIFormat)}\n\n`)
                      );
                    }

                    // Handle message_stop - send [DONE] signal
                    if (parsed.type === 'message_stop') {
                      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    }
                  } catch (parseErr) {
                    // Skip unparseable lines (event: lines, empty lines, etc.)
                  }
                }
              }
            }

            controller.close();
          } catch (err) {
            console.error('[ai-copilot] Stream error:', err);
            controller.error(err);
          }
        }
      });

      return new Response(transformedStream, {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }

    // For non-streaming, transform Anthropic response to OpenAI format
    const data = await response.json();
    const transformed = {
      choices: [{
        message: {
          content: data.content?.[0]?.text || ''
        }
      }]
    };
    return new Response(JSON.stringify(transformed), {
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
