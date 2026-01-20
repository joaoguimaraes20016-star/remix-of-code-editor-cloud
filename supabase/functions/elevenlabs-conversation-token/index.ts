// supabase/functions/elevenlabs-conversation-token/index.ts
// ElevenLabs Conversational AI Token Generator

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TokenRequest {
  agentId?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
    const defaultAgentId = Deno.env.get("ELEVENLABS_AGENT_ID");

    if (!elevenlabsApiKey) {
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let agentId = defaultAgentId;

    // Allow overriding agent ID from request
    if (req.method === "POST") {
      try {
        const body: TokenRequest = await req.json();
        if (body.agentId) {
          agentId = body.agentId;
        }
      } catch {
        // No body or invalid JSON, use default
      }
    }

    if (!agentId) {
      return new Response(
        JSON.stringify({ error: "No agent ID provided or configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get conversation token from ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
      {
        headers: {
          "xi-api-key": elevenlabsApiKey,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[elevenlabs-token] ElevenLabs API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get conversation token", details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { token } = await response.json();

    return new Response(
      JSON.stringify({ token, agentId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[elevenlabs-token] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
