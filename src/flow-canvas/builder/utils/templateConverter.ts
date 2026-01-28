/**
 * Template Converter - Converts builder_v2 section templates to flow-canvas Frame format
 * Handles basic blocks, interactive blocks, and premium blocks through dedicated factories
 * 
 * Key improvements over legacy:
 * - Filters out spacer/divider elements (uses CSS gap instead)
 * - Routes to appropriate factory based on block type
 * - Creates clean, Perspective-style frames with proper defaults
 */

import type { Frame, Stack, Block, Element, BlockType, ElementType } from '../../types/infostack';
import type { CanvasNode } from '@/builder_v2/types';
import { allSectionTemplates, type SectionTemplate } from '@/builder_v2/templates/sectionTemplates';
import { createPremiumBlock, isPremiumBlockId } from './premiumBlockFactory';
import { createBasicBlock, isBasicBlockId } from './basicBlockFactory';
import { createInteractiveBlock, isInteractiveBlockId } from './interactiveBlockFactory';

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Types that should be filtered out during conversion (replaced by CSS gap)
const FILTERED_TYPES = ['spacer', 'divider'];

// Check if a node type should be filtered
function shouldFilterNode(nodeType: string): boolean {
  return FILTERED_TYPES.includes(nodeType);
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
    'email_input': 'form-field',
    'phone_input': 'form-field',
    'text_input': 'form-field',
    'option_grid': 'custom',
    'calendar_embed': 'booking',
    'info_card': 'feature',
    'logo_bar': 'custom',
    'rating_display': 'custom',
    'feature_list': 'text-block',
    'faq_accordion': 'custom',
    'testimonial_card': 'text-block',
    'form_group': 'form-field',
    'form_input': 'form-field',
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
    'email_input': 'input',
    'phone_input': 'input',
    'text_input': 'input',
    'option_grid': 'multiple-choice',
    'calendar_embed': 'video',
    'info_card': 'text',
    'logo_bar': 'logo-marquee',
    'rating_display': 'avatar-group',
    'feature_list': 'text',
    'faq_accordion': 'faq',
    'testimonial_card': 'text',
    'form_group': 'input',
    'form_input': 'input',
  };
  return mapping[nodeType] || 'text';
}

// Check if a node type is an element (leaf) type
function isElementType(nodeType: string): boolean {
  const elementTypes = [
    'heading', 'paragraph', 'text', 'cta_button', 'button', 
    'image', 'video', 'video_embed',
    'email_input', 'phone_input', 'text_input', 'option_grid',
    'calendar_embed', 'info_card',
    'logo_bar', 'rating_display', 'feature_list',
    'faq_accordion', 'testimonial_card', 'form_group', 'form_input'
  ];
  return elementTypes.includes(nodeType);
}

// Convert a CanvasNode to an Element with Perspective-style defaults
function nodeToElement(node: CanvasNode): Element {
  const elementType = mapNodeTypeToElementType(node.type);
  const baseProps = { ...node.props };
  
  // Special handling for logo bar with Perspective-style defaults
  if (node.type === 'logo_bar') {
    const logos = (node.props?.logos as string[]) || ['Coca-Cola', 'Zalando', 'Braun', 'IKEA', 'Sony'];
    return {
      id: generateId(),
      type: 'logo-marquee',
      content: '',
      props: {
        logos: logos.map((name, i) => ({ id: `logo-${i}`, src: '', alt: name, name })),
        speed: 25,
        pauseOnHover: true,
        grayscale: true,
        showTextFallback: true,
        hoverEffect: 'color',
        logoHeight: 32,
        gap: 48,
        animated: false,
      },
    };
  }
  
  // Special handling for rating display
  if (node.type === 'rating_display') {
    return {
      id: generateId(),
      type: 'avatar-group',
      content: '',
      props: {
        count: 4,
        size: 'sm',
        colorMode: 'varied',
        overlap: 10,
        showRating: true,
        rating: (node.props?.rating as number) || 4.8,
        ratingCount: (node.props?.count as number) || 148,
        ratingSource: (node.props?.source as string) || 'reviews',
        alignment: 'center',
      },
    };
  }
  
  // Add Perspective-style defaults based on element type
  const perspectiveDefaults = getPerspectiveDefaults(elementType, baseProps);
  
  return {
    id: generateId(),
    type: elementType,
    content: (node.props?.content as string) || (node.props?.text as string) || '',
    props: { ...baseProps, ...perspectiveDefaults },
  };
}

// Get Perspective-style defaults for element types
function getPerspectiveDefaults(elementType: ElementType, existingProps: Record<string, unknown>): Record<string, unknown> {
  switch (elementType) {
    case 'heading':
      return {
        fontSize: existingProps.fontSize || '2xl',
        fontWeight: existingProps.fontWeight || 'bold',
        textAlign: existingProps.textAlign || 'center',
        textColor: existingProps.textColor || '#111827',
        letterSpacing: existingProps.letterSpacing || '-0.02em',
        lineHeight: existingProps.lineHeight || '1.2',
      };
    case 'text':
      return {
        fontSize: existingProps.fontSize || 'base',
        textAlign: existingProps.textAlign || 'center',
        textColor: existingProps.textColor || 'rgba(17, 24, 39, 0.8)',
        lineHeight: existingProps.lineHeight || '1.6',
      };
    case 'button':
      return {
        borderRadius: existingProps.borderRadius || '12px',
        fontWeight: existingProps.fontWeight || '600',
        paddingHorizontal: existingProps.paddingHorizontal || 32,
        paddingVertical: existingProps.paddingVertical || 16,
      };
    case 'image':
      return {
        borderRadius: existingProps.borderRadius || '12px',
        objectFit: existingProps.objectFit || 'cover',
      };
    case 'video':
      return {
        borderRadius: existingProps.borderRadius || '12px',
      };
    case 'input':
      return {
        borderRadius: existingProps.borderRadius || '12px',
        padding: existingProps.padding || '16px 20px',
        fontSize: existingProps.fontSize || '16px',
        border: existingProps.border || '1px solid #E5E7EB',
      };
    default:
      return {};
  }
}

