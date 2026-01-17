/**
 * Placeholder Generators
 * 
 * Create placeholder elements for images and videos
 * that users can later swap with real assets.
 */

import type { Element } from '@/flow-canvas/types/infostack';
import { generateId } from '@/flow-canvas/builder/utils/helpers';

export type PlaceholderContext = 'hero' | 'testimonial' | 'feature' | 'avatar' | 'background' | 'product';
export type AspectRatio = '16:9' | '4:3' | '1:1' | '3:4' | '9:16';

export interface ImagePlaceholderOptions {
  aspectRatio?: AspectRatio;
  context?: PlaceholderContext;
  alt?: string;
}

export interface VideoPlaceholderOptions {
  platform?: 'youtube' | 'vimeo' | 'wistia' | 'loom';
  aspectRatio?: AspectRatio;
}

/**
 * Create a placeholder image element
 */
export function createImagePlaceholder(options: ImagePlaceholderOptions = {}): Element {
  const {
    aspectRatio = '16:9',
    context = 'hero',
    alt = 'Placeholder image'
  } = options;
  
  return {
    id: generateId(),
    type: 'image',
    content: '',
    props: {
      src: '',
      alt,
      placeholder: true,
      placeholderContext: context,
      aspectRatio,
    },
  };
}

/**
 * Create a placeholder video element
 */
export function createVideoPlaceholder(options: VideoPlaceholderOptions = {}): Element {
  const {
    platform = 'youtube',
    aspectRatio = '16:9'
  } = options;
  
  return {
    id: generateId(),
    type: 'video',
    content: '',
    props: {
      src: '',
      platform,
      placeholder: true,
      aspectRatio,
    },
  };
}

/**
 * Get dimensions for an aspect ratio
 */
export function getAspectRatioDimensions(ratio: AspectRatio): { width: number; height: number } {
  const dimensions: Record<AspectRatio, { width: number; height: number }> = {
    '16:9': { width: 16, height: 9 },
    '4:3': { width: 4, height: 3 },
    '1:1': { width: 1, height: 1 },
    '3:4': { width: 3, height: 4 },
    '9:16': { width: 9, height: 16 },
  };
  
  return dimensions[ratio] || dimensions['16:9'];
}

/**
 * Get placeholder background based on context
 */
export function getPlaceholderStyles(context: PlaceholderContext): string {
  const styles: Record<PlaceholderContext, string> = {
    hero: 'bg-gradient-to-br from-slate-800 to-slate-900',
    testimonial: 'bg-gradient-to-br from-blue-900/50 to-purple-900/50',
    feature: 'bg-gradient-to-br from-indigo-900/50 to-cyan-900/50',
    avatar: 'bg-gradient-to-br from-pink-900/50 to-orange-900/50',
    background: 'bg-gradient-to-br from-slate-900 to-slate-950',
    product: 'bg-gradient-to-br from-emerald-900/50 to-teal-900/50',
  };
  
  return styles[context] || styles.hero;
}

/**
 * Get placeholder icon based on context
 */
export function getPlaceholderIcon(context: PlaceholderContext): string {
  const icons: Record<PlaceholderContext, string> = {
    hero: 'image',
    testimonial: 'user',
    feature: 'box',
    avatar: 'user-circle',
    background: 'image',
    product: 'package',
  };
  
  return icons[context] || 'image';
}

/**
 * Get placeholder help text based on context
 */
export function getPlaceholderHelpText(context: PlaceholderContext): string {
  const helpTexts: Record<PlaceholderContext, string> = {
    hero: 'Click to add hero image',
    testimonial: 'Click to add customer photo',
    feature: 'Click to add feature graphic',
    avatar: 'Click to add profile photo',
    background: 'Click to add background image',
    product: 'Click to add product image',
  };
  
  return helpTexts[context] || 'Click to add image';
}
