import React, { useMemo, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Code, AlertTriangle } from 'lucide-react';

export interface HTMLEmbedProps {
  code?: string;
  height?: string | number;
  width?: string | number;
  borderRadius?: number;
  sandbox?: boolean;
  allowScripts?: boolean;
  className?: string;
  isBuilder?: boolean;
}

export const HTMLEmbed: React.FC<HTMLEmbedProps> = ({
  code = '',
  height = 300,
  width = '100%',
  borderRadius = 12,
  sandbox = true,
  allowScripts = false,
  className,
  isBuilder = false,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [contentHeight, setContentHeight] = useState<number>(height as number);

  // Sanitize and prepare the HTML
  const preparedCode = useMemo(() => {
    if (!code) return '';
    
    // Wrap in basic HTML structure if not already complete
    if (!code.includes('<html') && !code.includes('<!DOCTYPE')) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * { box-sizing: border-box; }
            body { 
              margin: 0; 
              padding: 16px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
          </style>
        </head>
        <body>
          ${code}
        </body>
        </html>
      `;
    }
    return code;
  }, [code]);

  // Create blob URL for the iframe
  const srcDoc = useMemo(() => {
    if (!preparedCode) return undefined;
    return preparedCode;
  }, [preparedCode]);

  // Sandbox attributes
  const sandboxAttr = useMemo(() => {
    if (!sandbox) return undefined;
    const attrs = ['allow-same-origin'];
    if (allowScripts) attrs.push('allow-scripts');
    return attrs.join(' ');
  }, [sandbox, allowScripts]);

  // Empty state
  if (!code) {
    return (
      <div 
        className={cn(
          'flex flex-col items-center justify-center',
          'border-2 border-dashed rounded-xl',
          'bg-muted/30 border-muted-foreground/20',
          className
        )}
        style={{ 
          width, 
          height, 
          borderRadius 
        }}
      >
        <Code className="w-12 h-12 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground text-center px-4">
          {isBuilder 
            ? 'Enter HTML code in the settings panel' 
            : 'No HTML content'}
        </p>
      </div>
    );
  }

  // Builder preview with code snippet
  if (isBuilder) {
    return (
      <div 
        className={cn('relative overflow-hidden', className)}
        style={{ width, borderRadius }}
      >
        {/* Preview iframe */}
        <div 
          className="bg-muted/30 overflow-hidden"
          style={{ height, borderRadius }}
        >
          <iframe
            ref={iframeRef}
            srcDoc={srcDoc}
            sandbox={sandboxAttr}
            className="w-full h-full border-0"
            style={{ borderRadius }}
          />
        </div>
        
        {/* Code preview overlay */}
        <div 
          className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
          style={{ borderRadius }}
        >
          <Code className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Custom HTML Embed</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {code.length} characters
          </p>
        </div>
      </div>
    );
  }

  // Runtime render
  return (
    <div 
      className={cn('relative overflow-hidden', className)}
      style={{ width, borderRadius }}
    >
      {error ? (
        <div 
          className="flex flex-col items-center justify-center bg-destructive/10"
          style={{ height, borderRadius }}
        >
          <AlertTriangle className="w-8 h-8 text-destructive mb-2" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          srcDoc={srcDoc}
          sandbox={sandboxAttr}
          className="w-full border-0"
          style={{ 
            height: height === 'auto' ? contentHeight : height, 
            borderRadius 
          }}
          onError={() => setError('Failed to render HTML content')}
        />
      )}
    </div>
  );
};

export default HTMLEmbed;
