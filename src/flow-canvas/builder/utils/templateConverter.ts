/**
 * Template Converter - Converts builder_v2 section templates to flow-canvas Frame format
 * Also handles premium block creation as a fallback for block IDs
 */

import type { Frame, Stack, Block, Element, BlockType, ElementType } from '../../types/infostack';
import type { CanvasNode } from '@/builder_v2/types';
import { allSectionTemplates, type SectionTemplate } from '@/builder_v2/templates/sectionTemplates';
import { createPremiumBlock, isPremiumBlockId } from './premiumBlockFactory';

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
    'spacer': 'custom',    // spacer is an Element, not BlockType
    'divider': 'custom',   // divider is an Element, not BlockType
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
    // Template-specific element types (Perspective-style)
    'logo_bar': 'logo-marquee',
    'rating_display': 'avatar-group', // Uses avatar-group with rating display
    'feature_list': 'feature-list',   // Now uses dedicated feature-list type
    'faq_accordion': 'faq',
    'testimonial_card': 'testimonial', // Now uses dedicated testimonial type
    'form_group': 'form-group',        // Now uses dedicated form-group type
    'form_input': 'input',
  };
  return mapping[nodeType] || 'text';
}

// Check if a node type is an element (leaf) type
function isElementType(nodeType: string): boolean {
  const elementTypes = [
    'heading', 'paragraph', 'text', 'cta_button', 'button', 
    'image', 'video', 'video_embed', 'spacer', 'divider',
    'email_input', 'phone_input', 'text_input', 'option_grid',
    'calendar_embed', 'info_card',
    // Template-specific types
    'logo_bar', 'rating_display', 'feature_list',
    'faq_accordion', 'testimonial_card', 'form_group', 'form_input'
  ];
  return elementTypes.includes(nodeType);
}

// Convert a CanvasNode to an Element
function nodeToElement(node: CanvasNode): Element {
  const elementType = mapNodeTypeToElementType(node.type);
  const baseProps = { ...node.props };
  
  // Special handling for template-specific types to add Perspective-style defaults
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
        gap: 40,
        animated: false,
      },
    };
  }
  
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
  
  // Handle form_group with multi-field structure
  if (node.type === 'form_group') {
    const fields = (node.props?.fields as Array<{
      type: string;
      placeholder: string;
      required?: boolean;
    }>) || [
      { type: 'text', placeholder: 'Your name', required: true },
      { type: 'email', placeholder: 'Your email', required: true },
    ];
    
    return {
      id: generateId(),
      type: 'form-group',
      content: '',
      props: {
        fields: fields.map((field, i) => ({
          id: `field-${generateId()}-${i}`,
          type: field.type,
          placeholder: field.placeholder,
          required: field.required ?? false,
          fieldKey: `form_${field.type}_${i}`,
        })),
        layout: 'vertical',
        gap: 12,
      },
    };
  }
  
  // Handle feature_list with icon + text structure
  if (node.type === 'feature_list') {
    const features = (node.props?.items as string[]) || 
                     (node.props?.features as string[]) || 
                     ['Feature 1', 'Feature 2', 'Feature 3'];
    
    return {
      id: generateId(),
      type: 'feature-list',
      content: '',
      props: {
        items: features.map((text, i) => ({
          id: `feature-${generateId()}-${i}`,
          text: typeof text === 'string' ? text : (text as { text?: string })?.text || 'Feature',
          icon: 'Check',
        })),
        iconColor: '#22C55E',
        layout: 'vertical',
        gap: 8,
      },
    };
  }
  
  // Handle testimonial_card with author info
  if (node.type === 'testimonial_card') {
    return {
      id: generateId(),
      type: 'testimonial',
      content: (node.props?.quote as string) || (node.props?.content as string) || 'Great product!',
      props: {
        author: (node.props?.author as string) || 'John Doe',
        role: (node.props?.role as string) || (node.props?.title as string) || 'CEO',
        company: (node.props?.company as string) || 'Company',
        avatar: (node.props?.avatar as string) || '',
        rating: (node.props?.rating as number) || 5,
      },
    };
  }
  
  return {
    id: generateId(),
    type: elementType,
    content: (node.props?.content as string) || (node.props?.text as string) || '',
    props: baseProps,
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
 * Also handles premium block IDs by creating a frame with the premium block
 * @param templateId - The ID of the section template or premium block to convert
 * @returns A Frame object ready to be added to a step
 */
export function convertTemplateToFrame(templateId: string): Frame | null {
  // First, try section templates
  const template = allSectionTemplates.find(t => t.id === templateId);
  if (template) {
    // Create the node from the template
    const canvasNode = template.createNode();
    // Convert to frame
    return canvasNodeToFrame(canvasNode);
  }

  // Fallback: Try premium block factory
  if (isPremiumBlockId(templateId)) {
    const premiumBlock = createPremiumBlock(templateId);
    if (premiumBlock) {
      return {
        id: generateId(),
        label: premiumBlock.label || 'Section',
        stacks: [{
          id: generateId(),
          label: 'Main Stack',
          direction: 'vertical',
          blocks: [premiumBlock],
          props: { 
            alignment: 'center',
            gap: 16
          }
        }],
        props: {
          padding: { top: 24, bottom: 24, left: 16, right: 16 }
        }
      };
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
