/**
 * Color Context Utility
 * 
 * Provides intelligent color-context awareness for blocks based on canvas background.
 * Ensures proper contrast and visibility when adding blocks to steps with different backgrounds.
 */

import { parseColor, getLuminance, getContrastTextColor } from '@/builder/utils/ContrastEngine';

export interface ColorContext {
  isDark: boolean;
  luminance: number;
  textColor: string;
  headingColor: string;
  buttonBackground: string;
  buttonText: string;
  outlineColor: string;
  borderColor: string;
}

/**
 * Calculate luminance and determine color context based on background color
 */
export function getColorContext(backgroundColor: string): ColorContext {
  const rgb = parseColor(backgroundColor);
  
  // Default to white background if we can't parse
  if (!rgb || rgb.a < 0.5) {
    return {
      isDark: false,
      luminance: 1,
      textColor: '#1f2937',
      headingColor: '#000000',
      buttonBackground: '#3b82f6',
      buttonText: '#ffffff',
      outlineColor: 'rgba(0,0,0,0.1)',
      borderColor: 'rgba(0,0,0,0.1)',
    };
  }
  
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  const isDark = luminance < 0.5;
  
  // Get contrasting text color using WCAG-compliant logic
  const textColor = getContrastTextColor(backgroundColor, {
    darkColor: '#1f2937',
    lightColor: '#ffffff',
  });
  
  const headingColor = getContrastTextColor(backgroundColor, {
    darkColor: '#000000',
    lightColor: '#ffffff',
  });
  
  // For buttons: use white button on dark backgrounds, blue on light backgrounds
  const buttonBackground = isDark ? '#ffffff' : '#3b82f6';
  const buttonText = isDark ? '#000000' : '#ffffff';
  
  // Outline and border colors with appropriate opacity
  const outlineColor = isDark 
    ? 'rgba(255,255,255,0.3)' 
    : 'rgba(0,0,0,0.1)';
  const borderColor = isDark 
    ? 'rgba(255,255,255,0.2)' 
    : 'rgba(0,0,0,0.1)';
  
  return {
    isDark,
    luminance,
    textColor,
    headingColor,
    buttonBackground,
    buttonText,
    outlineColor,
    borderColor,
  };
}

/**
 * Apply color context to block content based on block type
 */
