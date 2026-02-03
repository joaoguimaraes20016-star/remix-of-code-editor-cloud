/**
 * Funnel Parser for Funnel Builder V3
 * 
 * Parses AI-generated funnel JSON and converts to V3 structure
 */

import { FunnelStep, Block, BlockType, BlockContent } from '@/funnel-builder-v3/types/funnel';
import { v4 as uuid } from 'uuid';
import { blockDefinitions } from './block-definitions';
import { ClonedStyle } from './clone-converter';

export interface BrandingInfo {
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  headingFont?: string;
  bodyFont?: string;
  theme?: 'dark' | 'light';
}

export interface ParsedFunnel {
  steps: FunnelStep[];
  branding: BrandingInfo;
}

/**
 * Validate block type exists in V3
 */
function isValidBlockType(type: string): type is BlockType {
  return type in blockDefinitions;
}

/**
 * Create a Block from parsed content
 */
function createBlockFromContent(
  type: BlockType,
  content: Partial<BlockContent>,
  styles?: any
): Block {
  const definition = blockDefinitions[type];
  const defaultContent = definition.defaultContent;
  
  // Merge with defaults
  const mergedContent = {
    ...defaultContent,
    ...content,
  } as BlockContent;
  
  return {
    id: uuid(),
    type,
    content: mergedContent,
    styles: styles || { ...definition.defaultStyles },
    trackingId: `block-${uuid()}`,
  };
}

/**
 * Parse generated funnel JSON
 */
export function parseGeneratedFunnel(json: string): ParsedFunnel {
  let parsed: any;
  
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = json.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      parsed = JSON.parse(json);
    }
  } catch (error) {
    throw new Error(`Failed to parse funnel JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  const branding: BrandingInfo = {};
  const steps: FunnelStep[] = [];
  
  // Extract branding from funnel or brandKit
  if (parsed.funnel?.brandKit) {
    const brandKit = parsed.funnel.brandKit;
    branding.primaryColor = brandKit.primaryColor;
    branding.accentColor = brandKit.accentColor;
    branding.backgroundColor = brandKit.backgroundColor;
    branding.headingFont = brandKit.headingFont;
    branding.bodyFont = brandKit.fontFamily || brandKit.bodyFont;
    branding.theme = brandKit.theme;
  }
  
  // Parse steps
  const funnelSteps = parsed.funnel?.steps || parsed.steps || [];
  
  for (const stepData of funnelSteps) {
    const stepBlocks: Block[] = [];
    
    // Handle different step structures
    const blocksData = stepData.blocks || stepData.frames?.[0]?.blocks || [];
    
    for (const blockData of blocksData) {
      const blockType = blockData.type;
      
      if (!isValidBlockType(blockType)) {
        console.warn(`[funnel-parser] Unknown block type: ${blockType}, skipping`);
        continue;
      }
      
      // Extract content based on block type
      const content = blockData.content || blockData.elements?.[0]?.content || {};
      const styles = blockData.styles || {};
      
      // Convert content to V3 format
      let v3Content: Partial<BlockContent> = {};
      
      switch (blockType) {
        case 'heading':
          v3Content = {
            text: content.text || content.content || '',
            level: content.level || 1,
          };
          break;
          
        case 'text':
          v3Content = {
            text: content.text || content.content || '',
          };
          break;
          
        case 'button':
          v3Content = {
            text: content.text || content.content || 'Click Here',
            variant: content.variant || 'primary',
            size: content.size || 'md',
            action: content.action || 'next-step',
            actionValue: content.actionValue,
            fullWidth: content.fullWidth || false,
            backgroundColor: content.backgroundColor || branding.primaryColor,
            color: content.color,
          };
          // Ensure buttons have centered textAlign by default
          if (!styles.textAlign) {
            styles = { ...styles, textAlign: 'center' };
          }
          break;
          
        case 'form':
          v3Content = {
            title: content.title,
            fields: (content.fields || []).map((field: any, idx: number) => ({
              id: uuid(),
              type: field.type || 'text',
              label: field.label || `Field ${idx + 1}`,
              placeholder: field.placeholder,
              required: field.required || false,
              options: field.options,
            })),
            submitButton: content.submitButton ? {
              text: content.submitButton.text || 'Submit',
              variant: content.submitButton.variant || 'primary',
              size: content.submitButton.size || 'lg',
              action: content.submitButton.action || 'next-step',
              actionValue: content.submitButton.actionValue,
              fullWidth: content.submitButton.fullWidth || true,
            } : undefined,
          };
          break;
          
        case 'list':
          v3Content = {
            items: (content.items || []).map((item: any, idx: number) => ({
              id: uuid(),
              text: item.text || item.title || item.content || `Item ${idx + 1}`,
            })),
          };
          break;
          
        case 'accordion':
          v3Content = {
            items: (content.items || []).map((item: any) => ({
              id: uuid(),
              title: item.title || item.question || 'Question',
              content: item.content || item.answer || 'Answer',
              defaultOpen: item.defaultOpen || false,
            })),
          };
          break;
          
        case 'social-proof':
          v3Content = {
            items: (content.items || []).map((item: any, idx: number) => ({
              id: uuid(),
              value: item.value || parseFloat(item.content) || idx + 1,
              label: item.label || item.text || 'Stat',
              suffix: item.suffix || '+',
            })),
          };
          break;
          
        case 'email-capture':
          v3Content = {
            placeholder: content.placeholder || 'Enter your email',
            subtitle: content.subtitle,
            submitButton: content.submitButton ? {
              text: content.submitButton.text || 'Subscribe',
              variant: content.submitButton.variant || 'primary',
              size: content.submitButton.size || 'md',
              action: content.submitButton.action || 'next-step',
              fullWidth: content.submitButton.fullWidth || false,
            } : undefined,
          };
          break;
          
        default:
          // For other block types, try to extract common properties
          v3Content = {
            ...content,
          };
          break;
      }
      
      const block = createBlockFromContent(blockType, v3Content, styles);
      stepBlocks.push(block);
    }
    
    // Create step
    const step: FunnelStep = {
      id: uuid(),
      name: stepData.name || 'New Step',
      type: stepData.type || 'capture',
      slug: stepData.slug || stepData.name?.toLowerCase().replace(/\s+/g, '-') || 'new-step',
      blocks: stepBlocks,
      settings: {
        backgroundColor: stepData.settings?.backgroundColor || branding.backgroundColor,
      },
    };
    
    steps.push(step);
  }
  
  // If no steps were created, create a default one
  if (steps.length === 0) {
    steps.push({
      id: uuid(),
      name: 'Step 1',
      type: 'capture',
      slug: 'step-1',
      blocks: [],
      settings: {},
    });
  }
  
  return {
    steps,
    branding,
  };
}
