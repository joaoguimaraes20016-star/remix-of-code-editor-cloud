import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EditorShellProps {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  leftWidth?: string;
  rightWidth?: string;
  className?: string;
  overlays?: ReactNode;
}

/**
 * @deprecated This EditorShell is deprecated. Use flow-canvas/builder/EditorShell instead.
 * This component is a layout shell only and is kept for backward compatibility.
 */
export function EditorShell({
  left,
  center,
  right,
  leftWidth,
  rightWidth,
  className,
  overlays,
}: EditorShellProps) {
  const style = {
    ...(leftWidth ? { '--editor-left-width': leftWidth } : null),
    ...(rightWidth ? { '--editor-right-width': rightWidth } : null),
  } as React.CSSProperties;

  return (
    <div className={cn('editor-shell', className)} style={style}>
      {/* Deprecation Banner */}
      <div className="absolute top-0 left-0 right-0 bg-amber-500/90 text-amber-950 px-4 py-1.5 text-xs font-medium text-center z-50">
        ⚠️ Legacy layout shell - use flow-canvas/builder for new implementations
      </div>
      <aside className="editor-shell__panel editor-shell__panel--left">{left}</aside>
      <main className="editor-shell__panel editor-shell__panel--center">{center}</main>
      <aside className="editor-shell__panel editor-shell__panel--right">{right}</aside>
      {overlays ? <div className="editor-shell__overlays">{overlays}</div> : null}
    </div>
  );
}
