import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AI Provider Configuration
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const getApiKey = () => Deno.env.get("LOVABLE_API_KEY");

// V3 Block Types (copywriting-focused)
const V3_BLOCK_TYPES = [
  'heading', 'text', 'button', 'form', 'email-capture', 'phone-capture',
  'quiz', 'multiple-choice', 'choice', 'image-quiz', 'video-question',
  'message', 'list', 'accordion', 'social-proof', 'countdown', 'webinar',
  'image', 'video', 'divider', 'spacer', 'logo-bar', 'reviews', 'slider',
  'graphic', 'testimonial-slider', 'calendar', 'upload', 'date-picker',
  'dropdown', 'payment', 'popup-form', 'columns', 'card', 'loader', 'embed'
];

/**
 * Get system prompt for copywriting task
 */
function getCopyPrompt(context: any): string {
  const blockType = context.selectedBlockType || 'text';
  const existingContent = context.currentBlockContent || {};
  
  return `You are a copywriting assistant for Funnel Builder V3.

Your ONLY job is to generate text content for blocks. You must NEVER:
- Modify layout, structure, or block order
- Change colors, fonts, spacing, or visual styling
- Generate code or React components
- Suggest new block types that don't exist

Available Block Types: ${V3_BLOCK_TYPES.join(', ')}

Current Block: ${blockType}
${existingContent.text ? `Current Content: ${existingContent.text}` : ''}

Generate ONLY the content properties for this block type. Return valid JSON with only content fields (no styles, no layout).

Example for heading block:
{
  "type": "heading",
  "content": {
    "text": "Your Headline Here",
    "level": 1
  }
}

Example for button block:
{
  "type": "button",
  "content": {
    "text": "Get Started Now",
    "action": "next-step"
  }
}

Example for form block:
{
  "type": "form",
  "content": {
    "title": "Get Your Free Guide",
    "fields": [
      {"id": "1", "type": "text", "label": "First Name", "placeholder": "Enter your name", "required": true},
      {"id": "2", "type": "email", "label": "Email", "placeholder": "Enter your email", "required": true}
    ],
    "submitButton": {
      "text": "Get My Free Guide",
      "action": "next-step"
    }
  }
}

Return ONLY valid JSON. No markdown, no explanation, no code blocks.`;
}

/**
 * Fetch website content from URL
 */
