/**
 * Clone Style Edge Function
 * 
 * Phase 14 Enhanced: attempts a closer visual replica by extracting:
 * - real brand colors/fonts (Firecrawl branding)
 * - section order + copy (Firecrawl markdown)
 * - image candidates (Firecrawl html + branding images)
 * 
 * Note: our builder still has limits (no arbitrary DOM/CSS import), so this maps
 * the source into the closest available blocks/stacks.
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
  layout?: 'center' | 'split' | 'grid' | 'stack';
  media?: {
    primaryImage?: string;
    logos?: string[];
    icons?: string[];
  };
  content: {
    headline?: string;
    subheadline?: string;
    buttonText?: string;
    items?: Array<{
      title?: string;
      description?: string;
      icon?: string;
      image?: string;
    }>;
  };
}

interface CloneResult {
  style: ClonedStyle;
  sections: GeneratedSection[];
  sourceUrl: string;
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function extractImgCandidates(html: string): Array<{ src: string; alt?: string }> {
  if (!html) return [];

  const out: Array<{ src: string; alt?: string }> = [];
  const imgTagRegex = /<img[^>]+>/gi;
  const srcRegex = /src\s*=\s*"([^"]+)"/i;
  const altRegex = /alt\s*=\s*"([^"]*)"/i;

  const tags = html.match(imgTagRegex) || [];
  for (const tag of tags) {
    const srcMatch = tag.match(srcRegex);
    if (!srcMatch?.[1]) continue;

    const src = srcMatch[1];
    if (!src || src.startsWith('data:')) continue;

    const altMatch = tag.match(altRegex);
    const alt = altMatch?.[1];

    out.push({ src, alt });
  }

  return out;
}

serve(async (req: Request) => {
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
    let pageHtml = "";
    let brandingData: any = null;
    let imageCandidates: Array<{ src: string; alt?: string }> = [];

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
            formats: ['markdown', 'branding', 'html'],
            onlyMainContent: true,
            waitFor: 2000,
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          pageContent = scrapeData.data?.markdown || scrapeData.markdown || "";
          pageHtml = scrapeData.data?.html || scrapeData.html || "";
          brandingData = scrapeData.data?.branding || scrapeData.branding || null;
          imageCandidates = extractImgCandidates(pageHtml);
          console.log('[clone-style] Scraped content length:', pageContent.length);
          console.log('[clone-style] Extracted images:', imageCandidates.length);
          console.log('[clone-style] Branding data:', brandingData ? 'found' : 'not found');
        } else {
          console.log('[clone-style] Firecrawl scrape failed:', await scrapeResponse.text());
        }
      } catch (scrapeError) {
        console.error('[clone-style] Firecrawl error:', scrapeError);
      }
    }

    // Build prompt with as much grounded context as possible
    const brandingImages = brandingData?.images || {};
    const candidateImages = uniq([
      ...(brandingImages.logo ? [brandingImages.logo] : []),
      ...(brandingImages.favicon ? [brandingImages.favicon] : []),
      ...imageCandidates.map(i => i.src),
    ]).filter(Boolean).slice(0, 25);

    const analysisPrompt = pageContent
      ? `You are a landing page reverse-engineer. Your job is to recreate the SAME structure in a constrained builder.

Constraints (important):
- You can only use these section types: hero, logo-bar, features, stats, testimonials, pricing, faq, cta, footer, text-block
- You can optionally mark a hero as layout="split" if there is a hero image.
- Use image URLs when available (for hero image + logo strips). If unsure, omit.

PAGE CONTENT (markdown):
${pageContent.slice(0, 9000)}

BRANDING (json):
${brandingData ? JSON.stringify(brandingData, null, 2).slice(0, 4000) : '{}'}

IMAGE CANDIDATES (use only if clearly relevant):
${candidateImages.map((u) => `- ${u}`).join('\n')}

Return JSON only:
{
  "style": {
    "primaryColor": "#HEX",
    "accentColor": "#HEX",
    "backgroundColor": "#HEX",
    "headingFont": "Font Name",
    "bodyFont": "Font Name",
    "theme": "dark|light",
    "style": "minimal|bold|luxury|playful|corporate|editorial|brutalist",
    "confidence": 0.0
  },
  "sections": [
    {
      "type": "hero",
      "layout": "center|split",
      "media": {
        "primaryImage": "https://...",
        "logos": ["https://..."]
      },
      "content": {
        "headline": "...",
        "subheadline": "...",
        "buttonText": "...",
        "items": [{"title":"...","description":"..."}]
      }
    }
  ]
}

Rules:
- Try to match the page's actual order of sections.
- Put the MOST prominent image into hero.media.primaryImage.
- Put logo strip images into logo-bar.media.logos.
- If you can't confidently assign an image, omit it (don't guess).`
      : `You are a landing page analyzer. Analyze this URL and provide an educated guess about its structure.

URL: ${url}

Respond with JSON only in the same schema as above, but omit media if unknown.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.2,
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

    try {
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanContent);

      // Prefer Firecrawl branding colors/fonts when present
      if (brandingData?.colors) {
        parsed.style = parsed.style || {};
        parsed.style.primaryColor = brandingData.colors.primary || parsed.style.primaryColor;
        parsed.style.accentColor = brandingData.colors.accent || brandingData.colors.secondary || parsed.style.accentColor;
        parsed.style.backgroundColor = brandingData.colors.background || parsed.style.backgroundColor;
        parsed.style.confidence = Math.max(0.9, parsed.style.confidence ?? 0);
      }
      if (brandingData?.fonts?.[0]?.family) {
        parsed.style = parsed.style || {};
        parsed.style.headingFont = brandingData.fonts[0].family;
      }
      if (brandingData?.typography?.fontFamilies?.primary) {
        parsed.style = parsed.style || {};
        parsed.style.bodyFont = brandingData.typography.fontFamilies.primary;
      }

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
            layout: s.layout,
            media: s.media,
            content: s.content || {},
          }))
        : [{ type: 'hero', content: { headline: 'Welcome', buttonText: 'Get Started' } }];

      const result: CloneResult = {
        style: validatedStyle,
        sections: validatedSections,
        sourceUrl: url,
      };

      return new Response(JSON.stringify({ success: true, ...result }), {
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
