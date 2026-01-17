/**
 * Content Snapshot Extractor
 * 
 * Phase 14: Extracts actual page content for true AI context awareness.
 * The AI needs to know what's actually ON the page, not just metadata.
 */

import type { Page, Step, Block, Element } from '@/flow-canvas/types/infostack';

/** List of premium element types for detection */
const PREMIUM_ELEMENT_TYPES = [
  'gradient-text',
  'stat-number',
  'avatar-group',
  'ticker',
  'badge',
  'process-step',
  'video-thumbnail',
  'underline-text',
];

export interface ContentSnapshot {
  /** First 5 headlines on the page */
  headlines: string[];
  /** All unique colors used (text, background, etc.) */
  colorsUsed: string[];
  /** Premium elements already in use */
  premiumElementsUsed: string[];
  /** Total section/frame count */
  sectionCount: number;
  /** Total block count */
  blockCount: number;
  /** Block types in use */
  blockTypes: string[];
  /** Content summary for AI context */
  contentSummary: string;
}

export interface ContrastContext {
  /** Whether the overall page background is dark */
  isDarkBackground: boolean;
  /** Background color luminance (0-1) */
  backgroundLuminance: number;
  /** Recommended text color for readability */
  recommendedTextColor: string;
  /** Per-section contrast info */
  sectionContrasts: Array<{
    id: string;
    bgColor: string;
    isDark: boolean;
    recommendedText: string;
  }>;
}

/**
 * Calculate relative luminance of a color (for contrast calculations)
 * Based on WCAG 2.0 formula
 */
export function calculateLuminance(color: string): number {
  // Handle hex colors
  let r = 0, g = 0, b = 0;
  
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16) / 255;
      g = parseInt(hex[1] + hex[1], 16) / 255;
      b = parseInt(hex[2] + hex[2], 16) / 255;
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16) / 255;
      g = parseInt(hex.slice(2, 4), 16) / 255;
      b = parseInt(hex.slice(4, 6), 16) / 255;
    }
  } else if (color.startsWith('rgb')) {
    const match = color.match(/\d+/g);
    if (match && match.length >= 3) {
      r = parseInt(match[0]) / 255;
      g = parseInt(match[1]) / 255;
      b = parseInt(match[2]) / 255;
    }
  } else if (color.startsWith('hsl')) {
    // For HSL, we'll approximate - light colors have high L
    const match = color.match(/\d+/g);
    if (match && match.length >= 3) {
      const l = parseInt(match[2]) / 100;
      return l; // Simplified: L value is close enough for our purposes
    }
  }
  
  // Apply sRGB gamma correction
  const linearize = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Determine if a color is "dark" (needs light text)
 */
export function isColorDark(color: string): boolean {
  const luminance = calculateLuminance(color);
  return luminance < 0.5;
}

/**
 * Extract blocks from a step's frames
 */
function extractBlocksFromStep(step: Step): Block[] {
  if (!step.frames) return [];
  return step.frames.flatMap(frame => 
    frame.stacks?.flatMap(stack => stack.blocks || []) || []
  );
}

/**
 * Extract all colors used in an element
 */
function extractColorsFromElement(element: Element): string[] {
  const colors: string[] = [];
  
  if (element.styles?.color) colors.push(element.styles.color);
  if (element.styles?.backgroundColor) colors.push(element.styles.backgroundColor);
  if (element.styles?.borderColor) colors.push(element.styles.borderColor);
  
  // Check props for color values
  if (element.props?.color && typeof element.props.color === 'string') {
    colors.push(element.props.color);
  }
  if (element.props?.gradientFrom && typeof element.props.gradientFrom === 'string') {
    colors.push(element.props.gradientFrom);
  }
  if (element.props?.gradientTo && typeof element.props.gradientTo === 'string') {
    colors.push(element.props.gradientTo);
  }
  
  return colors;
}

/**
 * Extract a content snapshot from the page for AI context
 */