export function applyColorContextToContent(
  content: any,
  blockType: string,
  colorContext: ColorContext
): void {
  if (!content) return;
  
  switch (blockType) {
    case 'button':
      content.backgroundColor = colorContext.buttonBackground;
      content.color = colorContext.buttonText;
      break;
      
    case 'heading':
      if (!content.styles) content.styles = {};
      content.styles.color = colorContext.headingColor;
      break;
      
    case 'text':
      if (!content.styles) content.styles = {};
      content.styles.color = colorContext.textColor;
      break;
      
    case 'list':
      content.textColor = colorContext.textColor;
      content.iconColor = colorContext.textColor;
      break;
      
    case 'accordion':
      content.titleColor = colorContext.headingColor;
      content.contentColor = colorContext.textColor;
      break;
      
    case 'reviews':
      content.textColor = colorContext.textColor;
      break;
      
    case 'social-proof':
      content.valueColor = colorContext.headingColor;
      content.labelColor = colorContext.textColor;
      break;
      
    case 'countdown':
      content.textColor = colorContext.textColor;
      break;
      
    case 'webinar':
      content.titleColor = colorContext.headingColor;
      break;
      
    case 'message':
      // Message blocks have questionColor for the label/question
      content.questionColor = colorContext.headingColor;
      // Helper text color for character count
      content.helperTextColor = colorContext.textColor;
      // Set consent text color if consent exists
      if (content.consent) {
        content.consent.textColor = colorContext.textColor;
      }
      if (content.submitButton) {
        content.submitButton.backgroundColor = colorContext.buttonBackground;
        content.submitButton.color = colorContext.buttonText;
      }
      break;
      
    case 'payment':
      // Payment blocks have description text
      content.descriptionColor = colorContext.textColor;
      // Label color (e.g., "Amount Due")
      content.labelColor = colorContext.textColor;
      if (content.amountColor === undefined) {
        content.amountColor = colorContext.headingColor;
      }
      // Set consent text color if consent exists
      if (content.consent) {
        content.consent.textColor = colorContext.textColor;
      }
      break;
      
    case 'upload':
      // Upload blocks have label and helper text
      content.labelColor = colorContext.textColor;
      content.helperTextColor = colorContext.textColor;
      // Set consent text color if consent exists
      if (content.consent) {
        content.consent.textColor = colorContext.textColor;
      }
      break;
      
    case 'date-picker':
    case 'dropdown':
      // These blocks have label fields
      content.labelColor = colorContext.textColor;
      break;
      
    case 'form':
      content.textColor = colorContext.textColor;
      // Form title color - ensure titleStyles exists and color is set
      if (!content.titleStyles) {
        content.titleStyles = {};
      }
      if (!content.titleStyles.color) {
        content.titleStyles.color = colorContext.headingColor;
      }
      // Form field label color
      content.labelColor = colorContext.textColor;
      // Set consent text color if consent exists
      if (content.consent) {
        content.consent.textColor = colorContext.textColor;
      }
      if (content.submitButton) {
        content.submitButton.backgroundColor = colorContext.buttonBackground;
        content.submitButton.color = colorContext.buttonText;
      }
      break;
      
    case 'email-capture':
    case 'phone-capture':
      content.textColor = colorContext.textColor;
      // Subtitle/description color
      if (blockType === 'email-capture') {
        content.subtitleColor = colorContext.textColor;
      } else if (blockType === 'phone-capture') {
        content.subtitleColor = colorContext.textColor;
      }
      // Set consent text color if consent exists
      if (content.consent) {
        content.consent.textColor = colorContext.textColor;
      }
      if (content.submitButton) {
        content.submitButton.backgroundColor = colorContext.buttonBackground;
        content.submitButton.color = colorContext.buttonText;
      }
      break;
      
    case 'quiz':
    case 'multiple-choice':
    case 'choice':
    case 'image-quiz':
    case 'video-question':
      content.textColor = colorContext.textColor;
      // Set questionColor for quiz blocks
      content.questionColor = colorContext.headingColor;
      if (content.submitButton) {
        content.submitButton.backgroundColor = colorContext.buttonBackground;
        content.submitButton.color = colorContext.buttonText;
      }
      // Apply to options
      if (content.options && Array.isArray(content.options)) {
        content.options = content.options.map((opt: any) => ({
          ...opt,
          textColor: opt.textColor || colorContext.textColor,
          borderColor: opt.borderColor || colorContext.outlineColor,
        }));
      }
      break;
      
    case 'card':
      content.backgroundColor = colorContext.isDark 
        ? 'rgba(255,255,255,0.05)' 
        : 'rgba(0,0,0,0.02)';
      break;
      
    case 'divider':
      content.color = colorContext.borderColor;
      break;
      
    case 'testimonial-slider':
      // Testimonials typically have their own backgrounds, but ensure text is readable
      // This is handled by the block's own styling, but we can ensure contrast
      break;
      
    case 'logo-bar':
      // Logo bar title color - ensure titleStyles exists and color is set
      if (content.title || content.titleStyles) {
        if (!content.titleStyles) {
          content.titleStyles = {};
        }
        if (!content.titleStyles.color) {
          content.titleStyles.color = colorContext.headingColor;
        }
      }
      break;
      
    case 'calendar':
      // Calendar blocks have title
      if (content.titleColor === undefined) {
        content.titleColor = colorContext.headingColor;
      }
      break;
      
    case 'loader':
      // Loader blocks have text and subtext with styles
      if (!content.textStyles) {
        content.textStyles = {};
      }
      if (!content.textStyles.color) {
        content.textStyles.color = colorContext.headingColor;
      }
      if (content.subtext) {
        if (!content.subtextStyles) {
          content.subtextStyles = {};
        }
        if (!content.subtextStyles.color) {
          content.subtextStyles.color = colorContext.textColor;
        }
      }
      break;
      
    case 'graphic':
      // Graphic blocks may have color
      if (!content.color) {
        content.color = colorContext.headingColor;
      }
      break;
      
    case 'columns':
      // Columns contain nested blocks which will inherit colors
      break;
      
    default:
      // For other block types, try to apply text color if they have a styles object
      if (content.styles && typeof content.styles === 'object') {
        if (!content.styles.color) {
          content.styles.color = colorContext.textColor;
        }
      }
      break;
  }
}

/**
 * Apply color context to block styles (borders, outlines, etc.)
 */
export function applyColorContextToStyles(
  styles: any,
  blockType: string,
  colorContext: ColorContext
): void {
  if (!styles || typeof styles !== 'object') return;
  
  // Apply border colors if block has borders
  if (styles.borderWidth && styles.borderWidth > 0) {
    styles.borderColor = colorContext.borderColor;
  }
  
  // For outline-style blocks, ensure outline color is set
  if (blockType === 'button' || blockType === 'card') {
    // These blocks might have outline variants that need border colors
    if (styles.borderWidth === 0 && !styles.borderColor) {
      // If no border but might need one, set a subtle border
      styles.borderColor = colorContext.outlineColor;
    }
  }
}
