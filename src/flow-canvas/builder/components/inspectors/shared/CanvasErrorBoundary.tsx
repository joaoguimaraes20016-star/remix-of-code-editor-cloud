/**
 * CanvasErrorBoundary - Error boundary for canvas/renderer components
 * 
 * Catches rendering errors in canvas components and displays a graceful fallback
 * instead of crashing the entire editor.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging
    console.error('[CanvasErrorBoundary] Caught error:', error);
    console.error('[CanvasErrorBoundary] Error info:', errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-destructive/5 border border-destructive/20 rounded-lg min-h-[120px]">
          <AlertTriangle className="w-8 h-8 text-destructive mb-3" />
          <p className="text-sm font-medium text-destructive mb-1">
            {this.props.fallbackMessage || 'Something went wrong'}
          </p>
          <p className="text-xs text-muted-foreground mb-3 text-center max-w-[280px]">
            {this.state.error?.message || 'An error occurred while rendering this component'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleReset}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper component for inline use with render props pattern
 */
export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallbackMessage?: string
) => {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <CanvasErrorBoundary fallbackMessage={fallbackMessage}>
      <WrappedComponent {...props} />
    </CanvasErrorBoundary>
  );
  
  WithErrorBoundary.displayName = `WithErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return WithErrorBoundary;
};
