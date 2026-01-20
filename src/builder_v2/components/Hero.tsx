import type { CSSProperties, ReactNode } from 'react';

type HeroProps = {
  headline?: string;
  subheadline?: string;
  backgroundColor?: string;
  children?: ReactNode;
  /** When true, renders as transparent section without card styling */
  transparent?: boolean;
};

/**
 * Hero component - used for hero sections in funnels
 * 
 * In runtime mode (published funnels), this should render as a transparent
 * section that inherits the page background, not as a dark card.
 * 
 * The card styling (bg-gray-800, border-radius, shadow) should only apply
 * in the editor context where visual separation is helpful.
 */
export function Hero({
  headline = 'Hero headline',
  subheadline = 'Hero subheadline',
  backgroundColor,
  children,
  transparent = false,
}: HeroProps) {
  // In runtime/transparent mode, use minimal styling
  // In editor mode, use card styling for visual separation
  const style: CSSProperties = transparent
    ? {
        width: '100%',
        maxWidth: '672px',
        margin: '0 auto',
        textAlign: 'center' as const,
        padding: '24px',
      }
    : {
        maxWidth: '672px',
        width: '100%',
        margin: '0 auto',
        textAlign: 'center' as const,
      };

  // Apply CSS variable for background in editor mode
  const finalStyle: CSSProperties = !transparent && backgroundColor 
    ? { ...style, ['--builder-v2-hero-bg' as string]: backgroundColor }
    : style;

  return (
    <section
      className={`builder-v2-component builder-v2-component--hero${transparent ? ' builder-v2-component--hero-transparent' : ''}`}
      style={finalStyle}
      data-transparent={transparent}
    >
      <div className="builder-v2-component--hero-content">
        <h2 className="builder-v2-component--hero-headline">{headline}</h2>
        <p className="builder-v2-component--hero-subheadline">{subheadline}</p>
        {children}
      </div>
    </section>
  );
}
