// src/components/automations/editor/PublishStatusBadge.tsx
import { cn } from "@/lib/utils";
import { Check, AlertCircle, CircleDot } from "lucide-react";
import type { PublishStatus } from "@/hooks/useAutomationVersioning";

interface PublishStatusBadgeProps {
  status: PublishStatus;
  version?: number | null;
  className?: string;
}

export function PublishStatusBadge({ status, version, className }: PublishStatusBadgeProps) {
  const config = {
    unpublished: {
      label: "Draft",
      icon: CircleDot,
      bgColor: "bg-yellow-500/10",
      textColor: "text-yellow-400",
      dotColor: "bg-yellow-400",
    },
    published: {
      label: version ? `v${version} • Live` : "Live",
      icon: Check,
      bgColor: "bg-green-500/10",
      textColor: "text-green-400",
      dotColor: "bg-green-400",
    },
    has_changes: {
      label: version ? `v${version} • Unsaved` : "Has Changes",
      icon: AlertCircle,
      bgColor: "bg-orange-500/10",
      textColor: "text-orange-400",
      dotColor: "bg-orange-400",
    },
  };

  const { label, icon: Icon, bgColor, textColor, dotColor } = config[status];

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        bgColor,
        textColor,
        className
      )}
    >
      <div className={cn("w-1.5 h-1.5 rounded-full", dotColor)} />
      <span>{label}</span>
    </div>
  );
}
