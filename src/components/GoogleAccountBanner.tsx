import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, LogOut, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface GoogleAccountBannerProps {
  teamId: string;
  isConnected: boolean;
  connectedEmail?: string | null;
  connectedAt?: string | null;
  onUpdate: () => void;
}

const POPUP_LOADING_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Connecting to Google...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: #f8fafc;
    }
    .loader {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <p>Connecting to Google...</p>
  </div>
</body>
</html>
`;

export function GoogleAccountBanner({
  teamId,
  isConnected,
  connectedEmail,
  connectedAt,
  onUpdate,
}: GoogleAccountBannerProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);

    const popup = window.open(
      "",
      "google_oauth",
      "width=500,height=600,menubar=no,toolbar=no"
    );

    if (!popup) {
      toast({
        title: "Popup Blocked",
        description: "Please allow popups for this site.",
        variant: "destructive",
      });
      setIsConnecting(false);
      return;
    }

    popup.document.write(POPUP_LOADING_HTML);

    try {
      const { data, error } = await supabase.functions.invoke(
        "google-connect-feature",
        {
          body: { teamId, feature: "signin" },
        }
      );

      if (error || !data?.authUrl) {
        popup.close();
        toast({
          title: "Connection Failed",
          description: error?.message || "Could not start Google connection.",
          variant: "destructive",
        });
        setIsConnecting(false);
        return;
      }

      popup.location.href = data.authUrl;

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "google-oauth-success") {
          window.removeEventListener("message", handleMessage);
          popup.close();
          toast({ title: "Google Connected", description: "Your Google account is now linked." });
          onUpdate();
          setIsConnecting(false);
        } else if (event.data?.type === "google-oauth-error") {
          window.removeEventListener("message", handleMessage);
          popup.close();
          toast({
            title: "Connection Failed",
            description: event.data.error || "OAuth failed.",
            variant: "destructive",
          });
          setIsConnecting(false);
        }
      };

      window.addEventListener("message", handleMessage);

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener("message", handleMessage);
          setIsConnecting(false);
        }
      }, 500);

      setTimeout(() => {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
        if (!popup.closed) popup.close();
        setIsConnecting(false);
      }, 120000);
    } catch (err) {
      popup.close();
      toast({
        title: "Error",
        description: "Failed to connect to Google.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  }, [teamId, toast, onUpdate]);

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("team_integrations")
        .delete()
        .eq("team_id", teamId)
        .eq("integration_type", "google");
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Google Disconnected", description: "Your Google account has been unlinked." });
      onUpdate();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to disconnect.", variant: "destructive" });
    },
  });

  return (
    <Card className={`border-2 transition-all ${isConnected ? "border-success/30 bg-success/5" : "border-primary/20 bg-primary/5"}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left: Logo + Info */}
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border">
              <img
                src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png"
                alt="Google"
                className="h-9 w-9"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-foreground">Google Account</h3>
                {isConnected && (
                  <Badge variant="secondary" className="bg-success/10 text-success border-0">
                    <Check className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                )}
              </div>
              {isConnected && connectedEmail ? (
                <p className="text-sm text-muted-foreground mt-0.5">
                  Signed in as <span className="font-medium text-foreground">{connectedEmail}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-0.5">
                  Connect your Google identity to enable integrations below
                </p>
              )}
            </div>
          </div>

          {/* Right: Action */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <LogOut className="h-4 w-4" />
                    Disconnect
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect Google Account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will disable all Google integrations (Sheets, Calendar, Drive, Forms) for this team.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => disconnectMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Disconnect
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="gap-2"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <img
                      src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png"
                      alt=""
                      className="h-4 w-4"
                    />
                    Sign in with Google
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
