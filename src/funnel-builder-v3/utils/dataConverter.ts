/**
 * Data Converter for Funnel Builder v3
 * 
 * Converts between Supabase storage format and the new v3 Funnel format.
 */

import { 
  Funnel, 
  Screen, 
  Block, 
  ScreenType, 
  BlockType,
  FunnelSettings,
  ScreenBackground,
  createId,
} from '../types/funnel';
import type { EditorDocument } from '@/builder_v2/state/persistence';
import type { Page as FlowCanvasPage } from '@/flow-canvas/types/infostack';

// =============================================================================
// FROM SUPABASE TO V3 FUNNEL
// =============================================================================

export interface FunnelDbRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  settings?: Record<string, unknown>;
  builder_document?: EditorDocument | null;
  published_document_snapshot?: FlowCanvasPage | null;
}

/**
 * Convert database row to v3 Funnel format
 */
export function dbRowToFunnel(row: FunnelDbRow): Funnel {
  // Try to extract from published_document_snapshot first (FlowCanvas format)
  const snapshot = row.published_document_snapshot;
  
  if (snapshot && snapshot.steps && snapshot.steps.length > 0) {
    return flowCanvasToV3Funnel(snapshot, row);
  }

  // Try to convert from builder_document (EditorDocument format)
  if (row.builder_document && row.builder_document.pages) {
    return editorDocumentToV3Funnel(row.builder_document, row);
  }

  // Return default funnel structure
  return createDefaultFunnel(row);
}

/**
 * Convert FlowCanvas page to v3 Funnel
 */
function flowCanvasToV3Funnel(page: FlowCanvasPage, row: FunnelDbRow): Funnel {
  const screens: Screen[] = page.steps.map((step) => {
    const screenType = mapStepTypeToScreenType(step.step_type);
    const blocks = extractBlocksFromStep(step);

    return {
      id: step.id,
      name: step.name,
      type: screenType,
      blocks,
      // Extract background from step settings if available
      background: (step.settings as Record<string, unknown> | undefined)?.background as ScreenBackground | undefined,
    };
  });

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    screens: screens.length > 0 ? screens : [createDefaultScreen()],
    settings: extractSettings(page.settings, row.settings),
  };
}

/**
 * Convert EditorDocument to v3 Funnel
 */
function editorDocumentToV3Funnel(doc: EditorDocument, row: FunnelDbRow): Funnel {
  const screens: Screen[] = doc.pages.map((page) => {
    const screenType = mapPageTypeToScreenType(page.type);
    const blocks = extractBlocksFromCanvasNode(page.canvasRoot);

    return {
      id: page.id,
      name: page.name,
      type: screenType,
      blocks,
    };
  });

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    screens: screens.length > 0 ? screens : [createDefaultScreen()],
    settings: extractSettings(null, row.settings),
  };
}

// =============================================================================
// FROM V3 FUNNEL TO SUPABASE
// =============================================================================

/**
 * Convert v3 Funnel to EditorDocument for Supabase storage
 */
export function v3FunnelToEditorDocument(funnel: Funnel): EditorDocument {
  return {
    version: 1,
    pages: funnel.screens.map((screen) => ({
      id: screen.id,
      name: screen.name,
      type: mapScreenTypeToPageType(screen.type),
      canvasRoot: blocksToCanvasNode(screen.blocks, screen.id),
    })),
    activePageId: funnel.screens[0]?.id || '',
  };
}

/**
 * Convert v3 Funnel to FlowCanvas page for publishing
 */
