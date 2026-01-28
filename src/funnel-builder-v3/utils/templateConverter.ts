/**
 * Convert builder_v2 section templates to v3 Block format
 * 
 * This utility transforms CanvasNode structures from legacy templates
 * into the flattened v3 Block[] format used by funnel-builder-v3.
 */

import { Block, BlockType, BlockProps, createId } from '../types/funnel';
import type { CanvasNode } from '@/builder_v2/types';
import { allSectionTemplates } from '@/builder_v2/templates/sectionTemplates';

// Map CanvasNode types to v3 BlockType
const NODE_TO_BLOCK_TYPE: Record<string, BlockType | null> = {
  // Text content
  'heading': 'heading',
  'paragraph': 'text',
  'text': 'text',
  
  // Buttons
  'cta_button': 'button',
  'button': 'button',
  
  // Media
  'image': 'image',
  'video': 'video',
  
  // Layout
  'spacer': 'spacer',
  'divider': 'divider',
  
  // Inputs
  'email_input': 'input',
  'phone_input': 'input',
  'text_input': 'input',
  'name_input': 'input',
  
  // Skip complex/container types - we flatten their children
  'section': null,
  'container': null,
  'row': null,
  'column': null,
  'logo_bar': null,
  'rating_display': null,
  'avatar_stack': null,
  'star_rating': null,
  'trust_badges': null,
  'icon_list': null,
  'faq_accordion': null,
  'testimonial_card': null,
  'team_card': null,
};

/**
 * Map node props to v3 BlockProps based on block type
 */
function mapNodeProps(node: CanvasNode, blockType: BlockType): BlockProps {
  const props: BlockProps = {};
  const nodeProps = node.props || {};
  
  switch (blockType) {
    case 'heading':
      // Map heading level to size
      const level = nodeProps.level as string;
      if (level === 'h1') props.size = '3xl';
      else if (level === 'h2') props.size = '2xl';
      else if (level === 'h3') props.size = 'xl';
      else props.size = 'lg';
      props.align = (nodeProps.align as 'left' | 'center' | 'right') || 'center';
      props.fontWeight = 'bold';
      break;
      
    case 'text':
      props.size = 'md';
      props.align = (nodeProps.align as 'left' | 'center' | 'right') || 'center';
      break;
      
    case 'button':
      props.variant = (nodeProps.variant as 'primary' | 'secondary' | 'outline' | 'ghost') || 'primary';
      props.buttonSize = (nodeProps.size as 'sm' | 'md' | 'lg') || 'lg';
      props.fullWidth = nodeProps.fullWidth as boolean || false;
      // Map action
      const action = nodeProps.action as string;
      if (action === 'next' || action === 'next-screen') {
        props.action = { type: 'next-screen' };
      } else if (action === 'previous' || action === 'previous-screen') {
        props.action = { type: 'previous-screen' };
      } else if (action === 'submit') {
        props.action = { type: 'submit' };
      } else {
        props.action = { type: 'next-screen' };
      }
      break;
      
    case 'image':
      props.src = nodeProps.src as string || '';
      props.alt = nodeProps.alt as string || 'Image';
      props.aspectRatio = (nodeProps.aspectRatio as '16:9' | '4:3' | '1:1' | '9:16') || '16:9';
      props.objectFit = 'cover';
      break;
      
    case 'video':
      props.src = nodeProps.src as string || nodeProps.url as string || '';
      props.aspectRatio = '16:9';
      break;
      
    case 'spacer':
      props.height = (nodeProps.height as number) || 32;
      break;
      
    case 'input':
      // Map input type based on node type
      if (node.type === 'email_input') {
        props.inputType = 'email';
        props.placeholder = 'Enter your email';
        props.fieldKey = 'email';
      } else if (node.type === 'phone_input') {
        props.inputType = 'phone';
        props.placeholder = 'Enter your phone';
        props.fieldKey = 'phone';
      } else if (node.type === 'name_input') {
        props.inputType = 'name';
        props.placeholder = 'Enter your name';
        props.fieldKey = 'name';
      } else {
        props.inputType = 'text';
        props.placeholder = nodeProps.placeholder as string || 'Enter text...';
        props.fieldKey = nodeProps.fieldKey as string || 'custom';
      }
      props.required = nodeProps.required as boolean || false;
      props.label = nodeProps.label as string;
      break;
  }
  
  return props;
}

/**
 * Extract content text from a node
 */
function extractContent(node: CanvasNode, blockType: BlockType): string {
  const props = node.props || {};
  
  switch (blockType) {
    case 'heading':
    case 'text':
      return (props.text as string) || '';
    case 'button':
      return (props.label as string) || (props.text as string) || 'Click here';
    default:
      return '';
  }
}

/**
 * Convert a single CanvasNode to a v3 Block
 */
function nodeToBlock(node: CanvasNode): Block | null {
  const blockType = NODE_TO_BLOCK_TYPE[node.type];
  if (!blockType) return null;
  
  return {
    id: createId(),
    type: blockType,
    content: extractContent(node, blockType),
    props: mapNodeProps(node, blockType),
  };
}

/**
 * Recursively flatten a CanvasNode tree into an array of v3 Blocks
 * Container nodes (section, row, column) are skipped but their children are processed
 */
function flattenNodes(node: CanvasNode): Block[] {
  const blocks: Block[] = [];
  
  // Try to convert this node to a block
  const block = nodeToBlock(node);
  if (block) {
    blocks.push(block);
  }
  
  // Recursively process children
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      blocks.push(...flattenNodes(child));
    }
  }
  
  return blocks;
}

/**
 * Convert a section template ID to an array of v3 Blocks
 * 
 * @param templateId - The template ID (e.g., 'hero-simple', 'cta-gray-card')
 * @returns Array of v3 Block objects, or empty array if template not found
 */
export function convertSectionTemplateToBlocks(templateId: string): Block[] {
  const template = allSectionTemplates.find(t => t.id === templateId);
  if (!template) {
    console.warn(`[templateConverter] Template not found: ${templateId}`);
    return [];
  }
  
  try {
    const rootNode = template.createNode();
    const blocks = flattenNodes(rootNode);
    console.log(`[templateConverter] Converted "${templateId}" to ${blocks.length} blocks`);
    return blocks;
  } catch (error) {
    console.error(`[templateConverter] Error converting template "${templateId}":`, error);
    return [];
  }
}

/**
 * Check if a template ID exists in allSectionTemplates
 */
export function isSectionTemplate(templateId: string): boolean {
  return allSectionTemplates.some(t => t.id === templateId);
}
