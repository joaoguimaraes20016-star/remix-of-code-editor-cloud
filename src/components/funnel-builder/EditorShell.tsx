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
      <aside className="editor-shell__panel editor-shell__panel--left">{left}</aside>
      <main className="editor-shell__panel editor-shell__panel--center">{center}</main>
      <aside className="editor-shell__panel editor-shell__panel--right">{right}</aside>
      {overlays ? <div className="editor-shell__overlays">{overlays}</div> : null}
    </div>
  );
}
