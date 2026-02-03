/**
 * AI Response Parser for Funnel Builder V3
 * 
 * Parses AI responses and extracts only content properties (no styling/layout).
 * Validates against V3 block types.
 */

import { BlockType, BlockContent } from '@/funnel-builder-v3/types/funnel';
import { blockDefinitions } from '@/funnel-builder-v3/lib/block-definitions';

export interface ParsedContent {
  content: Partial<BlockContent>;
  blockType: BlockType;
  explanation?: string;
}

/**
 * Check if a string looks like JSON
 */
function looksLikeJSON(str: string): boolean {
  const trimmed = str.trim();
  return (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
         (trimmed.startsWith('[') && trimmed.endsWith(']'));
}

/**
 * Extract JSON from a response that might contain markdown or other text
 */
function extractJSON(response: string): any | null {
  // Try to find JSON object in the response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // Not valid JSON
    }
  }
  
  // Try parsing the whole response
  if (looksLikeJSON(response)) {
    try {
      return JSON.parse(response);
    } catch {
      // Not valid JSON
    }
  }
  
  return null;
}

/**
 * Strip styling properties from content
 * Only keeps text/content properties
 */
function stripStyling(content: any, blockType: BlockType): Partial<BlockContent> {
  const cleaned: any = {};
  
  // Get the block definition to know what content properties exist
  const definition = blockDefinitions[blockType];
  if (!definition) {
    return {};
  }
  
  // Extract only content properties based on block type
  switch (blockType) {
    case 'heading':
      if (content.text !== undefined) cleaned.text = content.text;
      if (content.level !== undefined) cleaned.level = content.level;
      // Don't include styles
      break;
      
    case 'text':
      if (content.text !== undefined) cleaned.text = content.text;
      // Don't include styles
      break;
      
    case 'button':
      if (content.text !== undefined) cleaned.text = content.text;
      if (content.action !== undefined) cleaned.action = content.action;
      if (content.actionValue !== undefined) cleaned.actionValue = content.actionValue;
      if (content.variant !== undefined) cleaned.variant = content.variant;
      if (content.size !== undefined) cleaned.size = content.size;
      if (content.fullWidth !== undefined) cleaned.fullWidth = content.fullWidth;
      // Don't include backgroundColor, color, styles, etc.
      break;
      
    case 'form':
      if (content.title !== undefined) cleaned.title = content.title;
      if (content.fields !== undefined) {
        cleaned.fields = content.fields.map((field: any) => ({
          id: field.id,
          type: field.type,
          label: field.label,
          placeholder: field.placeholder,
          required: field.required,
          options: field.options,
        }));
      }
      if (content.submitButton !== undefined) {
        cleaned.submitButton = {
          text: content.submitButton.text,
          action: content.submitButton.action,
          actionValue: content.submitButton.actionValue,
          variant: content.submitButton.variant,
          size: content.submitButton.size,
          fullWidth: content.submitButton.fullWidth,
        };
      }
      if (content.consent !== undefined) {
        cleaned.consent = {
          enabled: content.consent.enabled,
          text: content.consent.text,
          linkText: content.consent.linkText,
          linkUrl: content.consent.linkUrl,
          required: content.consent.required,
        };
      }
      break;
      
    case 'email-capture':
      if (content.placeholder !== undefined) cleaned.placeholder = content.placeholder;
      if (content.subtitle !== undefined) cleaned.subtitle = content.subtitle;
      if (content.submitButton !== undefined) {
        cleaned.submitButton = {
          text: content.submitButton.text,
          action: content.submitButton.action,
          actionValue: content.submitButton.actionValue,
          variant: content.submitButton.variant,
          size: content.submitButton.size,
          fullWidth: content.submitButton.fullWidth,
        };
      }
      if (content.consent !== undefined) {
        cleaned.consent = {
          enabled: content.consent.enabled,
          text: content.consent.text,
          linkText: content.consent.linkText,
          linkUrl: content.consent.linkUrl,
          required: content.consent.required,
        };
      }
      break;
      
    case 'phone-capture':
      if (content.placeholder !== undefined) cleaned.placeholder = content.placeholder;
      if (content.submitButton !== undefined) {
        cleaned.submitButton = {
          text: content.submitButton.text,
          action: content.submitButton.action,
          actionValue: content.submitButton.actionValue,
          variant: content.submitButton.variant,
          size: content.submitButton.size,
          fullWidth: content.submitButton.fullWidth,
        };
      }
      if (content.consent !== undefined) {
        cleaned.consent = {
          enabled: content.consent.enabled,
          text: content.consent.text,
          linkText: content.consent.linkText,
          linkUrl: content.consent.linkUrl,
          required: content.consent.required,
        };
      }
      break;
      
    case 'quiz':
    case 'multiple-choice':
    case 'choice':
      if (content.question !== undefined) cleaned.question = content.question;
      if (content.options !== undefined) {
        cleaned.options = content.options.map((opt: any) => ({
          id: opt.id,
          text: opt.text,
          action: opt.action,
          actionValue: opt.actionValue,
        }));
      }
      if (content.multiSelect !== undefined) cleaned.multiSelect = content.multiSelect;
      if (content.showSubmitButton !== undefined) cleaned.showSubmitButton = content.showSubmitButton;
      if (content.submitButton !== undefined) {
        cleaned.submitButton = {
          text: content.submitButton.text,
          action: content.submitButton.action,
          actionValue: content.submitButton.actionValue,
          variant: content.submitButton.variant,
          size: content.submitButton.size,
          fullWidth: content.submitButton.fullWidth,
        };
      }
      break;
      
    case 'list':
      if (content.items !== undefined) {
        cleaned.items = content.items.map((item: any) => ({
          id: item.id,
          text: item.text,
        }));
      }
      break;
      
    case 'message':
      if (content.label !== undefined) cleaned.label = content.label;
      if (content.placeholder !== undefined) cleaned.placeholder = content.placeholder;
      if (content.submitButton !== undefined) {
        cleaned.submitButton = {
          text: content.submitButton.text,
          action: content.submitButton.action,
          actionValue: content.submitButton.actionValue,
          variant: content.submitButton.variant,
          size: content.submitButton.size,
          fullWidth: content.submitButton.fullWidth,
        };
      }
      if (content.consent !== undefined) {
        cleaned.consent = {
          enabled: content.consent.enabled,
          text: content.consent.text,
          linkText: content.consent.linkText,
          linkUrl: content.consent.linkUrl,
          required: content.consent.required,
        };
      }
      break;
      
    case 'accordion':
      if (content.items !== undefined) {
        cleaned.items = content.items.map((item: any) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          defaultOpen: item.defaultOpen,
        }));
      }
      break;
      
    case 'social-proof':
      if (content.items !== undefined) {
        cleaned.items = content.items.map((item: any) => ({
          id: item.id,
          value: item.value,
          label: item.label,
          suffix: item.suffix,
        }));
      }
      break;
      
    default:
      // For other block types, try to extract common text properties
      if (content.text !== undefined) cleaned.text = content.text;
      if (content.label !== undefined) cleaned.label = content.label;
      if (content.placeholder !== undefined) cleaned.placeholder = content.placeholder;
      break;
  }
  
  return cleaned;
}

