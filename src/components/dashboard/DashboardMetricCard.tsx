import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardMetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  gradient: "purple" | "pink" | "teal" | "blue" | "orange" | "green" | "red";
  actionLabel?: string;
  onAction?: () => void;
}

const gradients = {
  purple: "from-violet-600 via-purple-600 to-indigo-700",
  pink: "from-pink-500 via-rose-500 to-orange-500",
  teal: "from-emerald-600 via-teal-600 to-cyan-700",
  blue: "from-blue-500 via-blue-600 to-indigo-600",
  orange: "from-orange-500 via-amber-500 to-yellow-500",
  green: "from-emerald-500 via-teal-500 to-cyan-600",
  red: "from-violet-500 via-purple-500 to-fuchsia-600",
};

export function DashboardMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  actionLabel,
  onAction,
}: DashboardMetricCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradients[gradient]} p-6 text-white shadow-[0_8px_32px_rgba(0,0,0,0.2)]`}
    >
      {/* Glossy glass overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      
      {/* Background decorations */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/15 backdrop-blur-sm" />
      <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/10" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-white/90 drop-shadow-sm">{title}</span>
          <div className="p-2 rounded-lg bg-white/25 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
            <Icon className="h-5 w-5 text-white drop-shadow-sm" />
          </div>
        </div>

        <div className="mb-2">
          <div className="text-3xl sm:text-4xl font-bold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">{value}</div>
          <p className="text-sm text-white/80 mt-1">{subtitle}</p>
        </div>

        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
