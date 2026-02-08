import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AI Provider Configuration - Claude (Anthropic)
const AI_URL = "https://api.anthropic.com/v1/messages";
const API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const CLAUDE_VERSION = "2023-06-01";

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
 * Strip HTML tags and decode entities from text
 */
function stripHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, ' ')  // Remove all HTML tags
    .replace(/&nbsp;/g, ' ')    // Replace common entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/\s+/g, ' ')       // Collapse whitespace
    .trim();
}

/**
 * Extract colors from HTML and CSS
 */
function extractColors(html: string): string[] {
  // Extract hex colors
  const hexColors = html.match(/#[0-9a-fA-F]{6}/gi) || [];
  // Extract rgb/rgba colors
  const rgbColors = html.match(/rgba?\([^)]+\)/gi) || [];
  // Extract CSS variables
  const cssVars = html.match(/--[a-z-]+:\s*([#a-z0-9()]+)/gi) || [];
  
  const allColors = [...hexColors, ...rgbColors, ...cssVars];
  return [...new Set(allColors)].slice(0, 15);
}

/**
 * Detect page mood from content
 */
function detectMood(html: string): string {
  const text = html.toLowerCase();
  const keywords = {
    professional: ['business', 'enterprise', 'solution', 'platform', 'service'],
    playful: ['fun', 'creative', 'play', 'game', 'enjoy'],
    minimal: ['simple', 'clean', 'minimal', 'elegant', 'refined'],
    bold: ['powerful', 'strong', 'impact', 'transform', 'revolutionary'],
  };
  
  let maxScore = 0;
  let detectedMood = 'professional';
  
  for (const [mood, words] of Object.entries(keywords)) {
    const score = words.reduce((acc, word) => acc + (text.includes(word) ? 1 : 0), 0);
    if (score > maxScore) {
      maxScore = score;
      detectedMood = mood;
    }
  }
  
  return detectedMood;
}

/**
 * Detect page sections with order and content
 */
function detectSections(html: string): Array<{ 
  type: string; 
  order: number;
  headings: string[];
  content: string;
}> {
  const sections: Array<{ type: string; order: number; headings: string[]; content: string }> = [];
  let order = 0;
  
  // Extract sections in order they appear
  const sectionPatterns = [
    { type: 'header', regex: /<header[^>]*>([\s\S]*?)<\/header>/gi },
    { type: 'hero', regex: /<section[^>]*(?:class|id)=["'][^"']*(?:hero|banner|intro|main)[^"']*["'][^>]*>([\s\S]*?)<\/section>/gi },
    { type: 'features', regex: /<section[^>]*(?:class|id)=["'][^"']*(?:feature|benefit|advantage)[^"']*["'][^>]*>([\s\S]*?)<\/section>/gi },
    { type: 'testimonials', regex: /<section[^>]*(?:class|id)=["'][^"']*(?:testimonial|review|quote)[^"']*["'][^>]*>([\s\S]*?)<\/section>/gi },
    { type: 'social-proof', regex: /<section[^>]*(?:class|id)=["'][^"']*(?:proof|trust|stats|numbers)[^"']*["'][^>]*>([\s\S]*?)<\/section>/gi },
    { type: 'cta', regex: /<section[^>]*(?:class|id)=["'][^"']*(?:cta|call-to-action|signup)[^"']*["'][^>]*>([\s\S]*?)<\/section>/gi },
    { type: 'faq', regex: /<section[^>]*(?:class|id)=["'][^"']*(?:faq|questions)[^"']*["'][^>]*>([\s\S]*?)<\/section>/gi },
  ];
  
  for (const pattern of sectionPatterns) {
    const matches = [...html.matchAll(pattern.regex)];
    for (const match of matches) {
      const sectionHtml = match[1];
      const headings = [...sectionHtml.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi)]
        .map(h => stripHtml(h[1]));
      const content = stripHtml(sectionHtml).slice(0, 500);
      
      sections.push({
        type: pattern.type,
        order: order++,
        headings,
        content,
      });
    }
  }
  
  return sections.sort((a, b) => a.order - b.order);
}

/**
 * Extract key messaging
 */
function extractKeyMessages(html: string): string {
  // Get meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const description = descMatch ? descMatch[1] : '';
  
  // Get first paragraph - capture all content including nested tags, then strip HTML
  const firstP = html.match(/<p[^>]*>([\s\S]{20,200}?)<\/p>/i);
  const firstParagraph = firstP ? stripHtml(firstP[1]) : '';
  
  return [description, firstParagraph].filter(Boolean).join(' | ');
}

/**
 * Extract social proof elements
 */
function extractSocialProof(html: string): string {
  const stats = html.match(/(\d+[kKmMbB]?)\s*(?:users|customers|clients|reviews|stars|ratings)/gi) || [];
  const testimonials = html.match(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi) || [];
  const testimonialsText = testimonials.map(t => stripHtml(t)).filter(t => t.length > 0);
  
  return [
    stats.length > 0 ? `Stats: ${stats.slice(0, 3).join(', ')}` : '',
    testimonialsText.length > 0 ? `Testimonials: ${testimonialsText.length} found` : '',
  ].filter(Boolean).join('\n') || 'No social proof detected';
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
    
    // Extract key elements
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';
    
    // Extract headings with hierarchy - capture all content including nested tags, then strip HTML
    const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
    const h2Matches = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
    const headings = [
      ...h1Matches.map(h => 'H1: ' + stripHtml(h)),
      ...h2Matches.slice(0, 5).map(h => 'H2: ' + stripHtml(h)),
    ];
    
    // Extract CTAs - capture all content including nested tags, then strip HTML
    const buttons = html.match(/<button[^>]*>([\s\S]*?)<\/button>/gi) || [];
    const ctaLinks = html.match(/<a[^>]*(?:class|id)=["'][^"']*(?:btn|button|cta|call-to-action|signup|get-started)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi) || [];
    const ctas = [
      ...buttons.map(b => stripHtml(b)),
      ...ctaLinks.map(a => stripHtml(a)),
    ].slice(0, 8);
    
    // Extract video URLs
    const videoUrls: Array<{ url: string; type: 'youtube' | 'vimeo' | 'loom' | 'wistia' | 'hosted' }> = [];
    const seenUrls = new Set<string>(); // For exact deduplication
    
    // Helper function to add video URL if not already seen
    const addVideoUrl = (url: string, type: 'youtube' | 'vimeo' | 'loom' | 'wistia' | 'hosted') => {
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        videoUrls.push({ url, type });
      }
    };
    
    // Extract iframe src and data-src attributes (for lazy-loaded videos)
    const iframeMatches = html.match(/<iframe[^>]+(?:src|data-src)=["']([^"']+)["']/gi) || [];
    const iframeUrls: string[] = [];
    iframeMatches.forEach(match => {
      const srcMatch = match.match(/(?:src|data-src)=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        iframeUrls.push(srcMatch[1]);
      }
    });
    
    // Extract video URLs from data attributes
    const dataVideoMatches = html.match(/data-(?:video-url|video-src|src)=["']([^"']+)["']/gi) || [];
    dataVideoMatches.forEach(match => {
      const urlMatch = match.match(/data-(?:video-url|video-src|src)=["']([^"']+)["']/i);
      if (urlMatch && urlMatch[1]) {
        iframeUrls.push(urlMatch[1]);
      }
    });
    
    // Combine HTML with extracted iframe URLs for processing
    const searchText = html + ' ' + iframeUrls.join(' ');
    
    // Extract YouTube embeds (multiple formats)
    // Handle youtube.com/embed/VIDEO_ID
    const youtubeEmbedMatches = searchText.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/gi) || [];
    // Handle youtube.com/watch?v=VIDEO_ID (with flexible query params)
    const youtubeWatchMatches = searchText.match(/youtube\.com\/watch[^"'\s]*[?&]v=([a-zA-Z0-9_-]+)/gi) || [];
    // Handle youtube-nocookie.com (privacy-enhanced)
    const youtubeNoCookieMatches = searchText.match(/youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]+)/gi) || [];
    // Handle youtu.be/VIDEO_ID
    const youtubeShortMatches = searchText.match(/youtu\.be\/([a-zA-Z0-9_-]+)/gi) || [];
    
    [...youtubeEmbedMatches, ...youtubeWatchMatches, ...youtubeNoCookieMatches, ...youtubeShortMatches].forEach(match => {
      const videoIdMatch = match.match(/([a-zA-Z0-9_-]+)$/);
      if (videoIdMatch && videoIdMatch[1]) {
        const videoId = videoIdMatch[1];
        addVideoUrl(`https://www.youtube.com/watch?v=${videoId}`, 'youtube');
      }
    });
    
    // Extract Vimeo embeds (handle various formats)
    const vimeoMatches = html.match(/vimeo\.com\/(\d+)/gi) || [];
    vimeoMatches.forEach(match => {
      const videoIdMatch = match.match(/(\d+)$/);
      if (videoIdMatch && videoIdMatch[1]) {
        const videoId = videoIdMatch[1];
        addVideoUrl(`https://vimeo.com/${videoId}`, 'vimeo');
      }
    });
    
    // Extract Loom embeds (expanded to include /video/ and other paths)
    const loomMatches = searchText.match(/loom\.com\/(?:share|embed|video)\/([a-zA-Z0-9]+)/gi) || [];
    loomMatches.forEach(match => {
      const videoIdMatch = match.match(/([a-zA-Z0-9]+)$/);
      if (videoIdMatch && videoIdMatch[1]) {
        const videoId = videoIdMatch[1];
        addVideoUrl(`https://www.loom.com/share/${videoId}`, 'loom');
      }
    });
    
    // Extract Wistia embeds
    const wistiaMatches = html.match(/wistia\.(?:net|com)\/(?:medias|embed)\/([a-zA-Z0-9]+)/gi) || [];
    wistiaMatches.forEach(match => {
      const videoIdMatch = match.match(/([a-zA-Z0-9]+)$/);
      if (videoIdMatch && videoIdMatch[1]) {
        const videoId = videoIdMatch[1];
        addVideoUrl(`https://fast.wistia.net/embed/iframe/${videoId}`, 'wistia');
      }
    });
    
    // Extract direct video file URLs from various contexts
    // Match URLs in quotes, attributes, or standalone
    const videoFileMatches = searchText.match(/https?:\/\/[^\s"'<>]+\.(?:mp4|webm|ogg|mov|avi)(?:\?[^\s"']*)?/gi) || [];
    videoFileMatches.forEach(url => {
      // Clean up URL (remove trailing quotes/punctuation)
      const cleanUrl = url.replace(/["']+$/, '').trim();
      if (cleanUrl) {
        addVideoUrl(cleanUrl, 'hosted');
      }
    });
    
    // Extract main content text
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Extract font families and typography hints
    const fontFamilies = [...new Set((html.match(/font-family:\s*["']?([^;"']+)/gi) || []).map(f => f.replace(/font-family:\s*["']?/i, '').replace(/["']/g, '').trim()))];
    const headingStyles = html.match(/<h1[^>]*style=["'][^"']*["']/gi) || [];
    
    // Get ordered sections with content
    const orderedSections = detectSections(html);
    
    // Build structured analysis
    const analysis = `
URL: ${url}

BRANDING SIGNALS:
- Colors found: ${extractColors(html).slice(0, 8).join(', ')}
- Mood: ${detectMood(html)} (professional/playful/minimal/bold)
${fontFamilies.length > 0 ? `- Fonts detected: ${fontFamilies.slice(0, 3).join(', ')}` : ''}

PAGE STRUCTURE (in order):
${orderedSections.length > 0 ? orderedSections.map((s, i) => {
  const headingText = s.headings.length > 0 ? s.headings.slice(0, 2).map(h => `"${h.slice(0, 60)}"`).join(' + ') : '';
  return `${i + 1}. ${s.type}: ${headingText}${headingText ? ' + ' : ''}${s.content.slice(0, 100)}...`;
}).join('\n') : '- Single page layout'}

HEADLINES:
${headings.join('\n') || 'No headings found'}

KEY MESSAGING:
${extractKeyMessages(html) || 'No clear messaging found'}

CALLS TO ACTION:
${ctas.join('\n') || 'No CTAs found'}

VIDEOS FOUND:
${videoUrls.length > 0 ? videoUrls.map(v => `- ${v.type}: ${v.url}`).join('\n') : '- No videos detected'}

SOCIAL PROOF:
${extractSocialProof(html)}

MAIN CONTENT (first 8000 chars):
${text.slice(0, 8000)}
`.trim();
    
    return analysis;
  } catch (error) {
    console.error(`[ai-copilot-v3] Error fetching URL: ${error}`);
    throw error;
  }
}

/**
 * Get system prompt for clone-plan task (lightweight plan only)
 */
function getClonePlanPrompt(pageAnalysis: string, action: string): string {
  const isFunnel = action === 'replace-funnel';
  
  return `You are a funnel planner. Analyze this website and create a DETAILED PLAN for rebuilding it.

PAGE ANALYSIS:
${pageAnalysis.slice(0, 15000)}

CRITICAL: The "summary" field is REQUIRED and MUST be a detailed 3-5 sentence explanation. DO NOT just say "Light Theme" or "Dark Theme". 

The summary MUST include:
1. What you DETECTED: "Based on this [specific topic/type] landing page..."
2. What you will BUILD: "I'll create a ${isFunnel ? '[N]-step' : 'single step'} funnel with [specific step purposes]..."
3. BRANDING DETAILS: "Using [specific background color] backgrounds with [specific accent color] for buttons/accents, creating a [mood/style] feel..."
4. CONTENT STRUCTURE: "Each step will include [specific block types] to [specific purpose]..."
5. CONTRAST ASSURANCE: "Text will be [light/dark] (#HEX) for proper readability against the [dark/light] background..."

EXAMPLE OF A GOOD SUMMARY:
"Based on this trading course landing page, I'll create a 3-step dark-themed funnel: (1) Lead Capture step with a bold headline about the 3-chart setup, value proposition text, and email capture form to collect leads, (2) Benefits page with feature list blocks highlighting the strategy's advantages, social proof stats showing trader success numbers, and a CTA button, (3) Thank you page with confirmation message and next steps. Using dark backgrounds (#0f0f1a) with gold/yellow accents (#FFD700) for buttons and highlights, creating a premium, professional trading feel. Text will be white (#ffffff) for proper readability against the dark background. Each step will include heading blocks for headlines, text blocks for descriptions, button blocks for CTAs, and social-proof blocks for trust indicators."

BRANDING RULES - CRITICAL:
- backgroundColor: The page/step background color
- textColor: Main text color that CONTRASTS with backgroundColor
  * For dark backgrounds (#000-#333): use white/light text (#ffffff, #f0f0f0)
  * For light backgrounds (#eee-#fff): use dark text (#000000, #1a1a1a)
- headingColor: Heading text color (can be same as textColor or accent)
- primaryColor: Button/accent color that stands out from background

COLOR APPLICATION RULES - MUST BE APPLIED TO ALL BLOCKS:
- Accordion blocks: MUST include titleColor (use headingColor) and contentColor (use textColor)
- List blocks: MUST include textColor property
- Reviews blocks: MUST include textColor property
- Countdown blocks: MUST include textColor property (use headingColor for emphasis)
- Webinar blocks: MUST include titleColor property (use headingColor)
- These colors prevent black/gray text on dark backgrounds and ensure proper contrast

INTELLIGENT BLOCK SELECTION - CRITICAL RULES:
- If the page has testimonials with quotes and author names -> use "testimonial-slider" block
- If the page has star ratings or review badges -> use "reviews" block
- If the page has statistics/metrics (e.g., "10,000+ customers") -> use "social-proof" block
- If the page has embedded videos -> use "video" block with the extracted URL
- If the page has FAQ sections with questions/answers -> use "accordion" block
- If the page has logo strips/partner logos -> use "logo-bar" block
- NEVER use "card" blocks - they are layout containers, not content blocks
- If you need to group content, use multiple sequential blocks instead
- Focus on content blocks: heading, text, button, testimonial-slider, social-proof, reviews, video, accordion
- DO NOT put testimonial content in "text" blocks - use the proper "testimonial-slider" block
- DO NOT put statistics in "text" blocks - use "social-proof" block
- DO NOT put video URLs in "text" blocks - use "video" block
- DO NOT put FAQ content in "text" blocks - use "accordion" block

IMPORTANT: Include a "blocks" array with the ACTUAL CONTENT you will create. Users need to see exactly what headlines, texts, buttons, videos, testimonials, and other blocks you'll build BEFORE approving.

Return ONLY valid JSON:
{
  "summary": "YOUR DETAILED 3-5 SENTENCE SUMMARY HERE - MUST EXPLAIN WHAT YOU DETECTED, WHAT YOU'LL BUILD, BRANDING, AND STRUCTURE",
  "action": "${action}",
  "detected": {
    "topic": "What the page is about (e.g., Trading course, SaaS product, etc.)",
    "style": "Visual style (e.g., Dark, premium, minimal, bold, playful)",
    "keyElements": ["Key element 1", "Key element 2", "Key element 3"]
  },
  "branding": {
    "primaryColor": "#HEX",
    "accentColor": "#HEX",
    "backgroundColor": "#HEX",
    "textColor": "#HEX",
    "headingColor": "#HEX",
    "theme": "dark|light"
  },
  ${isFunnel ? `"steps": [
    {
      "name": "Step Name",
      "type": "capture|sell|result",
      "description": "Brief description of what this step does",
      "blocks": [
        { "type": "heading", "preview": "The exact headline text you will use" },
        { "type": "text", "preview": "The description/body text you will use (first 100 chars)..." },
        { "type": "button", "preview": "Button text like 'Get Started'" },
        { "type": "email-capture", "preview": "Email form with placeholder text" },
        { "type": "video", "preview": "Video: [YouTube/Vimeo/Loom URL if found]" },
        { "type": "testimonial-slider", "preview": "Testimonials: [Quote 1], [Quote 2], etc." },
        { "type": "social-proof", "preview": "Stats: [Number] [Label], [Number] [Label]" },
        { "type": "reviews", "preview": "Reviews: [Rating] stars, [Count] reviews" },
        { "type": "accordion", "preview": "FAQ: [Question 1], [Question 2]" }
      ]
    }
  ]` : `"step": {
    "name": "Step Name",
    "description": "Brief description of what this step does",
      "blocks": [
        { "type": "heading", "preview": "The exact headline text you will use" },
        { "type": "text", "preview": "The description/body text you will use (first 100 chars)..." },
        { "type": "button", "preview": "Button text like 'Get Started'" },
        { "type": "video", "preview": "Video: [YouTube/Vimeo/Loom URL if found]" },
        { "type": "testimonial-slider", "preview": "Testimonials: [Quote 1], [Quote 2]" },
        { "type": "social-proof", "preview": "Stats: [Number] [Label]" }
      ]
  }`}
}

CRITICAL RULES:
1. The summary field MUST be 3-5 detailed sentences explaining everything
2. Each block in "blocks" array MUST have "type" and "preview" with ACTUAL content from the page
3. Preview text should be the real headlines, descriptions, and button labels you'll use
4. Minimum 3 sentences for summary, ideally 4-5 sentences`;
}

/**
 * Get system prompt for clone task
 */
function getClonePrompt(pageAnalysis: string, action: 'replace-funnel' | 'replace-step', context: any): string {
  const isFunnel = action === 'replace-funnel';
  
  return `You are an expert funnel designer. Study this website and use it as INSPIRATION to create ${isFunnel ? 'a complete funnel' : 'a single step'}.

IMPORTANT: You are NOT copying the website. You are:
1. Studying its branding (colors, fonts, mood)
2. Understanding its messaging and value proposition
3. Identifying its structure (hero, features, social proof, CTA)
4. REBUILDING it intelligently using OUR block system

Think of it like: "If I were building this page from scratch with our tools, how would I recreate the same vibe and intent?"

WEBSITE ANALYSIS:
${pageAnalysis.slice(0, 15000)}

AVAILABLE V3 BLOCKS (use these to rebuild):
${V3_BLOCK_TYPES.map(t => `- ${t}`).join('\n')}

COMMON BLOCK USAGE:
- heading: Headlines (h1-h6), section titles
- text: Body copy, descriptions, value propositions
- button: CTAs (primary, secondary, outline variants)
- form: Multi-field forms (contact, registration)
- email-capture: Simple email opt-in
- list: Bullet points, feature lists
- accordion: FAQ sections, expandable content
- social-proof: Stats, numbers, trust indicators
- countdown: Urgency timers
- video: Video embeds
- image: Images (use placeholder URLs like "https://via.placeholder.com/800x600")
- divider: Section separators
- spacer: Vertical spacing
- logo-bar: Trust logos, partner logos
- reviews: Testimonials, customer reviews
- testimonial-slider: Multiple testimonials with quotes and author details

CRITICAL BLOCK RULES:
- NEVER use "card" blocks - they are layout containers, not content blocks
- If you need to group content, use multiple sequential blocks instead
- Focus on content blocks: heading, text, button, testimonial-slider, social-proof, reviews, video, accordion

TEXT HIERARCHY - CRITICAL FOR READABILITY:
Every landing page needs proper text hierarchy. Use these levels:

1. PRIMARY HEADLINE (heading level 1):
   - The main hook/value proposition
   - Largest, boldest text on the page
   - Only 1 per step

2. SUBHEADLINE/SUPPORTING TEXT (heading level 2):
   - Supports the primary headline
   - Explains or expands on the main message
   - Smaller than primary, but still prominent

3. DESCRIPTION TEXT (text block):
   - Body copy, detailed explanations
   - Regular paragraph text
   - Can be multiple paragraphs

STRUCTURE EXAMPLE:
- Heading (level 1): "Triple Your Revenue in 90 Days" <- Primary headline
- Heading (level 2): "The proven framework used by 10,000+ businesses" <- Subheadline
- Text: "Learn the exact strategies that helped our clients achieve consistent growth..." <- Description

SECTION-TO-BLOCK MAPPING (follow this pattern):

hero section:
  - heading (level 1): Primary headline
  - heading (level 2): Subheadline/supporting text
  - text: Description paragraph
  - button: Main CTA
  - video: If video present

features section:
  - heading (level 2): Section title like "Key Features"
  - list: Feature items with icons
  OR
  - text: Feature descriptions

testimonials section:
  - heading (level 2): Section title like "What Customers Say"
  - testimonial-slider: With 3-5 testimonials
  - reviews: Star rating badge

social-proof section:
  - social-proof: Stats/metrics block
  - logo-bar: Partner/client logos

cta section:
  - heading (level 2): Action headline
  - text: Supporting copy
  - button: CTA button

YOUR TASK:
Create a ${isFunnel ? 'complete funnel with 2-4 steps' : 'single comprehensive step'} that captures the page's essence:

${isFunnel ? `
FUNNEL STRUCTURE (2-4 steps with 10-15 blocks each):
- Step 1 (Capture): Hook headline + value proposition + benefit list + logo bar + social proof stats + reviews block + testimonials (3-5) + email capture form
- Step 2 (Sell): Features/benefits + MULTIPLE testimonial sliders (3-5 testimonials EACH) + reviews block + social proof stats + video + accordion FAQ + logo bar + CTA button
- Step 3 (Result): Thank you message + next steps + additional testimonials + social proof + CTA

CRITICAL: Each step should have 10-15 blocks that flow naturally. Layer multiple trust elements:
- Use 3-4 social proof blocks per step (combine stats, testimonials, reviews, logos)
- Include 3-5 testimonials in EACH testimonial-slider block (NOT just one!)
- Extract and recreate ALL social proof elements from the original page
- Build rich, meaningful content with specific metrics and results
- MATCH THE DETECTED SECTION ORDER: If the page analysis shows sections in order (hero → features → testimonials → CTA), recreate blocks in that EXACT sequence
- Don't reorganize sections - preserve the original flow from the page
` : `
SINGLE STEP STRUCTURE (10-15 blocks):
- Main headline (heading block)
- Value proposition (text block)
- Key benefits (list block with 5-7 items)
- Logo bar (if partners/clients mentioned)
- Social proof stats block (metrics like "10,000+ customers")
- Testimonial slider with 3-5 detailed testimonials
- Reviews block (star rating + review count)
- Video block (if video found on page)
- Accordion FAQ (if questions/answers found)
- CTA button

Use 10-15 blocks to recreate the page's vibe with layered trust elements and rich content.
`}

BRANDING & COLORS - CRITICAL FOR READABILITY:
Extract colors that match the original AND ensure proper contrast:

1. backgroundColor: The page/step background color
2. textColor: Main text color that CONTRASTS with backgroundColor
   - For dark backgrounds (#000-#333): use white/light text (#ffffff, #f0f0f0)
   - For light backgrounds (#eee-#fff): use dark text (#000000, #1a1a1a)
3. headingColor: Heading text color (can be same as textColor or a highlight color that still contrasts)
4. primaryColor: Button/accent color - should stand out from background
5. accentColor: Secondary color for highlights

EVERY BLOCK MUST HAVE APPROPRIATE COLORS - STRUCTURE IS CRITICAL:
- heading: Color goes in content.styles.color (NOT content.color)
- text: Color goes in content.styles.color (NOT content.color)
- button: backgroundColor AND color go directly in content (buttons are different)
- list: textColor property in content (NOT styles.color)
- accordion: titleColor (use headingColor) and contentColor (use textColor) in content
- reviews: textColor property in content
- countdown: textColor property in content (use headingColor for emphasis)
- webinar: titleColor property in content (use headingColor)
- social-proof: valueColor (use headingColor) and labelColor (use textColor) in content
- These color properties prevent black/gray text on dark backgrounds and ensure proper contrast

Return ONLY valid JSON:
{
  "branding": {
    "primaryColor": "#HEX",
    "accentColor": "#HEX",
    "backgroundColor": "#HEX",
    "textColor": "#HEX",
    "headingColor": "#HEX",
    "headingFont": "Font Name",
    "bodyFont": "Font Name",
    "theme": "light|dark"
  },
  ${isFunnel ? `"funnel": {
    "name": "Funnel name based on page topic",
    "steps": [
      {
        "name": "Step name",
        "type": "capture|sell|book|educate|result",
        "slug": "step-slug",
        "blocks": [
          {
            "type": "heading",
            "content": {
              "text": "Headline text",
              "level": 1,
              "styles": {
                "color": "#ffffff",
                "textAlign": "center"
              }
            }
          },
          {
            "type": "text",
            "content": {
              "text": "Description text",
              "styles": {
                "color": "#f0f0f0",
                "textAlign": "center"
              }
            }
          },
          {
            "type": "button",
            "content": {
              "text": "CTA text",
              "variant": "primary",
              "size": "lg",
              "action": "next-step",
              "backgroundColor": "#D97757",
              "color": "#ffffff"
            },
            "styles": {
              "textAlign": "center"
            }
          }
        ],
        "settings": {
          "backgroundColor": "#0f0f1a"
        }
      }
    ]
  }` : `"step": {
    "name": "Step name",
    "type": "capture|sell|result",
    "slug": "step-slug",
    "blocks": [
      {
        "type": "heading",
        "content": {
          "text": "Headline text",
          "level": 1,
          "styles": {
            "color": "#ffffff",
            "textAlign": "center"
          }
        }
      },
      {
        "type": "text",
        "content": {
          "text": "Description text",
          "styles": {
            "color": "#f0f0f0",
            "textAlign": "center"
          }
        }
      },
      {
        "type": "button",
        "content": {
          "text": "CTA text",
          "variant": "primary",
          "size": "lg",
          "action": "next-step",
          "backgroundColor": "#D97757",
          "color": "#ffffff"
        },
        "styles": {
          "textAlign": "center"
        }
      }
    ],
    "settings": {
      "backgroundColor": "#0f0f1a"
    }
  }`}
}

CRITICAL RULES:
- Use ONLY V3 block types listed above
- NO emojis in any text
- NO external image URLs (use placeholders)
- Buttons should have textAlign: "center" in styles
- Headings and text blocks should have appropriate textAlign based on the original design
- Use the website as INSPIRATION - capture the same energy and intent, but rebuild with our blocks
- Don't copy verbatim - understand the messaging and recreate it in your own words
- Return ONLY valid JSON, no markdown, no code blocks`;
}

/**
 * Get system prompt for generate task
 */
function getGeneratePrompt(context: any): string {
  const branding = context.branding || {};
  const hasBranding = !!branding.primaryColor;
  
  // Determine text colors based on theme
  const textColor = branding.textColor || (branding.theme === 'dark' ? '#ffffff' : '#000000');
  const headingColor = branding.headingColor || textColor;
  const bgColor = branding.backgroundColor || (branding.theme === 'dark' ? '#0f0f1a' : '#ffffff');
  
  // Build branding instructions if branding is provided
  const brandingInstructions = hasBranding ? `
BRANDING - YOU MUST APPLY THESE COLORS TO EVERY BLOCK:
- Step background color: ${bgColor}
- Heading text color: ${headingColor}
- Body text color: ${textColor}
- Button background: ${branding.primaryColor}
- Button text: Use white (#ffffff) for dark buttons, black (#000000) for light buttons
- Theme: ${branding.theme || 'light'}

COLOR PLACEMENT IS CRITICAL:
- For heading/text/list blocks: Put color in content.styles.color
- For buttons: Put backgroundColor and color directly in content
- All steps must have settings.backgroundColor set to ${bgColor}

Example heading with correct color structure:
{
  "type": "heading",
  "content": {
    "text": "Your Headline Here",
    "level": 1,
    "styles": {
      "color": "${headingColor}",
      "textAlign": "center"
    }
  }
}

Example text with correct color structure:
{
  "type": "text",
  "content": {
    "text": "Description text here",
    "styles": {
      "color": "${textColor}",
      "textAlign": "center"
    }
  }
}

Example button with correct color structure:
{
  "type": "button",
  "content": {
    "text": "Get Started",
    "action": "next-step",
    "variant": "primary",
    "size": "lg",
    "backgroundColor": "${branding.primaryColor}",
    "color": "#ffffff"
  },
  "styles": {
    "textAlign": "center"
  }
}

Example accordion (FAQ) with correct color structure:
{
  "type": "accordion",
  "content": {
    "items": [
      {
        "id": "1",
        "title": "Question text here",
        "content": "Answer text here"
      }
    ],
    "titleColor": "${headingColor}",
    "contentColor": "${textColor}"
  }
}

Example list with correct color structure:
{
  "type": "list",
  "content": {
    "items": [
      { "id": "1", "text": "List item 1" },
      { "id": "2", "text": "List item 2" }
    ],
    "textColor": "${textColor}"
  }
}

Example reviews with correct color structure:
{
  "type": "reviews",
  "content": {
    "rating": 4.8,
    "reviewCount": "200+",
    "textColor": "${textColor}"
  }
}

Example countdown with correct color structure:
{
  "type": "countdown",
  "content": {
    "endDate": "2024-12-31T23:59:59",
    "textColor": "${headingColor}"
  }
}

Example webinar with correct color structure:
{
  "type": "webinar",
  "content": {
    "title": "Webinar Title",
    "titleColor": "${headingColor}"
  }
}

CRITICAL COLOR RULES:
- ALWAYS include titleColor and contentColor for accordion blocks
- ALWAYS include textColor for list, reviews, and countdown blocks
- ALWAYS include titleColor for webinar blocks
- These colors MUST match the extracted branding colors (${headingColor} for titles/headings, ${textColor} for body text)
- Never leave these color properties undefined or missing - they prevent black/gray text on dark backgrounds
` : '';

  return `You are a funnel architect for Funnel Builder V3.

Generate a complete funnel matching the user's prompt. Use ONLY V3 block types.

Available V3 Block Types: ${V3_BLOCK_TYPES.join(', ')}
${brandingInstructions}

TEXT HIERARCHY - CRITICAL FOR READABILITY:
Every landing page needs proper text hierarchy. Use these levels:

1. PRIMARY HEADLINE (heading level 1):
   - The main hook/value proposition
   - Largest, boldest text on the page
   - Only 1 per step

2. SUBHEADLINE/SUPPORTING TEXT (heading level 2):
   - Supports the primary headline
   - Explains or expands on the main message
   - Smaller than primary, but still prominent

3. DESCRIPTION TEXT (text block):
   - Body copy, detailed explanations
   - Regular paragraph text
   - Can be multiple paragraphs

STRUCTURE EXAMPLE:
- Heading (level 1): "Triple Your Revenue in 90 Days" <- Primary headline
- Heading (level 2): "The proven framework used by 10,000+ businesses" <- Subheadline
- Text: "Learn the exact strategies that helped our clients achieve consistent growth..." <- Description

MATCH THE ORIGINAL PAGE STRUCTURE:
- Look at the detected sections and recreate them IN ORDER
- If the page has hero → features → testimonials → CTA, build blocks in that EXACT sequence
- Don't reorganize sections - preserve the original flow
- Each detected section should become a group of blocks that recreate its purpose

COMPLEX FUNNEL ARCHITECTURE - CRITICAL RULES:
- Each step should have 8-15 blocks for rich, engaging content
- Layer multiple trust elements: Use 2-4 social proof blocks per step
- Include 3-5 testimonials in EVERY testimonial-slider block (NOT just one!)
- Build emotional connection with detailed value propositions
- Create depth: explain benefits, show transformations, tell stories with specific metrics

SOCIAL PROOF LAYERING STRATEGY:
- Capture step: Logo bar + Social proof stats + Reviews block + 1-2 testimonials
- Sell step: Multiple testimonial sliders (3-5 testimonials EACH) + Reviews block + Social proof stats + Logo bar + Video
- Result step: Thank you + Social proof + Testimonials + Next steps

TESTIMONIAL QUALITY REQUIREMENTS (CRITICAL):
- Each testimonial MUST include specific results, metrics, or transformations
- Good examples: "Increased revenue by 300%", "Went from $10K to $100K in 6 months", "Saved 20 hours per week"
- Include full author details: Name, Title, Company
- Use emotional language and specific outcomes, not generic praise like "great product"
- Minimum 3 testimonials per testimonial-slider block, ideally 5

INTELLIGENT BLOCK SELECTION - CRITICAL RULES:
- If the prompt mentions testimonials, reviews, or customer quotes -> use "testimonial-slider" block (NOT text blocks)
- If the prompt mentions star ratings or review counts -> use "reviews" block (NOT text blocks)
- If the prompt mentions statistics, metrics, or numbers (e.g., "10,000+ customers") -> use "social-proof" block (NOT text blocks)
- If the prompt mentions videos or video URLs -> use "video" block with the URL
- If the prompt mentions FAQ or questions/answers -> use "accordion" block (NOT text blocks)
- If the prompt mentions logos or partners -> use "logo-bar" block (NOT individual image blocks)
- If the prompt mentions countdown timers -> use "countdown" block
- If the prompt mentions webinars or events -> use "webinar" block
- NEVER use "card" blocks - they are layout containers, not content blocks
- If you need to group content, use multiple sequential blocks instead
- Focus on content blocks: heading, text, button, testimonial-slider, social-proof, reviews, video, accordion
- DO NOT put testimonial content in "text" blocks - use "testimonial-slider" block
- DO NOT put statistics in "text" blocks - use "social-proof" block
- DO NOT put video URLs in "text" blocks - use "video" block
- DO NOT put FAQ content in "text" blocks - use "accordion" block

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
              "level": 1${hasBranding ? `,
              "styles": {
                "color": "${headingColor}",
                "textAlign": "center"
              }` : ''}
            }
          },
          {
            "type": "text",
            "content": {
              "text": "Description text",
              "styles": {
                "color": "${hasBranding ? textColor : '#000000'}",
                "textAlign": "center"
              }
            }
          },
          {
            "type": "button",
            "content": {
              "text": "Get Started",
              "action": "next-step",
              "variant": "primary",
              "size": "lg"${hasBranding ? `,
              "backgroundColor": "${branding.primaryColor}",
              "color": "#ffffff"` : ''}
            },
            "styles": {
              "textAlign": "center"
            }
          },
          {
            "type": "testimonial-slider",
            "content": {
              "testimonials": [
                {
                  "id": "1",
                  "quote": "I went from losing money every month to consistent 5-figure gains. This strategy changed everything for me. In just 3 months, I've made back my investment 10x over.",
                  "authorName": "Marcus Thompson",
                  "authorTitle": "Full-time Trader"
                },
                {
                  "id": "2",
                  "quote": "The framework helped us 3X our valuation in 18 months. His strategic insights were invaluable. We went from struggling startup to acquisition target.",
                  "authorName": "David Park",
                  "authorTitle": "Founder, Acquired Startup"
                },
                {
                  "id": "3",
                  "quote": "They took us from $50K to $500K monthly revenue in just 8 months. The ROI has been incredible. Best business decision we ever made.",
                  "authorName": "Sarah Johnson",
                  "authorTitle": "CEO, TechStartup Inc"
                },
                {
                  "id": "4",
                  "quote": "After implementing their system, we reduced customer acquisition cost by 60% while doubling our conversion rate. The results speak for themselves.",
                  "authorName": "Michael Chen",
                  "authorTitle": "CMO, SaaS Company"
                },
                {
                  "id": "5",
                  "quote": "From $0 to $100K in my first year using their exact blueprint. The step-by-step guidance made all the difference. Highly recommend!",
                  "authorName": "Jennifer Martinez",
                  "authorTitle": "Entrepreneur"
                }
              ],
              "autoPlay": true,
              "interval": 5
            }
          },
          {
            "type": "social-proof",
            "content": {
              "items": [
                { "id": "1", "value": 10000, "label": "Happy Customers", "suffix": "+" },
                { "id": "2", "value": 50, "label": "Countries", "suffix": "+" }
              ]
            }
          },
          {
            "type": "video",
            "content": {
              "src": "https://www.youtube.com/watch?v=...",
              "type": "youtube"
            }
          },
          {
            "type": "reviews",
            "content": {
              "rating": 4.8,
              "reviewCount": "200+",
              "avatars": []
            }
          },
          {
            "type": "accordion",
            "content": {
              "items": [
                {
                  "id": "1",
                  "question": "What is this product?",
                  "answer": "This product helps you..."
                }
              ],
              "titleColor": "${headingColor}",
              "contentColor": "${textColor}"
            }
          }
        ],
        "settings": {
          "backgroundColor": "${bgColor}"
        }
      }
    ]
  }
}

CRITICAL RULES:
- Use ONLY V3 block types listed above
- NO emojis in any text
- NO external image URLs (use placeholders)
- Allow rich, detailed content for testimonials and descriptions
- Build complex, meaningful funnels with 8-15 blocks per step
${hasBranding ? `- EVERY heading/text block MUST have styles.color set
- EVERY button MUST have backgroundColor and color set
- EVERY step MUST have settings.backgroundColor set to ${bgColor}` : ''}
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
    
    if (!API_KEY) {
      console.error("ANTHROPIC_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI provider not configured. Please check your API key settings." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For clone task, fetch the URL content first
    let userPrompt = prompt;
    let systemPrompt: string;
    
    if (task === 'clone-plan') {
      try {
        console.log(`[ai-copilot-v3] Fetching URL content for plan: ${prompt}`);
        const pageAnalysis = await fetchWebsiteContent(prompt);
        const cloneAction = context.cloneAction || 'replace-step';
        systemPrompt = getClonePlanPrompt(pageAnalysis, cloneAction);
        userPrompt = `Create a detailed plan for rebuilding ${cloneAction === 'replace-funnel' ? 'a complete funnel' : 'a single step'} based on this website.`;
      } catch (fetchError) {
        console.error(`[ai-copilot-v3] Failed to fetch URL: ${fetchError}`);
        return new Response(
          JSON.stringify({ error: `Failed to fetch website: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (task === 'clone') {
      try {
        console.log(`[ai-copilot-v3] Fetching URL content: ${prompt}`);
        const pageAnalysis = await fetchWebsiteContent(prompt);
        const cloneAction = context.cloneAction || 'replace-step';
        systemPrompt = getClonePrompt(pageAnalysis, cloneAction, context);
        userPrompt = `Use this website as inspiration to rebuild ${cloneAction === 'replace-funnel' ? 'a complete funnel' : 'a single step'} with our V3 blocks.`;
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

    const maxTokens = (task === 'generate' || task === 'plan' || task === 'clone' || task === 'clone-plan') ? 4096 : 2048;

    console.log(`[ai-copilot-v3] Task: ${task}, Stream: ${stream}, Model: ${CLAUDE_MODEL}`);

    const response = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "x-api-key": API_KEY!,
        "anthropic-version": CLAUDE_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: maxTokens,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          { role: "user", content: userPrompt },
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

    // For streaming, transform Anthropic SSE format to OpenAI format
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

                    if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                      const openAIFormat = {
                        choices: [{ delta: { content: parsed.delta.text } }]
                      };
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify(openAIFormat)}\n\n`)
                      );
                    }

                    if (parsed.type === 'message_stop') {
                      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    }
                  } catch {
                    // Skip unparseable lines
                  }
                }
              }
            }

            controller.close();
          } catch (err) {
            console.error('[ai-copilot-v3] Stream error:', err);
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
    console.error("[ai-copilot-v3] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
