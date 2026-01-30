import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, loading, error } = useAuth();

  // Main app URL for login redirect
  const mainAppUrl = window.location.origin.replace(/:\d+$/, ':8080');

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-6">
          <div className="p-3 rounded-full bg-destructive/10">
            <LogIn className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">Authentication Error</h2>
          <p className="text-muted-foreground">{error.message}</p>
          <Button asChild>
            <a href={mainAppUrl}>Go to Login</a>
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6 max-w-md text-center p-8 bg-card rounded-lg border shadow-lg">
          <div className="p-4 rounded-full bg-primary/10">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Login Required</h2>
            <p className="text-muted-foreground">
              You need to be logged in to use the Funnel Builder.
              Please log in through the main application first.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <Button asChild size="lg">
              <a href={mainAppUrl}>
                <LogIn className="h-4 w-4 mr-2" />
                Go to Login
              </a>
            </Button>
            <p className="text-xs text-muted-foreground">
              You'll be redirected back to the builder after logging in.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
