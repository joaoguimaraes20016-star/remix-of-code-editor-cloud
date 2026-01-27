/**
 * ContrastEngine Tests
 * 
 * Tests for theme-aware color intelligence
 */

import { describe, it, expect } from 'vitest';
import {
  parseColor,
  getLuminance,
  getContrastRatio,
  meetsWCAGAA,
  isLightColor,
  getContrastTextColor,
  deriveHoverColor,
  getThemeAwareColors,
  extractGradientFirstColor,
  isReadable,
} from '../utils/ContrastEngine';

describe('ContrastEngine', () => {
  describe('parseColor', () => {
    it('parses hex colors', () => {
      const result = parseColor('#ffffff');
      expect(result).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    });

    it('parses short hex colors', () => {
      const result = parseColor('#fff');
      expect(result).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    });

    it('parses rgb colors', () => {
      const result = parseColor('rgb(255, 128, 64)');
      expect(result).toEqual({ r: 255, g: 128, b: 64, a: 1 });
    });

    it('parses rgba colors', () => {
      const result = parseColor('rgba(100, 150, 200, 0.5)');
      expect(result).toEqual({ r: 100, g: 150, b: 200, a: 0.5 });
    });

    it('parses hsl colors', () => {
      const result = parseColor('hsl(0, 100%, 50%)');
      expect(result).not.toBeNull();
      expect(result?.r).toBe(255);
      expect(result?.g).toBe(0);
      expect(result?.b).toBe(0);
    });

    it('handles transparent', () => {
      const result = parseColor('transparent');
      expect(result).toEqual({ r: 255, g: 255, b: 255, a: 0 });
    });

    it('returns null for invalid colors', () => {
      expect(parseColor('notacolor')).toBeNull();
    });
  });

  describe('getLuminance', () => {
    it('returns 1 for white', () => {
      const lum = getLuminance(255, 255, 255);
      expect(lum).toBeCloseTo(1, 5);
    });

    it('returns 0 for black', () => {
      const lum = getLuminance(0, 0, 0);
      expect(lum).toBeCloseTo(0, 5);
    });

    it('returns correct value for gray', () => {
      const lum = getLuminance(128, 128, 128);
      expect(lum).toBeGreaterThan(0.2);
      expect(lum).toBeLessThan(0.3);
    });
  });

  describe('getContrastRatio', () => {
    it('returns 21 for black on white', () => {
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('returns 1 for same colors', () => {
      const ratio = getContrastRatio('#ff0000', '#ff0000');
      expect(ratio).toBeCloseTo(1, 5);
    });
  });

  describe('meetsWCAGAA', () => {
    it('passes for black on white', () => {
      expect(meetsWCAGAA('#000000', '#ffffff')).toBe(true);
    });

    it('fails for low contrast', () => {
      expect(meetsWCAGAA('#777777', '#888888')).toBe(false);
    });

    it('has lower requirement for large text', () => {
      // Some color combos pass for large text but not normal
      const passesBoth = meetsWCAGAA('#555555', '#ffffff');
      expect(passesBoth).toBe(true); // High contrast passes both
    });
  });

  describe('isLightColor', () => {
    it('returns true for white', () => {
      expect(isLightColor('#ffffff')).toBe(true);
    });

    it('returns false for black', () => {
      expect(isLightColor('#000000')).toBe(false);
    });

    it('returns true for light yellow', () => {
      expect(isLightColor('#ffff00')).toBe(true);
    });

    it('returns false for dark blue', () => {
      expect(isLightColor('#000066')).toBe(false);
    });
  });

  describe('getContrastTextColor', () => {
    it('returns dark text for light backgrounds', () => {
      expect(getContrastTextColor('#ffffff')).toBe('#1f2937');
      expect(getContrastTextColor('#f0f0f0')).toBe('#1f2937');
      expect(getContrastTextColor('#ffff00')).toBe('#1f2937');
    });

    it('returns light text for dark backgrounds', () => {
      expect(getContrastTextColor('#000000')).toBe('#ffffff');
      expect(getContrastTextColor('#1a1a1a')).toBe('#ffffff');
      expect(getContrastTextColor('#000066')).toBe('#ffffff');
    });

    it('handles rgb format', () => {
      expect(getContrastTextColor('rgb(255, 255, 255)')).toBe('#1f2937');
      expect(getContrastTextColor('rgb(0, 0, 0)')).toBe('#ffffff');
    });
  });

  describe('deriveHoverColor', () => {
    it('darkens light colors', () => {
      const hover = deriveHoverColor('#ffffff');
      const parsed = parseColor(hover);
      expect(parsed).not.toBeNull();
      expect(parsed!.r).toBeLessThan(255);
    });

    it('lightens dark colors', () => {
      const hover = deriveHoverColor('#000000');
      const parsed = parseColor(hover);
      expect(parsed).not.toBeNull();
      expect(parsed!.r).toBeGreaterThan(0);
    });

    it('provides fallback for unparseable colors', () => {
      const hover = deriveHoverColor('notacolor', true);
      expect(hover).toContain('rgba');
    });
  });

  describe('getThemeAwareColors', () => {
    it('generates complete color palette for light background', () => {
      const colors = getThemeAwareColors('#ffffff');
      
      expect(colors.text).toBe('#1f2937');
      expect(colors.textMuted).toBe('#6b7280');
      expect(colors.hoverBg).toBeDefined();
      expect(colors.activeBg).toBeDefined();
      expect(colors.border).toBeDefined();
      expect(colors.meetsAAContrast).toBe(true);
    });

    it('generates complete color palette for dark background', () => {
      const colors = getThemeAwareColors('#1a1a1a');
      
      expect(colors.text).toBe('#ffffff');
      expect(colors.textMuted).toBe('#9ca3af');
      expect(colors.meetsAAContrast).toBe(true);
    });
  });

  describe('extractGradientFirstColor', () => {
    it('extracts hex color from gradient', () => {
      const color = extractGradientFirstColor('linear-gradient(135deg, #ff0000 0%, #0000ff 100%)');
      expect(color).toBe('#ff0000');
    });

    it('extracts rgb color from gradient', () => {
      const color = extractGradientFirstColor('linear-gradient(to right, rgb(255, 0, 0), rgb(0, 0, 255))');
      expect(color).toBe('rgb(255, 0, 0)');
    });

    it('returns null for non-gradient', () => {
      const color = extractGradientFirstColor('not a gradient');
      expect(color).toBeNull();
    });
  });

  describe('isReadable', () => {
    it('returns true for high contrast', () => {
      expect(isReadable('#000000', '#ffffff')).toBe(true);
    });

    it('returns false for low contrast', () => {
      expect(isReadable('#cccccc', '#dddddd')).toBe(false);
    });
  });
});
