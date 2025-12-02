import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export function MetricCard({ title, value, icon: Icon, trend, trendUp }: MetricCardProps) {
  return (
    <Card className="card-hover group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-2 sm:px-6 pt-2 sm:pt-6">
        <CardTitle className="text-[9px] sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </CardTitle>
        <div className="p-1 sm:p-2 rounded-md sm:rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="relative px-2 sm:px-6 pb-2 sm:pb-6">
        <div className="text-sm sm:text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
          {value}
        </div>
        {trend && (
          <p className={`text-[8px] sm:text-xs font-medium mt-0.5 sm:mt-1 flex items-center gap-0.5 sm:gap-1 ${trendUp ? 'text-success' : 'text-destructive'}`}>
            <span className="hidden sm:inline">{trend}</span>
            <span className="sm:hidden">{trend.split(' ')[0]}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