export function extractContentSnapshot(page: Page): ContentSnapshot {
  const headlines: string[] = [];
  const colors: string[] = [];
  const premiumElements: string[] = [];
  const blockTypes: string[] = [];
  let sectionCount = 0;
  let blockCount = 0;
  
  page.steps.forEach(step => {
    step.frames?.forEach(frame => {
      sectionCount++;
      frame.stacks?.forEach(stack => {
        stack.blocks?.forEach(block => {
          blockCount++;
          blockTypes.push(block.type);
          
          block.elements?.forEach(element => {
            // Extract headlines (headings and large text)
            if (element.type === 'heading' && element.content) {
              headlines.push(element.content.slice(0, 80));
            } else if (element.type === 'text' && element.content && element.content.length > 20) {
              // Only include substantial text
              headlines.push(element.content.slice(0, 50));
            }
            
            // Extract colors
            const elementColors = extractColorsFromElement(element);
            colors.push(...elementColors);
            
            // Track premium elements
            if (PREMIUM_ELEMENT_TYPES.includes(element.type)) {
              premiumElements.push(element.type);
            }
          });
        });
      });
    });
  });
  
  // Also extract page-level colors
  if (page.settings.page_background?.color) {
    colors.push(page.settings.page_background.color);
  }
  if (page.settings.primary_color) {
    colors.push(page.settings.primary_color);
  }
  
  // Deduplicate
  const uniqueColors = [...new Set(colors.filter(c => c && c !== 'inherit' && c !== 'transparent'))];
  const uniquePremiumElements = [...new Set(premiumElements)];
  const uniqueBlockTypes = [...new Set(blockTypes)];
  
  // Generate content summary
  const contentSummary = generateContentSummary(headlines, uniqueBlockTypes, uniquePremiumElements);
  
  return {
    headlines: headlines.slice(0, 5),
    colorsUsed: uniqueColors.slice(0, 10),
    premiumElementsUsed: uniquePremiumElements,
    sectionCount,
    blockCount,
    blockTypes: uniqueBlockTypes,
    contentSummary,
  };
}

/**
 * Analyze contrast context for the page
 */
export function analyzeContrastContext(page: Page): ContrastContext {
  const bgColor = page.settings.page_background?.color || '#ffffff';
  const isDark = isColorDark(bgColor);
  const luminance = calculateLuminance(bgColor);
  
  // Analyze each section's background
  const sectionContrasts: ContrastContext['sectionContrasts'] = [];
  
  page.steps.forEach(step => {
    // Step background overrides page background
    const stepBg = step.background?.color || bgColor;
    const stepIsDark = step.background?.color ? isColorDark(step.background.color) : isDark;
    
    step.frames?.forEach(frame => {
      // Frame background overrides step background
      const frameBg = frame.backgroundColor || stepBg;
      const frameIsDark = frame.backgroundColor ? isColorDark(frame.backgroundColor) : stepIsDark;
      
      sectionContrasts.push({
        id: frame.id,
        bgColor: frameBg,
        isDark: frameIsDark,
        recommendedText: frameIsDark ? '#ffffff' : '#1f2937',
      });
    });
  });
  
  return {
    isDarkBackground: isDark,
    backgroundLuminance: luminance,
    recommendedTextColor: isDark ? '#ffffff' : '#1f2937',
    sectionContrasts,
  };
}

/**
 * Generate a brief content summary for AI context
 */
function generateContentSummary(
  headlines: string[], 
  blockTypes: string[], 
  premiumElements: string[]
): string {
  const parts: string[] = [];
  
  if (headlines.length > 0) {
    parts.push(`Headlines: "${headlines[0]}"${headlines.length > 1 ? ` (+${headlines.length - 1} more)` : ''}`);
  }
  
  if (blockTypes.length > 0) {
    parts.push(`Blocks: ${blockTypes.slice(0, 3).join(', ')}`);
  }
  
  if (premiumElements.length > 0) {
    parts.push(`Premium: ${premiumElements.join(', ')}`);
  }
  
  return parts.join(' | ') || 'Empty page';
}
