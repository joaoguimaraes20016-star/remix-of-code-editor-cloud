/**
 * Token System Unit Tests
 */

import { describe, it, expect, test } from 'vitest';
import {
  shadowTokens,
  radiusTokens,
  borderWidthTokens,
  effectTokens,
  hoverTokens,
  hexToRgba,
  type ShadowToken,
  type RadiusToken,
  type BorderWidthToken,
  type EffectToken,
} from '../tokens/StyleTokenSystem';
import { resolveTokens, resolveShadow, resolveRadius } from '../tokens/TokenResolver';

describe('StyleTokenSystem', () => {
  describe('shadowTokens', () => {
    const staticShadowKeys: ShadowToken[] = ['none', 'sm', 'md', 'lg', 'xl'];
    
    test.each(staticShadowKeys)(
      'shadow.%s resolves to valid CSS with boxShadow',
      (key) => {
        const css = shadowTokens[key];
        if (typeof css === 'object') {
          expect(css).toHaveProperty('boxShadow');
        }
      }
    );

    it('shadow.none produces no visible shadow', () => {
      const none = shadowTokens.none;
      if (typeof none === 'object') {
        expect(none.boxShadow).toBe('none');
      }
    });

    it('shadow.glow is a function that accepts color', () => {
      const glowFn = shadowTokens.glow;
      expect(typeof glowFn).toBe('function');
      if (typeof glowFn === 'function') {
        const result = glowFn('#ff0000');
        expect(result).toHaveProperty('boxShadow');
        expect(result.boxShadow).toContain('20px');
      }
    });
  });

  describe('radiusTokens', () => {
    const radiusKeys: RadiusToken[] = ['none', 'sm', 'md', 'lg', 'xl', 'full'];
    
    test.each(radiusKeys)(
      'radius.%s resolves to valid CSS with borderRadius',
      (key) => {
        const css = radiusTokens[key];
        expect(css).toHaveProperty('borderRadius');
      }
    );

    it('radius.none produces 0 border radius', () => {
      expect(radiusTokens.none.borderRadius).toBe('0');
    });

    it('radius.full produces pill shape', () => {
      expect(radiusTokens.full.borderRadius).toBe('9999px');
    });
  });

  describe('borderWidthTokens', () => {
    const borderKeys: BorderWidthToken[] = ['0', '1', '2', '4'];
    
    test.each(borderKeys)(
      'borderWidth.%s resolves to valid CSS with borderWidth',
      (key) => {
        const css = borderWidthTokens[key];
        expect(css).toHaveProperty('borderWidth');
      }
    );

    it('borderWidth.0 produces no border', () => {
      expect(borderWidthTokens['0'].borderWidth).toBe('0');
    });
  });

  describe('effectTokens', () => {
    const effectKeys: EffectToken[] = ['fadeIn', 'fadeOut', 'slideUp', 'slideDown', 'scaleIn', 'bounce'];
    
    test.each(effectKeys)(
      'effect.%s resolves to CSS with animation',
      (key) => {
        const css = effectTokens[key];
        expect(css).toHaveProperty('animation');
      }
    );

    it('effect.none produces empty object', () => {
      expect(Object.keys(effectTokens.none).length).toBe(0);
    });
  });

  describe('hoverTokens', () => {
    it('hover.none produces empty object', () => {
      const css = hoverTokens.none;
      if (typeof css === 'object') {
        expect(Object.keys(css).length).toBe(0);
      }
    });

    it('hover.lift includes transform', () => {
      const css = hoverTokens.lift;
      if (typeof css === 'object') {
        expect(css).toHaveProperty('transform');
      }
    });

    it('hover.scale includes transform', () => {
      const css = hoverTokens.scale;
      if (typeof css === 'object') {
        expect(css).toHaveProperty('transform');
      }
    });

    it('hover.glow is a function that accepts color', () => {
      const glowFn = hoverTokens.glow;
      expect(typeof glowFn).toBe('function');
      if (typeof glowFn === 'function') {
        const result = glowFn('#ff0000');
        expect(result).toHaveProperty('filter');
      }
    });
  });
});

describe('TokenResolver', () => {
  describe('resolveTokens', () => {
    it('returns empty object for undefined tokens', () => {
      const result = resolveTokens(undefined);
      expect(result).toEqual({});
    });

    it('resolves single shadow token', () => {
      const result = resolveTokens({ shadow: 'lg' });
      expect(result).toHaveProperty('boxShadow');
    });

    it('resolves multiple tokens', () => {
      const result = resolveTokens({
        shadow: 'md',
        radius: 'lg',
        borderWidth: '2',
      });
      expect(result).toHaveProperty('boxShadow');
      expect(result).toHaveProperty('borderRadius');
      expect(result).toHaveProperty('borderWidth');
    });

    it('resolves glow shadow with primary color', () => {
      const result = resolveTokens(
        { shadow: 'glow' },
        { primaryColor: '#ff0000' }
      );
      expect(result.boxShadow).toContain('255');
    });

    it('applies hover styles when isHovered is true', () => {
      const result = resolveTokens(
        { hover: 'scale' },
        { isHovered: true }
      );
      expect(result).toHaveProperty('transform');
    });

    it('does not apply hover styles when isHovered is false', () => {
      const result = resolveTokens(
        { hover: 'scale' },
        { isHovered: false }
      );
      expect(result.transform).toBeUndefined();
    });
  });

  describe('resolveShadow', () => {
    it('returns boxShadow: none for shadow: none', () => {
      const result = resolveShadow('none');
      expect(result.boxShadow).toBe('none');
    });

    it('returns correct shadow for each preset', () => {
      const sm = resolveShadow('sm');
      const lg = resolveShadow('lg');
      
      expect(sm.boxShadow).not.toBe(lg.boxShadow);
    });
  });

  describe('resolveRadius', () => {
    it('returns correct radius for each preset', () => {
      const sm = resolveRadius('sm');
      const full = resolveRadius('full');
      
      expect(sm.borderRadius).toBe('4px');
      expect(full.borderRadius).toBe('9999px');
    });
  });
});

describe('hexToRgba', () => {
  it('converts hex to rgba', () => {
    const result = hexToRgba('#ff0000', 0.5);
    expect(result).toBe('rgba(255, 0, 0, 0.5)');
  });

  it('handles HSL colors', () => {
    const result = hexToRgba('hsl(270 50% 50%)', 0.5);
    expect(result).toContain('hsla');
    expect(result).toContain('0.5');
  });

  it('handles rgb colors', () => {
    const result = hexToRgba('rgb(100, 150, 200)', 0.5);
    expect(result).toContain('rgba');
    expect(result).toContain('0.5');
  });

  it('returns fallback for invalid hex', () => {
    const result = hexToRgba('invalid', 0.5);
    expect(result).toContain('rgba(139, 92, 246');
  });
});
