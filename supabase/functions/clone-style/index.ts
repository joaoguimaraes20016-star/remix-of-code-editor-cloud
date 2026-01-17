/**
 * Clone Style Edge Function
 * 
 * BRAND EXTRACTION approach - extracts branding, tone, and structure
 * rather than literal replication. This prevents:
 * - Icon text injection (emoji/unicode in headlines)
 * - Broken image URLs
 * - Overly long content
 * - Weird formatting artifacts
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

// Supported icon names in our builder
const SUPPORTED_ICONS = [
  'check', 'star', 'rocket', 'users', 'clock', 'shield', 'zap', 'target', 
  'award', 'heart', 'thumbs-up', 'trending-up', 'map', 'share-2', 'search',
  'calendar', 'file-text', 'play', 'mail', 'phone', 'globe'
];

// Sanitize content to remove emojis and icon text
function sanitizeContent(text: string | undefined): string {
  if (!text) return '';
  
  // Remove emoji and unicode symbols
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu;
  let cleaned = text.replace(emojiRegex, '');
  
  // Remove common icon patterns
  cleaned = cleaned.replace(/[✓✔✕✖✗✘★☆●○◆◇■□▲△▼▽►◄→←↑↓↔↕⇒⇐⇑⇓•·‣⁃]/g, '');
  cleaned = cleaned.replace(/\[icon\]/gi, '');
  cleaned = cleaned.replace(/\[[^\]]+icon[^\]]*\]/gi, '');
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

// Normalize icon name to supported icons
function normalizeIcon(icon: string | undefined): string {
  if (!icon) return 'check';
  const lower = icon.toLowerCase().replace(/[^a-z0-9-]/g, '');
  
  // Map common variations
  const iconMap: Record<string, string> = {
    'checkmark': 'check',
    'tick': 'check',
    'verified': 'check',
    'stars': 'star',
    'rating': 'star',
    'user': 'users',
    'people': 'users',
    'team': 'users',
    'time': 'clock',
    'timer': 'clock',
    'security': 'shield',
    'secure': 'shield',
    'lightning': 'zap',
    'fast': 'zap',
    'speed': 'zap',
    'goal': 'target',
    'aim': 'target',
    'love': 'heart',
    'like': 'thumbs-up',
    'growth': 'trending-up',
    'increase': 'trending-up',
    'location': 'map',
    'share': 'share-2',
    'find': 'search',
    'date': 'calendar',
    'schedule': 'calendar',
    'document': 'file-text',
    'video': 'play',
    'email': 'mail',
    'contact': 'phone',
    'world': 'globe',
    'web': 'globe',
  };
  
  if (SUPPORTED_ICONS.includes(lower)) return lower;
  if (iconMap[lower]) return iconMap[lower];
  
  // Default fallback
  return 'check';
}

// Truncate text with ellipsis if too long
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

// Sanitize a section's content
function sanitizeSection(section: any): GeneratedSection {
  const content = section.content || {};
  
  return {
    type: section.type || 'text-block',
    layout: section.layout,
    media: {
      // Always use null for images - we'll use placeholders
      primaryImage: undefined,
      logos: [],
    },
    content: {
      headline: truncate(sanitizeContent(content.headline), 80) || undefined,
      subheadline: truncate(sanitizeContent(content.subheadline), 200) || undefined,
      buttonText: truncate(sanitizeContent(content.buttonText), 30) || undefined,
      items: Array.isArray(content.items) 
        ? content.items.slice(0, 6).map((item: any) => ({
            title: truncate(sanitizeContent(item.title), 60) || undefined,
            description: truncate(sanitizeContent(item.description), 150) || undefined,
            icon: normalizeIcon(item.icon),
            image: undefined, // Never use external image URLs
          }))
        : undefined,
    },
  };
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
    let brandingData: any = null;

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
    }

    // BRAND EXTRACTION prompt - focused on extracting essence, not literal copy
    const analysisPrompt = pageContent
      ? `You are a BRAND ANALYST and funnel strategist, NOT a page cloner.

Your job is to EXTRACT the essence of this page and ADAPT it for our builder - NOT copy it literally.

=== WHAT TO EXTRACT ===
1. BRANDING: Color palette (primary, accent, background), visual style
2. COPY TONE: Voice, messaging style, urgency level
3. SECTION TYPES: What sections exist by PURPOSE
4. LAYOUT PREFERENCES: Centered vs split, grid vs stack

=== CRITICAL RULES ===
- NO emoji characters (❌ ✓ 📊 ✨ 🚀) anywhere
- NO icon text like "[icon]" or "→" or "•"
- NO external image URLs - leave images empty
- Headlines must be under 80 characters
- Descriptions must be under 200 characters
- Button text must be under 30 characters
- Only use these icons: check, star, rocket, users, clock, shield, zap, target, award, heart, thumbs-up, trending-up

=== PAGE CONTENT ===
${pageContent.slice(0, 8000)}

=== BRANDING DATA ===
${brandingData ? JSON.stringify(brandingData, null, 2).slice(0, 3000) : '{}'}

=== AVAILABLE SECTION TYPES ===
hero, logo-bar, features, stats, testimonials, pricing, faq, cta, footer, text-block

=== OUTPUT JSON ===
{
  "style": {
    "primaryColor": "#HEX",
    "accentColor": "#HEX",
    "backgroundColor": "#HEX",
    "headingFont": "Inter|Space Grotesk|DM Sans|Outfit|Poppins",
    "bodyFont": "Inter|DM Sans",
    "theme": "dark|light",
    "style": "minimal|bold|luxury|playful|corporate",
    "confidence": 0.0-1.0
  },
  "sections": [
    {
      "type": "hero",
      "layout": "center|split",
      "content": {
        "headline": "Clean headline without emojis",
        "subheadline": "Brief description",
        "buttonText": "Action text",
        "items": [{"title": "Name", "description": "Benefit", "icon": "check"}]
      }
    }
  ]
}

Respond with ONLY valid JSON. No code blocks, no explanation.`
      : `You are a brand analyst. Based on this URL, make educated guesses about the brand style.

URL: ${url}

Respond with JSON only using the schema above. Leave all media fields empty.`;

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

      // Sanitize all sections to remove emojis and fix icons
      const validatedSections: GeneratedSection[] = Array.isArray(parsed.sections)
        ? parsed.sections.map(sanitizeSection)
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
