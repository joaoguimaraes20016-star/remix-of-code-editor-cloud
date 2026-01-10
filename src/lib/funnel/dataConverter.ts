/**
 * Data converter between Supabase EditorDocument format and flow-canvas Page format.
 * 
 * The Supabase format stores:
 * - EditorDocument { version, pages: Page[], activePageId }
 * - Page { id, name, type, canvasRoot: CanvasNode }
 * 
 * The flow-canvas format uses:
 * - Page { id, name, slug, steps: Step[], settings }
 * - Step { id, name, step_type, step_intent, frames: Frame[] }
 * - Frame { id, label, stacks: Stack[] }
 * - Stack { id, label, direction, blocks: Block[] }
 * - Block { id, type, label, elements: Element[] }
 * - Element { id, type, content, props }
 */

import type { Page as FlowCanvasPage, Step, Frame, Stack, Block, Element } from '@/flow-canvas/types/infostack';
import type { EditorDocument } from '@/builder_v2/state/persistence';
import type { Page as BuilderPage, CanvasNode } from '@/builder_v2/types';

// Generate unique ID
const generateId = (): string => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Convert EditorDocument (Supabase storage format) to FlowCanvas Page format.
 * Each builder_v2 Page becomes a Step in flow-canvas.
 */
export function editorDocumentToFlowCanvas(doc: EditorDocument | null, funnelSlug: string = 'funnel'): FlowCanvasPage {
  if (!doc || !doc.pages || doc.pages.length === 0) {
    // Return a default empty page
    return createDefaultFlowCanvasPage(funnelSlug);
  }

  // Convert each builder_v2 Page to a flow-canvas Step
  const steps: Step[] = doc.pages.map((page, index) => {
    return canvasNodeToStep(page, index);
  });

  // If no steps were created, add a default one
  if (steps.length === 0) {
    steps.push(createDefaultStep());
  }

  return {
    id: generateId(),
    name: 'Funnel',
    slug: funnelSlug,
    steps,
    settings: {
      theme: 'light',
      font_family: 'Inter',
      primary_color: '#8B5CF6',
      page_background: {
        type: 'solid',
        color: '#ffffff',
      },
      meta: {
        title: 'Funnel',
        description: '',
      },
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Convert a builder_v2 Page (with canvasRoot) to a flow-canvas Step
 */
function canvasNodeToStep(page: BuilderPage, index: number): Step {
  const stepIntent = mapPageTypeToIntent(page.type);
  const stepType = mapPageTypeToStepType(page.type);
  
  // Convert canvasRoot tree to frames/stacks/blocks structure
  const frames: Frame[] = convertCanvasNodeToFrames(page.canvasRoot);

  return {
    id: page.id || generateId(),
    name: page.name || `Page ${index + 1}`,
    step_type: stepType,
    step_intent: stepIntent,
    submit_mode: stepIntent === 'complete' ? 'redirect' : 'next',
    frames: frames.length > 0 ? frames : [createDefaultFrame()],
    settings: {},
  };
}

/**
 * Recursively convert CanvasNode tree to Frames/Stacks/Blocks structure
 */
function convertCanvasNodeToFrames(node: CanvasNode): Frame[] {
  if (!node) return [];

  const frames: Frame[] = [];
  
  // If root is a frame, use it directly
  if (node.type === 'frame' || node.type === 'section') {
    frames.push(nodeToFrame(node));
  } else if (node.children && node.children.length > 0) {
    // Root contains children that might be frames
    for (const child of node.children) {
      if (child.type === 'frame' || child.type === 'section') {
        frames.push(nodeToFrame(child));
      } else {
        // Treat non-frame children as blocks in a single frame
        const block = nodeToBlock(child);
        if (block) {
          if (frames.length === 0) {
            frames.push(createDefaultFrame());
          }
          frames[frames.length - 1].stacks[0].blocks.push(block);
        }
      }
    }
  }

  return frames;
}

function nodeToFrame(node: CanvasNode): Frame {
  const stacks: Stack[] = [];
  
  // Process children as stacks or blocks
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      if (child.type === 'stack' || child.type === 'container') {
        stacks.push(nodeToStack(child));
      } else {
        // Direct block children go into a default stack
        const block = nodeToBlock(child);
        if (block) {
          if (stacks.length === 0) {
            stacks.push(createDefaultStack());
          }
          stacks[stacks.length - 1].blocks.push(block);
        }
      }
    }
  }

  return {
    id: node.id,
    label: (node.props.label as string) || 'Section',
    stacks: stacks.length > 0 ? stacks : [createDefaultStack()],
    props: { ...node.props },
    styles: node.props.styles as Record<string, string> | undefined,
  };
}

function nodeToStack(node: CanvasNode): Stack {
  const blocks: Block[] = [];
  
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      const block = nodeToBlock(child);
      if (block) {
        blocks.push(block);
      }
    }
  }

  return {
    id: node.id,
    label: (node.props.label as string) || 'Stack',
    direction: (node.props.direction as 'vertical' | 'horizontal') || 'vertical',
    blocks,
    props: { ...node.props },
  };
}

