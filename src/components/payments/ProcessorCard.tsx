import { ReactNode } from "react";
import { Check, Clock, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProcessorCardProps {
  name: string;
  description: string;
  logo: ReactNode;
  gradient: string;
  status: "connected" | "available" | "coming_soon";
  isConnecting?: boolean;
  onConnect?: () => void;
  onManage?: () => void;
  onCancel?: () => void;
  accountInfo?: string;
  logoStyle?: "default" | "branded";
}

export function ProcessorCard({
  name,
  description,
  logo,
  gradient,
  status,
  isConnecting,
  onConnect,
  onManage,
  onCancel,
  accountInfo,
  logoStyle = "default",
}: ProcessorCardProps) {
  const isComingSoon = status === "coming_soon";
  const isConnected = status === "connected";

  return (
    <div
      className={`relative overflow-hidden rounded-xl p-6 text-white shadow-lg transition-all hover:shadow-xl ${gradient} ${
        isComingSoon ? "opacity-70" : ""
      }`}
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center ${
              logoStyle === "branded" 
                ? "w-12 h-12 rounded-xl bg-white shadow-md" 
                : "w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm"
            }`}>
              {logo}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{name}</h3>
              <p className="text-sm text-white/70">{description}</p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          {isConnected ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm">
              <Check className="h-3.5 w-3.5" />
              <span>Connected</span>
            </div>
          ) : isComingSoon ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-sm text-white/70">
              <Clock className="h-3.5 w-3.5" />
              <span>Coming Soon</span>
            </div>
          ) : null}

          {isConnected && accountInfo && (
            <p className="text-sm text-white/60 mt-2 font-mono">
              {accountInfo}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Button
              onClick={onManage}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
            >
              Manage
            </Button>
          ) : isConnecting ? (
            <>
              <Button
                disabled
                className="flex-1 bg-white/20 text-white border-0"
              >
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </Button>
              <Button
                onClick={onCancel}
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </>
          ) : !isComingSoon ? (
            <Button
              onClick={onConnect}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
            >
              Connect
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              disabled
              className="flex-1 bg-white/10 text-white/50 border-0 cursor-not-allowed"
            >
              Coming Soon
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
