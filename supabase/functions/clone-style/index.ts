/**
 * Clone Style Edge Function
 * 
 * Phase 14 Enhanced: Full visual replica - scrapes page HTML and recreates layout + colors
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

interface GeneratedSection {
  type: 'hero' | 'features' | 'testimonials' | 'cta' | 'faq' | 'pricing' | 'logo-bar' | 'stats' | 'text-block' | 'footer';
  content: {
    headline?: string;
    subheadline?: string;
    buttonText?: string;
    items?: Array<{
      title?: string;
      description?: string;
      icon?: string;
    }>;
  };
}

interface CloneResult {
  style: ClonedStyle;
  sections: GeneratedSection[];
  sourceUrl: string;
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
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let pageContent = "";
    let brandingData: any = null;

    // Step 1: Try to scrape the page with Firecrawl for structure + branding
    if (FIRECRAWL_API_KEY) {
      console.log('[clone-style] Scraping page with Firecrawl...');
      try {
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            formats: ['markdown', 'branding'],
            onlyMainContent: true,
            waitFor: 2000,
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          pageContent = scrapeData.data?.markdown || scrapeData.markdown || "";
          brandingData = scrapeData.data?.branding || scrapeData.branding || null;
          console.log('[clone-style] Scraped content length:', pageContent.length);
          console.log('[clone-style] Branding data:', brandingData ? 'found' : 'not found');
        } else {
          console.log('[clone-style] Firecrawl scrape failed:', await scrapeResponse.text());
        }
      } catch (scrapeError) {
        console.error('[clone-style] Firecrawl error:', scrapeError);
      }
    } else {
      console.log('[clone-style] Firecrawl not configured, using AI-only analysis');
    }

    // Step 2: Use AI to analyze and generate structure
    const analysisPrompt = pageContent 
      ? `You are a landing page analyzer. Analyze this scraped content and extract the page structure.

PAGE CONTENT:
${pageContent.slice(0, 8000)}

${brandingData ? `BRANDING DATA:
${JSON.stringify(brandingData, null, 2)}` : ''}

Based on this content, provide:
1. The visual style (colors, fonts, theme)
2. The section structure (what sections exist and their content)

Respond with JSON only:
{
  "style": {
    "primaryColor": "#HEX",
    "accentColor": "#HEX",
    "backgroundColor": "#HEX",
    "headingFont": "Font Name",
    "bodyFont": "Font Name",
    "theme": "dark|light",
    "style": "minimal|bold|luxury|playful|corporate|editorial|brutalist",
    "confidence": 0.8
  },
  "sections": [
    {
      "type": "hero|features|testimonials|cta|faq|pricing|logo-bar|stats|text-block|footer",
      "content": {
        "headline": "Main headline text",
        "subheadline": "Supporting text",
        "buttonText": "CTA button text",
        "items": [{"title": "Feature 1", "description": "Description"}]
      }
    }
  ]
}`
      : `You are a landing page analyzer. Analyze this URL and provide an educated guess about its structure.

URL: ${url}

Based on the domain name and common patterns for this type of site, provide:
1. The likely visual style (colors, fonts, theme)
2. The typical section structure

Respond with JSON only:
{
  "style": {
    "primaryColor": "#HEX",
    "accentColor": "#HEX", 
    "backgroundColor": "#HEX",
    "headingFont": "Font Name",
    "bodyFont": "Font Name",
    "theme": "dark|light",
    "style": "minimal|bold|luxury|playful|corporate|editorial|brutalist",
    "confidence": 0.4
  },
  "sections": [
    {
      "type": "hero|features|testimonials|cta|faq|pricing|logo-bar|stats|text-block|footer",
      "content": {
        "headline": "Suggested headline",
        "subheadline": "Suggested subheadline",
        "buttonText": "Get Started"
      }
    }
  ]
}`;

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
          content: analysisPrompt
        }],
        temperature: 0.3,
        max_tokens: 4000,
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
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const parsed = JSON.parse(cleanContent);
      
      // Apply branding data if Firecrawl provided it
      if (brandingData?.colors) {
        parsed.style.primaryColor = brandingData.colors.primary || parsed.style.primaryColor;
        parsed.style.accentColor = brandingData.colors.accent || brandingData.colors.secondary || parsed.style.accentColor;
        parsed.style.backgroundColor = brandingData.colors.background || parsed.style.backgroundColor;
        parsed.style.confidence = 0.95; // High confidence with real branding data
      }
      if (brandingData?.fonts?.[0]?.family) {
        parsed.style.headingFont = brandingData.fonts[0].family;
      }
      if (brandingData?.typography?.fontFamilies?.primary) {
        parsed.style.bodyFont = brandingData.typography.fontFamilies.primary;
      }
      
      // Validate and provide defaults
      const validatedStyle: ClonedStyle = {
        primaryColor: parsed.style?.primaryColor || '#8B5CF6',
        accentColor: parsed.style?.accentColor || '#A855F7',
        backgroundColor: parsed.style?.backgroundColor || '#0a0a0f',
        headingFont: parsed.style?.headingFont || 'Inter',
        bodyFont: parsed.style?.bodyFont || 'Inter',
        theme: parsed.style?.theme === 'dark' ? 'dark' : 'light',
        style: parsed.style?.style || 'minimal',
        confidence: typeof parsed.style?.confidence === 'number' ? parsed.style.confidence : 0.5,
      };

      const validatedSections: GeneratedSection[] = Array.isArray(parsed.sections) 
        ? parsed.sections.map((s: any) => ({
            type: s.type || 'text-block',
            content: s.content || {},
          }))
        : [{ type: 'hero', content: { headline: 'Welcome', buttonText: 'Get Started' } }];

      const result: CloneResult = {
        style: validatedStyle,
        sections: validatedSections,
        sourceUrl: url,
      };

      return new Response(JSON.stringify({ 
        success: true, 
        ...result,
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