function nodeToBlock(node: CanvasNode): Block | null {
  if (!node) return null;

  // Map node type to block type
  const blockType = mapNodeTypeToBlockType(node.type);
  const elements: Element[] = [];

  // Handle leaf nodes (elements with no children or text/button types)
  if (isElementType(node.type)) {
    elements.push(nodeToElement(node));
  }

  // Process children as elements
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      if (isElementType(child.type)) {
        elements.push(nodeToElement(child));
      } else {
        // Nested blocks become elements
        const nestedElement = nodeToElement(child);
        elements.push(nestedElement);
      }
    }
  }

  return {
    id: node.id,
    type: blockType,
    label: (node.props.label as string) || blockType,
    elements,
    props: { ...node.props },
  };
}

function nodeToElement(node: CanvasNode): Element {
  const elementType = mapNodeTypeToElementType(node.type);
  
  return {
    id: node.id,
    type: elementType,
    content: (node.props.content as string) || (node.props.text as string) || '',
    props: { ...node.props },
  };
}

// Type mappers
function mapPageTypeToIntent(pageType: string): 'capture' | 'qualify' | 'schedule' | 'convert' | 'complete' {
  const mapping: Record<string, 'capture' | 'qualify' | 'schedule' | 'convert' | 'complete'> = {
    landing: 'capture',
    optin: 'capture',
    appointment: 'schedule',
    thank_you: 'complete',
  };
  return mapping[pageType] || 'capture';
}

function mapPageTypeToStepType(pageType: string): 'form' | 'content' | 'quiz' | 'booking' | 'checkout' | 'thankyou' {
  const mapping: Record<string, 'form' | 'content' | 'quiz' | 'booking' | 'checkout' | 'thankyou'> = {
    landing: 'form',
    optin: 'form',
    appointment: 'booking',
    thank_you: 'thankyou',
  };
  return mapping[pageType] || 'form';
}

function mapNodeTypeToBlockType(type: string): Block['type'] {
  const mapping: Record<string, Block['type']> = {
    hero: 'hero',
    section: 'text-block',
    container: 'custom',
    form: 'form-field',
    cta: 'cta',
    testimonial: 'testimonial',
    feature: 'feature',
    pricing: 'pricing',
    faq: 'faq',
    media: 'media',
  };
  return mapping[type] || 'custom';
}

function mapNodeTypeToElementType(type: string): Element['type'] {
  const mapping: Record<string, Element['type']> = {
    heading: 'heading',
    text: 'text',
    button: 'button',
    input: 'input',
    image: 'image',
    video: 'video',
    divider: 'divider',
    spacer: 'spacer',
    icon: 'icon',
    checkbox: 'checkbox',
    select: 'select',
    radio: 'radio',
  };
  return mapping[type] || 'text';
}

function isElementType(type: string): boolean {
  const elementTypes = new Set([
    'heading', 'text', 'button', 'input', 'image', 'video', 
    'divider', 'spacer', 'icon', 'checkbox', 'select', 'radio',
  ]);
  return elementTypes.has(type);
}