// Convert a CanvasNode to a Block
function nodeToBlock(node: CanvasNode): Block {
  const blockType = mapNodeTypeToBlockType(node.type);
  const elements: Element[] = [];

  // If this is an element-type node, add it as an element
  if (isElementType(node.type)) {
    elements.push(nodeToElement(node));
  }

  // Process children as elements (filter out spacers/dividers)
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      if (!shouldFilterNode(child.type)) {
        elements.push(nodeToElement(child));
      }
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
      // Filter out spacers/dividers at the stack level
      if (!shouldFilterNode(child.type)) {
        blocks.push(nodeToBlock(child));
      }
    }
  }

  return {
    id: generateId(),
    label: (node.props?.label as string) || 'Stack',
    direction: (node.props?.direction as 'vertical' | 'horizontal') || 'vertical',
    blocks,
    props: { 
      ...node.props,
      gap: 20, // Perspective-style gap replaces spacers
    },
  };
}

// Create a default stack with Perspective-style defaults
function createDefaultStack(): Stack {
  return {
    id: generateId(),
    label: 'Content',
    direction: 'vertical',
    blocks: [],
    props: {
      gap: 20,
      alignment: 'center',
    },
  };
}

/**
 * Clean section template conversion - filters spacers, uses gap
 */
function convertSectionTemplateClean(template: SectionTemplate): Frame {
  const node = template.createNode();
  const stacks: Stack[] = [];
  
  // Process children, filtering out spacers/dividers
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      // Skip spacers and dividers entirely
      if (shouldFilterNode(child.type)) {
        continue;
      }
      
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

  // Determine background based on template variant
  const variant = node.props?.variant as string;
  const isDark = variant === 'dark' || variant === 'gradient';
  
  return {
    id: generateId(),
    label: template.name,
    stacks: stacks.length > 0 ? stacks : [createDefaultStack()],
    props: {
      ...node.props,
      // Perspective-style clean defaults
      paddingVertical: 32,
      paddingHorizontal: 20,
      blockGap: 20,
    },
    styles: node.props?.styles as Record<string, string> | undefined,
    background: isDark ? 'dark' : undefined,
  };
}

/**
 * Wrap a single block in a clean, minimal frame
 */
function wrapBlockInCleanFrame(block: Block): Frame {
  return {
    id: generateId(),
    label: block.label || 'Section',
    stacks: [{
      id: generateId(),
      label: 'Content',
      direction: 'vertical',
      blocks: [block],
      props: {
        alignment: 'center',
        gap: 16,
      }
    }],
    props: {
      paddingVertical: 24,
      paddingHorizontal: 16,
      blockGap: 16,
    }
  };
}

/**
 * Convert a section template or block ID to a flow-canvas Frame
 * Routes to appropriate factory based on the templateId type:
 * 1. Section templates (hero-simple, cta-simple, etc.)
 * 2. Basic blocks (text, button, image, etc.)
 * 3. Interactive blocks (multiple-choice, form-block, etc.)
 * 4. Premium blocks (gradient-text, stat-number, etc.)
 * 
 * @param templateId - The ID of the template or block to convert
 * @returns A Frame object ready to be added to a step
 */
export function convertTemplateToFrame(templateId: string): Frame | null {
  // 1. Try section templates first
  const template = allSectionTemplates.find(t => t.id === templateId);
  if (template) {
    return convertSectionTemplateClean(template);
  }

  // 2. Try basic block factory
  if (isBasicBlockId(templateId)) {
    const basicBlock = createBasicBlock(templateId);
    if (basicBlock) {
      return wrapBlockInCleanFrame(basicBlock);
    }
  }

  // 3. Try interactive block factory
  if (isInteractiveBlockId(templateId)) {
    const interactiveBlock = createInteractiveBlock(templateId);
    if (interactiveBlock) {
      return wrapBlockInCleanFrame(interactiveBlock);
    }
  }

  // 4. Try premium block factory
  if (isPremiumBlockId(templateId)) {
    const premiumBlock = createPremiumBlock(templateId);
    if (premiumBlock) {
      return wrapBlockInCleanFrame(premiumBlock);
    }
  }

  console.warn(`Template not found: ${templateId}`);
  return null;
}

/**
 * Get a template by ID
 */
export function getTemplateById(templateId: string): SectionTemplate | undefined {
  return allSectionTemplates.find(t => t.id === templateId);
}

/**
 * Check if a template ID exists (section, basic, interactive, or premium)
 */
export function isValidTemplateId(templateId: string): boolean {
  // Check section templates
  if (allSectionTemplates.some(t => t.id === templateId)) {
    return true;
  }
  
  // Check block factories
  return isBasicBlockId(templateId) || 
         isInteractiveBlockId(templateId) || 
         isPremiumBlockId(templateId);
}
