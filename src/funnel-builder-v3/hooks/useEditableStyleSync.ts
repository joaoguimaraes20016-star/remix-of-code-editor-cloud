import { useCallback, useMemo } from 'react';
import { TextStyles } from '@/funnel-builder-v3/types/funnel';

interface StyleSyncResult {
  styles: TextStyles;
  handleStyleChange: (updates: Partial<TextStyles>) => void;
}

/**
 * Hook for synchronizing EditableText toolbar styles with block content state.
 * This ensures toolbar color/gradient changes persist to the block and sync with inspector.
 * 
 * @param blockId - Block ID
 * @param stepId - Step ID
 * @param currentColor - Current color value from block content
 * @param currentGradient - Current gradient value from block content
 * @param existingStyles - Existing TextStyles object if any
 * @param updateBlockContent - Function to update block content
 * @param colorField - Field name for solid color (e.g., 'questionColor')
 * @param gradientPath - Path for gradient. Can be:
 *   - Simple field: 'textGradient' 
 *   - Nested field: 'questionStyles.textGradient'
 */
export function useEditableStyleSync(
  blockId: string | undefined,
  stepId: string | undefined,
  currentColor: string | undefined,
  currentGradient: string | undefined,
  existingStyles: TextStyles | undefined,
  updateBlockContent: (stepId: string, blockId: string, updates: Record<string, any>) => void,
  colorField: string,
  gradientPath: string
): StyleSyncResult {
  // Build styles object for EditableText
  const styles = useMemo<TextStyles>(() => ({
    ...existingStyles,
    color: currentColor || '',
    textGradient: currentGradient || '',
  }), [existingStyles, currentColor, currentGradient]);

  // Handle style changes from toolbar
  const handleStyleChange = useCallback((updates: Partial<TextStyles>) => {
    if (!blockId || !stepId) return;
    
    const next: Record<string, any> = {};
    
    // Handle solid color update
    if (updates.color !== undefined) {
      next[colorField] = updates.color;
      
      // Clear gradient when setting solid color
      if (gradientPath.includes('.')) {
        const [parent, child] = gradientPath.split('.');
        next[parent] = { ...existingStyles, [child]: '' };
      } else {
        next[gradientPath] = '';
      }
    }
    
    // Handle gradient update
    if (updates.textGradient !== undefined) {
      if (gradientPath.includes('.')) {
        const [parent, child] = gradientPath.split('.');
        next[parent] = { ...existingStyles, [child]: updates.textGradient };
      } else {
        next[gradientPath] = updates.textGradient;
      }
      
      // Clear solid color when setting gradient
      if (updates.textGradient) {
        next[colorField] = '';
      }
    }
    
    if (Object.keys(next).length > 0) {
      updateBlockContent(stepId, blockId, next);
    }
  }, [blockId, stepId, colorField, gradientPath, existingStyles, updateBlockContent]);

  return { styles, handleStyleChange };
}

/**
 * Simpler version for blocks where color/gradient are direct fields (not nested)
 */
export function useSimpleStyleSync(
  blockId: string | undefined,
  stepId: string | undefined,
  currentColor: string | undefined,
  currentGradient: string | undefined,
  updateBlockContent: (stepId: string, blockId: string, updates: Record<string, any>) => void,
  colorField: string,
  gradientField: string
): StyleSyncResult {
  const styles = useMemo<TextStyles>(() => ({
    color: currentColor || '',
    textGradient: currentGradient || '',
  }), [currentColor, currentGradient]);

  const handleStyleChange = useCallback((updates: Partial<TextStyles>) => {
    if (!blockId || !stepId) return;
    
    const next: Record<string, any> = {};
    
    if (updates.color !== undefined) {
      next[colorField] = updates.color;
      next[gradientField] = ''; // Clear gradient
    }
    
    if (updates.textGradient !== undefined) {
      next[gradientField] = updates.textGradient;
      if (updates.textGradient) {
        next[colorField] = ''; // Clear color when setting gradient
      }
    }
    
    if (Object.keys(next).length > 0) {
      updateBlockContent(stepId, blockId, next);
    }
  }, [blockId, stepId, colorField, gradientField, updateBlockContent]);

  return { styles, handleStyleChange };
}