// Default creators
function createDefaultFlowCanvasPage(slug: string): FlowCanvasPage {
  return {
    id: generateId(),
    name: 'New Funnel',
    slug,
    steps: [createDefaultStep()],
    settings: {
      theme: 'light',
      font_family: 'Inter',
      primary_color: '#8B5CF6',
      page_background: { type: 'solid', color: '#ffffff' },
      meta: { title: 'New Funnel' },
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function createDefaultStep(): Step {
  return {
    id: generateId(),
    name: 'Welcome',
    step_type: 'form',
    step_intent: 'capture',
    submit_mode: 'next',
    frames: [createDefaultFrame()],
    settings: {},
  };
}

function createDefaultFrame(): Frame {
  return {
    id: generateId(),
    label: 'Main Section',
    stacks: [createDefaultStack()],
    props: {},
  };
}

function createDefaultStack(): Stack {
  return {
    id: generateId(),
    label: 'Content',
    direction: 'vertical',
    blocks: [{
      id: generateId(),
      type: 'hero',
      label: 'Hero',
      elements: [
        {
          id: generateId(),
          type: 'heading',
          content: 'Welcome to Your Funnel',
          props: { level: 1 },
        },
        {
          id: generateId(),
          type: 'text',
          content: 'Start building your funnel by adding blocks',
          props: {},
        },
      ],
      props: {},
    }],
    props: {},
  };
}

/**
 * Convert FlowCanvas Page back to EditorDocument for Supabase storage.
 * Each flow-canvas Step becomes a builder_v2 Page.
 */
export function flowCanvasToEditorDocument(page: FlowCanvasPage): EditorDocument {
  const pages: BuilderPage[] = page.steps.map((step, index) => {
    return stepToBuilderPage(step, index);
  });

  return {
    version: 1,
    pages,
    activePageId: pages[0]?.id || '',
  };
}

function stepToBuilderPage(step: Step, index: number): BuilderPage {
  const pageType = mapStepIntentToPageType(step.step_intent);
  
  // Convert frames/stacks/blocks back to CanvasNode tree
  const canvasRoot = framesToCanvasNode(step.frames, step.id);

  return {
    id: step.id,
    name: step.name,
    type: pageType,
    canvasRoot,
  };
}

function mapStepIntentToPageType(intent: string): 'landing' | 'optin' | 'appointment' | 'thank_you' {
  const mapping: Record<string, 'landing' | 'optin' | 'appointment' | 'thank_you'> = {
    capture: 'landing',
    qualify: 'landing',
    schedule: 'appointment',
    convert: 'optin',
    complete: 'thank_you',
  };
  return mapping[intent] || 'landing';
}

function framesToCanvasNode(frames: Frame[], rootId: string): CanvasNode {
  const children: CanvasNode[] = frames.map(frame => frameToNode(frame));

  return {
    id: rootId,
    type: 'frame',
    props: {},
    children,
  };
}

function frameToNode(frame: Frame): CanvasNode {
  const children: CanvasNode[] = frame.stacks.map(stack => stackToNode(stack));

  return {
    id: frame.id,
    type: 'section',
    props: { label: frame.label, ...frame.props },
    children,
  };
}

function stackToNode(stack: Stack): CanvasNode {
  const children: CanvasNode[] = stack.blocks.map(block => blockToNode(block));

  return {
    id: stack.id,
    type: 'container',
    props: { label: stack.label, direction: stack.direction, ...stack.props },
    children,
  };
}

function blockToNode(block: Block): CanvasNode {
  const children: CanvasNode[] = block.elements.map(element => elementToNode(element));

  return {
    id: block.id,
    type: block.type,
    props: { label: block.label, ...block.props },
    children,
  };
}

function elementToNode(element: Element): CanvasNode {
  return {
    id: element.id,
    type: element.type,
    props: { content: element.content, ...element.props },
    children: [],
  };
}