async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract readable text from HTML (simple approach - remove scripts, styles, etc.)
    // For better results, we could use a proper HTML parser, but this should work for most cases
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Extract key elements that might be useful
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';
    
    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1] : '';
    
    // Extract headings
    const headings = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi) || [];
    const headingTexts = headings.map(h => h.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
    
    // Extract buttons/CTAs
    const buttons = html.match(/<button[^>]*>([^<]+)<\/button>/gi) || [];
    const buttonTexts = buttons.map(b => b.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
    
    // Extract links that look like CTAs
    const ctaLinks = html.match(/<a[^>]*class=["'][^"']*(?:btn|button|cta|call-to-action)[^"']*["'][^>]*>([^<]+)<\/a>/gi) || [];
    const ctaTexts = ctaLinks.map(a => a.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
    
    // Extract colors from inline styles and CSS (basic extraction)
    const colorMatches = html.match(/#[0-9a-fA-F]{6}|rgb\([^)]+\)|rgba\([^)]+\)/g) || [];
    const colors = [...new Set(colorMatches)].slice(0, 10); // Limit to 10 unique colors
    
    // Build structured content
    const structuredContent = `
TITLE: ${title}
DESCRIPTION: ${description}

HEADINGS:
${headingTexts.slice(0, 10).join('\n')}

BUTTONS/CTAs:
${[...buttonTexts, ...ctaTexts].slice(0, 10).join('\n')}

COLORS FOUND:
${colors.join(', ')}

MAIN CONTENT (first 10000 chars):
${text.slice(0, 10000)}
`.trim();
    
    return structuredContent;
  } catch (error) {
    console.error(`[ai-copilot-v3] Error fetching URL: ${error}`);
    throw error;
  }
}

/**
 * Get system prompt for clone task
 */
function getClonePrompt(htmlContent: string, context: any): string {
  return `You are a brand analyst for Funnel Builder V3.

Analyze this website content and extract:
1. Branding (colors, fonts, theme)
2. Content sections (headlines, text, CTAs)

Website Content:
${htmlContent.slice(0, 15000)}

Available V3 Block Types: ${V3_BLOCK_TYPES.join(', ')}

Convert the website content into V3 blocks. Study the structure, branding, and copy style, then recreate it using our V3 block system with similar uniqueness but using our own blocks.

Return ONLY valid JSON:
{
  "branding": {
    "primaryColor": "#HEX",
    "accentColor": "#HEX",
    "backgroundColor": "#HEX",
    "headingFont": "Inter|Space Grotesk|DM Sans|Outfit|Poppins",
    "bodyFont": "Inter|DM Sans",
    "theme": "dark|light"
  },
  "blocks": [
    {
      "type": "heading",
      "content": {
        "text": "Headline text",
        "level": 1
      },
      "styles": {
        "textAlign": "center"
      }
    },
    {
      "type": "button",
      "content": {
        "text": "CTA text",
        "variant": "primary",
        "size": "lg",
        "action": "next-step"
      },
      "styles": {
        "textAlign": "center"
      }
    }
  ]
}

CRITICAL RULES:
- Use ONLY V3 block types listed above
- NO emojis in any text
- NO external image URLs
- Buttons should have textAlign: "center" in styles
- Headings and text blocks should have appropriate textAlign based on the original design
- Extract the actual content and structure, don't hallucinate
- Return ONLY valid JSON, no markdown, no code blocks`;
}

/**
 * Get system prompt for generate task
 */
function getGeneratePrompt(context: any): string {
  const branding = context.branding || {};
  
  return `You are a funnel architect for Funnel Builder V3.

Generate a complete funnel matching the user's prompt. Use ONLY V3 block types.

Available V3 Block Types: ${V3_BLOCK_TYPES.join(', ')}

${branding.primaryColor ? `Branding to match:
- Primary Color: ${branding.primaryColor}
- Accent Color: ${branding.accentColor || branding.primaryColor}
- Background: ${branding.backgroundColor || '#ffffff'}
- Theme: ${branding.theme || 'light'}` : ''}

Return JSON with V3 funnel structure:
{
  "funnel": {
    "name": "Funnel Name",
    "steps": [
      {
        "name": "Step Name",
        "type": "capture|sell|book|educate|result",
        "slug": "step-slug",
        "blocks": [
          {
            "type": "heading",
            "content": {
              "text": "Headline",
              "level": 1
            }
          },
          {
            "type": "button",
            "content": {
              "text": "Get Started",
              "action": "next-step",
              "variant": "primary",
              "size": "lg"
            }
          }
        ],
        "settings": {
          "backgroundColor": "${branding.backgroundColor || '#ffffff'}"
        }
      }
    ]
  }
}

CRITICAL RULES:
- Use ONLY V3 block types listed above
- NO emojis in any text
- NO external image URLs (use placeholders)
- Headlines max 80 chars
- Descriptions max 200 chars
- Button text max 30 chars
- Return ONLY valid JSON, no markdown`;
}

/**
 * Get system prompt for help/Q&A task
 */
function getHelpPrompt(context: any): string {
  return `You are a helpful assistant for Funnel Builder V3.

Answer questions about how to use the funnel builder. Be concise and helpful.

Available Block Types: ${V3_BLOCK_TYPES.join(', ')}

Common questions:
- How to add blocks: Use the "+" button or drag from the sidebar
- How to edit text: Double-click on text blocks or headings
- How to configure buttons: Select a button block and use the inspector panel
- How to add forms: Add a "form" block or "email-capture" block
- How to create quizzes: Add a "quiz" block or "multiple-choice" block
- How to navigate between steps: Configure button actions to "next-step" or specific step ID

Answer the user's question directly and helpfully.`;
}

/**
 * Get system prompt for plan generation task
 */
function getPlanPrompt(context: any): string {
  const availableBlocks = context.availableBlockTypes || V3_BLOCK_TYPES;
  
  return `You are a funnel planning assistant for Funnel Builder V3.

Your job is to create a detailed PLAN showing what you will build based on the user's request.

CAPABILITIES - What you CAN build:

STEP TYPES:
- capture: Lead generation pages (email capture, forms, opt-ins)
- sell: Sales pages (product/service pages, checkout flows)
- book: Scheduling pages (calendar booking, appointment setting)
- educate: Content pages (blog posts, courses, tutorials)
- result: Thank you/confirmation pages (post-purchase, post-signup)

AVAILABLE BLOCK TYPES:
${availableBlocks.map((type: string) => `- ${type}`).join('\n')}

COMMON BLOCK PURPOSES:
- heading: Main headlines, section titles
- text: Descriptions, body content, value propositions
- button: Call-to-action buttons, navigation
- form: Multi-field forms (contact, registration, checkout)
- email-capture: Simple email collection forms
- phone-capture: Phone number collection
- image: Photos, graphics, illustrations
- video: Embedded videos, video players
- quiz: Interactive quizzes with questions
- multiple-choice: Multiple choice questions
- accordion: Expandable FAQ sections
- countdown: Timer countdowns
- webinar: Webinar registration and details
- calendar: Calendar booking widgets
- social-proof: Testimonials, reviews, trust badges
- logo-bar: Partner/client logos
- divider: Visual separators
- spacer: Spacing blocks

LIMITATIONS - What you CANNOT do:
- External API integrations or webhooks
- Custom code, scripts, or JavaScript
- Email automation workflows (only capture emails)
- Payment processing setup (only payment forms)
- Database connections
- Third-party service integrations

PLANNING FORMAT:
Create a clear, detailed plan showing:
1. What steps you'll create (with step types)
2. What blocks you'll add to each step
3. The purpose of each block
4. How the funnel flows from step to step

Be specific about which block types you'll use and why.
Explain the user journey through the funnel.
Keep it conversational and clear - like explaining to a colleague.

Return your plan as a clear, readable text description. Be detailed and specific about what you'll build.`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task, context, prompt, stream = true } = await req.json();
    
    const API_KEY = getApiKey();
    if (!API_KEY) {
      console.error("API key not configured");
      return new Response(
        JSON.stringify({ error: "AI provider not configured. Please check your API key settings." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For clone task, fetch the URL content first
    let userPrompt = prompt;
    let systemPrompt: string;
    
    if (task === 'clone') {
      try {
        console.log(`[ai-copilot-v3] Fetching URL content: ${prompt}`);
        const htmlContent = await fetchWebsiteContent(prompt);
        systemPrompt = getClonePrompt(htmlContent, context);
        userPrompt = `Analyze this website and convert it to V3 blocks matching the branding and structure.`;
      } catch (fetchError) {
        console.error(`[ai-copilot-v3] Failed to fetch URL: ${fetchError}`);
        return new Response(
          JSON.stringify({ error: `Failed to fetch website: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (task === 'help') {
      systemPrompt = getHelpPrompt(context);
    } else if (task === 'plan') {
      systemPrompt = getPlanPrompt(context);
    } else if (task === 'generate') {
      systemPrompt = getGeneratePrompt(context);
    } else {
      systemPrompt = getCopyPrompt(context);
    }

    console.log(`[ai-copilot-v3] Task: ${task}, Stream: ${stream}`);

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
          { role: "user", content: userPrompt },
        ],
        stream,
        max_tokens: (task === 'generate' || task === 'plan' || task === 'clone') ? 4096 : 2048,
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

    // For non-streaming, parse and return JSON
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[ai-copilot-v3] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