/**
 * Parse AI response for copywriting content
 */
export function parseCopyResponse(
  response: string,
  blockType?: BlockType
): ParsedContent | null {
  const json = extractJSON(response);
  if (!json) {
    // If no JSON found, try to extract text content
    if (blockType === 'heading' || blockType === 'text') {
      const text = response.trim().replace(/```json|```|`/g, '').trim();
      if (text) {
        return {
          content: { text },
          blockType: blockType || 'text',
        };
      }
    }
    return null;
  }
  
  // Determine block type
  let detectedBlockType: BlockType = blockType || 'text';
  if (json.type && blockDefinitions[json.type as BlockType]) {
    detectedBlockType = json.type as BlockType;
  } else if (json.blockType && blockDefinitions[json.blockType as BlockType]) {
    detectedBlockType = json.blockType as BlockType;
  }
  
  // Validate block type exists
  if (!blockDefinitions[detectedBlockType]) {
    console.warn(`[ai-parser] Unknown block type: ${detectedBlockType}`);
    detectedBlockType = 'text'; // Fallback
  }
  
  // Extract content and strip styling
  const content = json.content || json;
  const cleanedContent = stripStyling(content, detectedBlockType);
  
  return {
    content: cleanedContent,
    blockType: detectedBlockType,
    explanation: json.explanation || json.reasoning,
  };
}

/**
 * Validate that a block type exists in V3
 */
export function isValidV3BlockType(type: string): type is BlockType {
  return type in blockDefinitions;
}
