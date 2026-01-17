/**
 * Parse AI-generated JSON responses into Block structures
 * 
 * Handles various edge cases:
 * - JSON wrapped in markdown code blocks
 * - Extra text before/after JSON
 * - Missing IDs (generates them)
 * - Invalid structures (returns null)
 */

import type { Block, Element, ElementType, BlockType } from '@/flow-canvas/types/infostack';
import { generateId } from '@/flow-canvas/builder/utils/helpers';

// Valid element types from the schema
const VALID_ELEMENT_TYPES: ElementType[] = [
  'text', 'heading', 'button', 'input', 'select', 'checkbox', 'radio',
  'image', 'video', 'divider', 'spacer', 'icon', 'link',
  'multiple-choice', 'single-choice',
  // Premium elements
  'gradient-text', 'underline-text', 'stat-number', 'avatar-group',
  'ticker', 'badge', 'icon-text', 'process-step', 'video-thumbnail'
];

// Valid block types from the schema
const VALID_BLOCK_TYPES: BlockType[] = [
  'hero', 'form-field', 'cta', 'testimonial', 'media', 'text-block',
  'custom', 'booking', 'application-flow', 'capture-flow-embed',
  'feature', 'pricing', 'faq', 'about', 'team', 'trust',
  'logo-bar', 'footer', 'contact', 'spacer', 'divider',
  // Premium blocks
  'credibility-bar', 'stats-row', 'process-flow', 'urgency-banner',
  'ticker-bar', 'video-hero', 'split-hero', 'guarantee'
];

interface AIBlockResponse {
  block?: {
    type?: string;
    label?: string;
    elements?: Array<{
      type?: string;
      content?: string;
      props?: Record<string, unknown>;
    }>;
    props?: Record<string, unknown>;
  };
}

/**
 * Extract JSON from AI response that may contain markdown or extra text
 */
function extractJSON(text: string): string | null {
  // Try to extract from markdown code block first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  
  // Try to find JSON object directly
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  
  return null;
}

/**
 * Validate and normalize element type
 */
function normalizeElementType(type: string | undefined): ElementType {
  if (!type) return 'text';
  
  const normalized = type.toLowerCase().replace(/[_\s-]+/g, '-') as ElementType;
  
  if (VALID_ELEMENT_TYPES.includes(normalized)) {
    return normalized;
  }
  
  // Map common variations
  const typeMap: Record<string, ElementType> = {
    'h1': 'heading',
    'h2': 'heading',
    'h3': 'heading',
    'h4': 'heading',
    'h5': 'heading',
    'h6': 'heading',
    'title': 'heading',
    'paragraph': 'text',
    'p': 'text',
    'body': 'text',
    'btn': 'button',
    'cta': 'button',
    'img': 'image',
    'photo': 'image',
    'vid': 'video',
    'separator': 'divider',
    'line': 'divider',
    'gap': 'spacer',
    'space': 'spacer',
  };
  
  return typeMap[normalized] || 'text';
}

/**
 * Validate and normalize block type
 */
function normalizeBlockType(type: string | undefined): BlockType {
  if (!type) return 'text-block';
  
  const normalized = type.toLowerCase().replace(/[_\s]+/g, '-') as BlockType;
  
  if (VALID_BLOCK_TYPES.includes(normalized)) {
    return normalized;
  }
  
  // Map common variations
  const typeMap: Record<string, BlockType> = {
    'text': 'text-block',
    'content': 'text-block',
    'header': 'hero',
    'banner': 'hero',
    'form': 'form-field',
    'call-to-action': 'cta',
    'review': 'testimonial',
    'reviews': 'testimonial',
    'testimonials': 'testimonial',
    'image': 'media',
    'video': 'media',
    'features': 'feature',
    'prices': 'pricing',
    'faqs': 'faq',
    'questions': 'faq',
  };
  
  return typeMap[normalized] || 'text-block';
}

export interface StylingContext {
  theme?: 'light' | 'dark';
  primaryColor?: string;
  backgroundColor?: string;
  backgroundType?: 'solid' | 'gradient' | 'image' | 'pattern' | 'video';
}

/**
 * Parse an AI response into a valid Block structure
 * Optionally applies styling from page context
 * Returns null if parsing fails
 */
export function parseAIBlockResponse(
  response: string,
  stylingContext?: StylingContext
): Block | null {
  try {
    const jsonStr = extractJSON(response);
    if (!jsonStr) {
      console.warn('[parseAIBlockResponse] No JSON found in response');
      return null;
    }
    
    const parsed: AIBlockResponse = JSON.parse(jsonStr);
    
    if (!parsed.block) {
      console.warn('[parseAIBlockResponse] Response missing "block" property');
      return null;
    }
    
    const blockData = parsed.block;
    
    // Create valid elements with generated IDs
    const elements: Element[] = (blockData.elements || []).map((el) => {
      const baseProps = el.props ? { ...el.props } : {};
      const element: Element = {
        id: generateId(),
        type: normalizeElementType(el.type),
        content: el.content || '',
        props: baseProps,
      };
      
      // Apply styling to buttons if we have styling context
      if (stylingContext?.primaryColor && element.type === 'button') {
        element.props = {
          ...element.props,
          backgroundColor: stylingContext.primaryColor,
        };
      }
      
      // Apply theme-aware text colors
      if (stylingContext?.theme === 'dark' && (element.type === 'text' || element.type === 'heading')) {
        if (!element.props.color) {
          element.props = {
            ...element.props,
            color: '#ffffff',
          };
        }
      }
      
      return element;
    });
    
    // Ensure at least one element
    if (elements.length === 0) {
      elements.push({
        id: generateId(),
        type: 'text',
        content: 'Generated content',
        props: {},
      });
    }
    
    // Create valid block with styling applied
    const block: Block = {
      id: generateId(),
      type: normalizeBlockType(blockData.type),
      label: blockData.label || 'AI Generated Block',
      elements,
      props: {
        ...blockData.props,
        // Apply background styling if we have a dark theme
        ...(stylingContext?.theme === 'dark' && !blockData.props?.backgroundColor ? {
          backgroundColor: 'transparent',
        } : {}),
      },
    };
    
    return block;
  } catch (err) {
    console.error('[parseAIBlockResponse] Parse error:', err);
    return null;
  }
}

/**
 * Check if a string looks like it might contain valid JSON
 */
export function looksLikeJSON(text: string): boolean {
  return text.includes('{') && text.includes('}');
}

/**
 * Get a human-readable description of the parsed block
 */
export function getBlockDescription(block: Block): string {
  const elementCount = block.elements.length;
  const elementTypes = [...new Set(block.elements.map(e => e.type))].join(', ');
  return `${block.label} (${elementCount} element${elementCount !== 1 ? 's' : ''}: ${elementTypes})`;
}
