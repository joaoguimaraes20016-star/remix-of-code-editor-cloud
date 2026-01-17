/**
 * Full-Funnel Response Parser
 * 
 * Transforms AI-generated funnel structures into complete Page objects
 * ready for the canvas builder.
 */

import type { 
  Page, 
  Step, 
  Frame, 
  Stack, 
  Block, 
  Element,
  PageBackground,
  StepIntent,
  BlockType,
  ElementType,
  FrameLayout
} from '@/flow-canvas/types/infostack';
import type { AIFunnelResponse, AIFunnel, AIStep, AIFrame, AIBlock, AIElement, BrandKit } from './copilotTypes';
import { generateId } from '@/flow-canvas/builder/utils/helpers';

// ============================================
// ID GENERATION
// ============================================

function genId(): string {
  return generateId();
}

// ============================================
// ELEMENT CONVERSION
// ============================================

function convertAIElement(aiElement: AIElement, brandKit: BrandKit): Element {
  const element: Element = {
    id: genId(),
    type: normalizeElementType(aiElement.type),
    content: aiElement.content || '',
    props: { ...aiElement.props },
  };
  
  // Apply brand styling to buttons
  if (element.type === 'button' && brandKit.primaryColor) {
    element.props.backgroundColor = brandKit.primaryColor;
    element.props.variant = element.props.variant || 'primary';
  }
  
  // Handle placeholders
  if (aiElement.placeholder) {
    element.props.placeholder = true;
    element.props.placeholderContext = aiElement.placeholderContext;
    if (aiElement.aspectRatio) {
      element.props.aspectRatio = aiElement.aspectRatio;
    }
  }
  
  // Apply theme-aware text colors for headings/text
  if ((element.type === 'heading' || element.type === 'text') && brandKit.theme === 'dark') {
    element.props.textColor = element.props.textColor || '#ffffff';
  }
  
  return element;
}

function normalizeElementType(type: string): ElementType {
  const typeMap: Record<string, ElementType> = {
    'headline': 'heading',
    'title': 'heading',
    'h1': 'heading',
    'h2': 'heading',
    'h3': 'heading',
    'paragraph': 'text',
    'body': 'text',
    'copy': 'text',
    'cta': 'button',
    'btn': 'button',
    'img': 'image',
    'photo': 'image',
    'vid': 'video',
    'embed': 'video',
    'line': 'divider',
    'separator': 'divider',
    'gap': 'spacer',
    'space': 'spacer',
  };
  
  const normalized = typeMap[type.toLowerCase()] || type.toLowerCase();
  
  // Validate against known types
  const validTypes: ElementType[] = [
    'text', 'heading', 'button', 'input', 'select', 'checkbox', 
    'radio', 'image', 'video', 'divider', 'spacer', 'icon', 'link',
    'multiple-choice', 'single-choice'
  ];
  
  return validTypes.includes(normalized as ElementType) ? normalized as ElementType : 'text';
}

// ============================================
// BLOCK CONVERSION
// ============================================

function convertAIBlock(aiBlock: AIBlock, brandKit: BrandKit): Block {
  return {
    id: genId(),
    type: normalizeBlockType(aiBlock.type),
    label: aiBlock.label || 'AI Block',
    elements: aiBlock.elements.map(el => convertAIElement(el, brandKit)),
    props: { ...aiBlock.props },
  };
}

function normalizeBlockType(type: string): BlockType {
  const typeMap: Record<string, BlockType> = {
    'headline': 'hero',
    'header': 'hero',
    'banner': 'hero',
    'text': 'text-block',
    'content': 'text-block',
    'paragraph': 'text-block',
    'copy': 'text-block',
    'button': 'cta',
    'action': 'cta',
    'review': 'testimonial',
    'quote': 'testimonial',
    'social-proof': 'testimonial',
    'video': 'media',
    'image': 'media',
    'embed': 'media',
    'features': 'feature',
    'benefits': 'feature',
    'questions': 'faq',
    'accordion': 'faq',
    'price': 'pricing',
    'offer': 'pricing',
    'logos': 'trust',
    'badges': 'trust',
  };
  
  const normalized = typeMap[type.toLowerCase()] || type.toLowerCase();
  
  const validTypes: BlockType[] = [
    'hero', 'form-field', 'cta', 'testimonial', 'media', 'text-block',
    'custom', 'booking', 'application-flow', 'capture-flow-embed',
    'feature', 'pricing', 'faq', 'about', 'team', 'trust', 'logo-bar',
    'footer', 'contact', 'spacer', 'divider'
  ];
  
  return validTypes.includes(normalized as BlockType) ? normalized as BlockType : 'text-block';
}

// ============================================
// FRAME CONVERSION
// ============================================

function convertAIFrame(aiFrame: AIFrame, brandKit: BrandKit): Frame {
  const stack: Stack = {
    id: genId(),
    label: 'Main Stack',
    direction: 'vertical',
    blocks: aiFrame.blocks.map(b => convertAIBlock(b, brandKit)),
    props: { alignment: 'center' },
  };
  
  const frame: Frame = {
    id: genId(),
    label: aiFrame.label || 'Section',
    stacks: [stack],
    props: {},
    layout: aiFrame.layout as FrameLayout || 'contained',
  };
  
  // Apply design preset styling
  if (aiFrame.designPreset) {
    applyDesignPreset(frame, aiFrame.designPreset, brandKit);
  }
  
  return frame;
}