export function v3FunnelToFlowCanvas(funnel: Funnel): FlowCanvasPage {
  return {
    id: funnel.id,
    name: funnel.name,
    slug: funnel.slug,
    steps: funnel.screens.map((screen) => ({
      id: screen.id,
      name: screen.name,
      step_type: mapScreenTypeToStepType(screen.type),
      step_intent: mapScreenTypeToIntent(screen.type),
      submit_mode: screen.type === 'thankyou' ? 'redirect' as const : 'next' as const,
      frames: blocksToFrames(screen.blocks),
      settings: {},
    })),
    settings: {
      theme: 'light' as const,
      font_family: funnel.settings.fontFamily || 'Inter',
      primary_color: funnel.settings.primaryColor || '#8B5CF6',
      page_background: { type: 'solid' as const, color: '#ffffff' },
      meta: funnel.settings.meta || { title: funnel.name },
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function createDefaultFunnel(row: FunnelDbRow): Funnel {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    screens: [createDefaultScreen()],
    settings: extractSettings(null, row.settings),
  };
}

function createDefaultScreen(): Screen {
  return {
    id: createId(),
    name: 'Welcome',
    type: 'content',
    blocks: [
      {
        id: createId(),
        type: 'heading',
        content: 'Welcome to Your Funnel',
        props: { size: '2xl', align: 'center' },
      },
      {
        id: createId(),
        type: 'text',
        content: 'Start building your funnel by adding blocks',
        props: { align: 'center' },
      },
      {
        id: createId(),
        type: 'button',
        content: 'Get Started',
        props: { action: { type: 'next-screen' }, variant: 'primary' },
      },
    ],
  };
}

function extractSettings(
  pageSettings: FlowCanvasPage['settings'] | null | undefined,
  rowSettings: Record<string, unknown> | undefined
): FunnelSettings {
  // Merge settings from both sources
  const merged = { ...(rowSettings || {}), ...(pageSettings || {}) } as Record<string, unknown>;
  
  return {
    primaryColor: (merged.primary_color as string) || (merged.primaryColor as string) || '#8B5CF6',
    fontFamily: (merged.font_family as string) || (merged.fontFamily as string) || 'Inter',
    showProgress: merged.showProgress !== false,
  };
}

function mapStepTypeToScreenType(stepType: string): ScreenType {
  const mapping: Record<string, ScreenType> = {
    form: 'form',
    content: 'content',
    quiz: 'choice',
    booking: 'calendar',
    thankyou: 'thankyou',
    checkout: 'form',
  };
  return mapping[stepType] || 'content';
}

function mapPageTypeToScreenType(pageType: string): ScreenType {
  const mapping: Record<string, ScreenType> = {
    landing: 'content',
    optin: 'form',
    appointment: 'calendar',
    thank_you: 'thankyou',
  };
  return mapping[pageType] || 'content';
}

function mapScreenTypeToPageType(screenType: ScreenType): 'landing' | 'optin' | 'appointment' | 'thank_you' {
  const mapping: Record<ScreenType, 'landing' | 'optin' | 'appointment' | 'thank_you'> = {
    content: 'landing',
    form: 'optin',
    choice: 'landing',
    calendar: 'appointment',
    thankyou: 'thank_you',
  };
  return mapping[screenType];
}

function mapScreenTypeToStepType(screenType: ScreenType): 'form' | 'content' | 'quiz' | 'booking' | 'checkout' | 'thankyou' {
  const mapping: Record<ScreenType, 'form' | 'content' | 'quiz' | 'booking' | 'checkout' | 'thankyou'> = {
    content: 'content',
    form: 'form',
    choice: 'quiz',
    calendar: 'booking',
    thankyou: 'thankyou',
  };
  return mapping[screenType];
}

function mapScreenTypeToIntent(screenType: ScreenType): 'capture' | 'qualify' | 'schedule' | 'convert' | 'complete' {
  const mapping: Record<ScreenType, 'capture' | 'qualify' | 'schedule' | 'convert' | 'complete'> = {
    content: 'capture',
    form: 'capture',
    choice: 'qualify',
    calendar: 'schedule',
    thankyou: 'complete',
  };
  return mapping[screenType];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractBlocksFromStep(step: any): Block[] {
  const blocks: Block[] = [];

  // Extract from frames -> stacks -> blocks -> elements
  if (step.frames) {
    for (const frame of step.frames) {
      if (frame.stacks) {
        for (const stack of frame.stacks) {
          if (stack.blocks) {
            for (const block of stack.blocks) {
              if (block.elements) {
                for (const element of block.elements) {
                  blocks.push(elementToBlock(element));
                }
              }
            }
          }
        }
      }
    }
  }

  return blocks;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function elementToBlock(element: any): Block {
  return {
    id: element.id || createId(),
    type: mapElementTypeToBlockType(element.type),
    content: element.content || '',
    props: element.props || {},
  };
}

function mapElementTypeToBlockType(type: string): BlockType {
  const mapping: Record<string, BlockType> = {
    heading: 'heading',
    text: 'text',
    button: 'button',
    input: 'input',
    image: 'image',
    video: 'video',
    divider: 'divider',
    spacer: 'spacer',
    checkbox: 'choice',
    select: 'choice',
    radio: 'choice',
    icon: 'icon',
    payment: 'embed',
    checkout: 'embed',
  };
  return (mapping[type] as BlockType) || 'text';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractBlocksFromCanvasNode(node: any): Block[] {
  const blocks: Block[] = [];

  if (!node) return blocks;

  // If it's a leaf element type, convert directly
  const elementTypes = ['heading', 'text', 'button', 'input', 'image', 'video', 'divider', 'spacer'];
  if (elementTypes.includes(node.type)) {
    blocks.push({
      id: node.id || createId(),
      type: node.type as BlockType,
      content: node.props?.content || node.props?.text || '',
      props: node.props || {},
    });
  }

  // Recurse into children
  if (node.children) {
    for (const child of node.children) {
      blocks.push(...extractBlocksFromCanvasNode(child));
    }
  }

  return blocks;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function blocksToCanvasNode(blocks: Block[], rootId: string): any {
  return {
    id: rootId,
    type: 'frame',
    props: {},
    children: [
      {
        id: createId(),
        type: 'section',
        props: { label: 'Main' },
        children: [
          {
            id: createId(),
            type: 'container',
            props: { direction: 'vertical' },
            children: blocks.map((block) => ({
              id: block.id,
              type: block.type,
              props: { content: block.content, ...block.props },
              children: [],
            })),
          },
        ],
      },
    ],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function blocksToFrames(blocks: Block[]): any[] {
  return [
    {
      id: createId(),
      label: 'Main Section',
      stacks: [
        {
          id: createId(),
          label: 'Content',
          direction: 'vertical',
          blocks: [
            {
              id: createId(),
              type: 'custom',
              label: 'Content',
              elements: blocks.map((block) => ({
                id: block.id,
                type: block.type,
                content: block.content,
                props: block.props,
              })),
              props: {},
            },
          ],
          props: {},
        },
      ],
      props: {},
    },
  ];
}
