/**
 * Template Converter - Converts builder_v2 section templates to flow-canvas Frame format
 */

import type { Frame, Stack, Block, Element, BlockType, ElementType } from '../../types/infostack';
import type { CanvasNode } from '@/builder_v2/types';
import { allSectionTemplates, type SectionTemplate } from '@/builder_v2/templates/sectionTemplates';

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Map CanvasNode type to BlockType
function mapNodeTypeToBlockType(nodeType: string): BlockType {
  const mapping: Record<string, BlockType> = {
    'section': 'text-block',
    'heading': 'text-block',
    'paragraph': 'text-block',
    'text': 'text-block',
    'cta_button': 'cta',
    'button': 'cta',
    'image': 'media',
    'video': 'media',
    'video_embed': 'media',
    'spacer': 'spacer',
    'divider': 'divider',
    'email_input': 'form-field',
    'phone_input': 'form-field',
    'text_input': 'form-field',
    'option_grid': 'custom',
    'calendar_embed': 'booking',
    'info_card': 'feature',
  };
  return mapping[nodeType] || 'custom';
}

// Map CanvasNode type to ElementType
function mapNodeTypeToElementType(nodeType: string): ElementType {
  const mapping: Record<string, ElementType> = {
    'heading': 'heading',
    'paragraph': 'text',
    'text': 'text',
    'cta_button': 'button',
    'button': 'button',
    'image': 'image',
    'video': 'video',
    'video_embed': 'video',
    'spacer': 'spacer',
    'divider': 'divider',
    'email_input': 'input',
    'phone_input': 'input',
    'text_input': 'input',
    'option_grid': 'multiple-choice',
    'calendar_embed': 'video', // Placeholder
    'info_card': 'text',
  };
  return mapping[nodeType] || 'text';
}

// Check if a node type is an element (leaf) type
function isElementType(nodeType: string): boolean {
  const elementTypes = [
    'heading', 'paragraph', 'text', 'cta_button', 'button', 
    'image', 'video', 'video_embed', 'spacer', 'divider',
    'email_input', 'phone_input', 'text_input', 'option_grid',
    'calendar_embed', 'info_card'
  ];
  return elementTypes.includes(nodeType);
}

// Convert a CanvasNode to an Element
function nodeToElement(node: CanvasNode): Element {
  const elementType = mapNodeTypeToElementType(node.type);
  
  return {
    id: generateId(),
    type: elementType,
    content: (node.props?.content as string) || (node.props?.text as string) || '',
    props: { ...node.props },
  };
}

// Convert a CanvasNode to a Block
function nodeToBlock(node: CanvasNode): Block {
  const blockType = mapNodeTypeToBlockType(node.type);
  const elements: Element[] = [];

  // If this is an element-type node, add it as an element
  if (isElementType(node.type)) {
    elements.push(nodeToElement(node));
  }

  // Process children as elements
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      elements.push(nodeToElement(child));
    }
  }

  return {
    id: generateId(),
    type: blockType,
    label: (node.props?.label as string) || blockType,
    elements,
    props: { ...node.props },
  };
}

// Convert a CanvasNode to a Stack
function nodeToStack(node: CanvasNode): Stack {
  const blocks: Block[] = [];
  
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      blocks.push(nodeToBlock(child));
    }
  }

  return {
    id: generateId(),
    label: (node.props?.label as string) || 'Stack',
    direction: (node.props?.direction as 'vertical' | 'horizontal') || 'vertical',
    blocks,
    props: { ...node.props },
  };
}

// Create a default stack
function createDefaultStack(): Stack {
  return {
    id: generateId(),
    label: 'Main Stack',
    direction: 'vertical',
    blocks: [],
    props: {},
  };
}

/**
 * Convert a section template's CanvasNode to a flow-canvas Frame
 */
function canvasNodeToFrame(node: CanvasNode): Frame {
  const stacks: Stack[] = [];
  
  // Process children as stacks or blocks
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      if (child.type === 'stack' || child.type === 'container') {
        stacks.push(nodeToStack(child));
      } else {
        // Direct block children go into a default stack
        const block = nodeToBlock(child);
        if (stacks.length === 0) {
          stacks.push(createDefaultStack());
        }
        stacks[stacks.length - 1].blocks.push(block);
      }
    }
  }

  return {
    id: generateId(),
    label: (node.props?.label as string) || (node.props?.variant as string) || 'Section',
    stacks: stacks.length > 0 ? stacks : [createDefaultStack()],
    props: { ...node.props },
    styles: node.props?.styles as Record<string, string> | undefined,
  };
}

/**
 * Convert a section template to a flow-canvas Frame
 * @param templateId - The ID of the section template to convert
 * @returns A Frame object ready to be added to a step
 */
export function convertTemplateToFrame(templateId: string): Frame | null {
  const template = allSectionTemplates.find(t => t.id === templateId);
  if (!template) {
    console.warn(`Template not found: ${templateId}`);
    return null;
  }

  // Create the node from the template
  const canvasNode = template.createNode();
  
  // Convert to frame
  return canvasNodeToFrame(canvasNode);
}

/**
 * Get a template by ID
 */
export function getTemplateById(templateId: string): SectionTemplate | undefined {
  return allSectionTemplates.find(t => t.id === templateId);
}