function applyDesignPreset(frame: Frame, preset: string, brandKit: BrandKit): void {
  switch (preset) {
    case 'glass':
      frame.background = 'glass';
      frame.glass = {
        backdropBlur: 12,
        glassTint: brandKit.theme === 'dark' ? '#ffffff' : '#000000',
        glassTintOpacity: 5,
      };
      break;
    case 'card':
      frame.background = 'custom';
      frame.backgroundColor = brandKit.theme === 'dark' ? '#1a1a2e' : '#ffffff';
      frame.customShadow = {
        layers: [{ x: 0, y: 4, blur: 24, spread: 0, color: 'rgba(0,0,0,0.1)' }]
      };
      break;
    case 'full-bleed':
      frame.layout = 'full-width';
      frame.paddingVertical = 48;
      break;
    case 'minimal':
    default:
      // Keep defaults
      break;
  }
}

// ============================================
// STEP CONVERSION
// ============================================

function convertAIStep(aiStep: AIStep, brandKit: BrandKit): Step {
  return {
    id: genId(),
    name: aiStep.name || 'New Page',
    step_type: 'content',
    step_intent: aiStep.intent || 'capture',
    submit_mode: 'next',
    frames: aiStep.frames.map(f => convertAIFrame(f, brandKit)),
    settings: {},
  };
}

// ============================================
// PAGE SETTINGS FROM BRAND KIT
// ============================================

function createPageSettings(brandKit: BrandKit): Page['settings'] {
  const settings: Page['settings'] = {
    theme: brandKit.theme,
    primary_color: brandKit.primaryColor,
    font_family: brandKit.fontFamily,
  };
  
  // Build page background
  if (brandKit.backgroundType === 'gradient' && brandKit.backgroundGradient) {
    settings.page_background = {
      type: 'gradient',
      gradient: brandKit.backgroundGradient,
    };
  } else {
    settings.page_background = {
      type: 'solid',
      color: brandKit.backgroundColor,
    };
  }
  
  return settings;
}

// ============================================
// MAIN PARSER
// ============================================

export interface ParseFunnelResult {
  success: boolean;
  page?: Page;
  error?: string;
}

export function parseFunnelResponse(
  response: string,
  existingPage?: Page
): ParseFunnelResult {
  try {
    // Extract JSON from response
    const jsonStr = extractJSON(response);
    if (!jsonStr) {
      return { success: false, error: 'No valid JSON found in response' };
    }
    
    const parsed: AIFunnelResponse = JSON.parse(jsonStr);
    
    // Handle funnel mode
    if (parsed.funnel) {
      return parseFunnelObject(parsed.funnel, existingPage);
    }
    
    // Handle settings mode
    if (parsed.pageSettings && existingPage) {
      return applyPageSettings(parsed.pageSettings, existingPage);
    }
    
    return { success: false, error: 'Response does not contain funnel or pageSettings' };
    
  } catch (err) {
    console.error('[parseFunnelResponse] Error:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to parse response' 
    };
  }
}

function parseFunnelObject(funnel: AIFunnel, existingPage?: Page): ParseFunnelResult {
  const brandKit = funnel.brandKit || createDefaultBrandKit();
  
  // Generate steps from AI structure
  const steps = funnel.steps.map(s => convertAIStep(s, brandKit));
  
  // Build page settings from brand kit
  const settings = createPageSettings(brandKit);
  
  // Create or merge page
  const page: Page = {
    id: existingPage?.id || genId(),
    name: funnel.name || existingPage?.name || 'AI Generated Funnel',
    slug: existingPage?.slug || funnel.name?.toLowerCase().replace(/\s+/g, '-') || 'new-funnel',
    steps: steps.length > 0 ? steps : existingPage?.steps || [],
    settings: {
      ...existingPage?.settings,
      ...settings,
    },
    created_at: existingPage?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  return { success: true, page };
}

function applyPageSettings(
  pageSettings: AIFunnelResponse['pageSettings'],
  existingPage: Page
): ParseFunnelResult {
  const page: Page = {
    ...existingPage,
    settings: {
      ...existingPage.settings,
      ...pageSettings,
    },
    updated_at: new Date().toISOString(),
  };
  
  return { success: true, page };
}

function createDefaultBrandKit(): BrandKit {
  return {
    theme: 'dark',
    primaryColor: '#8B5CF6',
    accentColor: '#EC4899',
    backgroundColor: '#0f0f0f',
    backgroundType: 'gradient',
    backgroundGradient: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#1a1a2e', position: 0 },
        { color: '#16213e', position: 100 },
      ],
    },
    fontFamily: 'Inter',
    headingFont: 'Space Grotesk',
  };
}

function extractJSON(text: string): string | null {
  // Try to extract JSON from markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  
  // Try to find raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  
  return null;
}

// ============================================
// DETECTION HELPER
// ============================================

export function looksLikeFunnelResponse(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes("\"funnel\"") || lower.includes("\"pagesettings\"");
}
