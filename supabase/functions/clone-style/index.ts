/**
 * Clone Style Edge Function
 * 
 * Phase 14: Extracts color palette and typography from a URL
 * for users to clone the style of existing landing pages.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CloneStyleRequest {
  url: string;
}

interface ClonedStyle {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  headingFont: string;
  bodyFont: string;
  theme: 'dark' | 'light';
  style: string;
  confidence: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { url } = await req.json() as CloneStyleRequest;

    if (!url || !url.startsWith('http')) {
      return new Response(JSON.stringify({ error: "Invalid URL provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use AI to analyze the URL and extract style
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{
          role: "user",
          content: `You are a design analysis expert. Analyze this landing page URL and extract its visual design system.

URL: ${url}

Visit this URL mentally (use your knowledge of common landing pages and design patterns if you recognize the domain) and extract:

1. Primary color (the main brand color used for CTAs, accents) - provide as hex
2. Accent/secondary color (complementary accent) - provide as hex  
3. Background color (page background) - provide as hex
4. Heading font family (the font used for headlines)
5. Body font family (the font used for paragraphs)
6. Theme (dark or light based on background)
7. Design style (one of: minimal, bold, luxury, playful, corporate, editorial, brutalist)

If you cannot access the URL, make educated guesses based on:
- The domain name and industry
- Common design patterns for that type of site
- Modern design trends

Respond ONLY with valid JSON in this exact format:
{
  "primaryColor": "#HEX",
  "accentColor": "#HEX", 
  "backgroundColor": "#HEX",
  "headingFont": "Font Name",
  "bodyFont": "Font Name",
  "theme": "dark|light",
  "style": "minimal|bold|luxury|playful|corporate|editorial|brutalist",
  "confidence": 0.0-1.0
}

Set confidence to 0.8+ if you recognize the site, 0.5-0.7 if guessing from domain, 0.3-0.5 if highly uncertain.`
        }],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[clone-style] AI API error:', error);
      return new Response(JSON.stringify({ error: "Failed to analyze URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: "No response from AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the JSON response
    try {
      // Clean up potential markdown formatting
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const style: ClonedStyle = JSON.parse(cleanContent);
      
      // Validate and provide defaults
      const validatedStyle: ClonedStyle = {
        primaryColor: style.primaryColor || '#8B5CF6',
        accentColor: style.accentColor || '#A855F7',
        backgroundColor: style.backgroundColor || '#0a0a0f',
        headingFont: style.headingFont || 'Inter',
        bodyFont: style.bodyFont || 'Inter',
        theme: style.theme === 'dark' ? 'dark' : 'light',
        style: style.style || 'minimal',
        confidence: typeof style.confidence === 'number' ? style.confidence : 0.5,
      };

      return new Response(JSON.stringify({ 
        success: true, 
        style: validatedStyle,
        sourceUrl: url,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (parseError) {
      console.error('[clone-style] JSON parse error:', parseError, 'Content:', content);
      return new Response(JSON.stringify({ error: "Failed to parse style data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (error) {
    console.error('[clone-style] Error:', error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
