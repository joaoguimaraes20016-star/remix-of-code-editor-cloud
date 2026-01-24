// This is a simple redirect to the token endpoint since refresh is handled there
// Zapier sometimes expects a separate refresh endpoint

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Forward the request to the token endpoint
  const tokenUrl = Deno.env.get("SUPABASE_URL") + "/functions/v1/zapier-oauth-token";
  
  try {
    const body = await req.text();
    
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": req.headers.get("content-type") || "application/x-www-form-urlencoded",
      },
      body: body,
    });

    const data = await response.text();
    
    return new Response(data, {
      status: response.status,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Refresh proxy error:", error);
    return new Response(
      JSON.stringify({ error: "server_error", error_description: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
