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
    <Card className="transition-all hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
        <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
        <div className="text-lg md:text-2xl font-bold">{value}</div>
        {trend && (
          <p className={`text-[10px] md:text-xs ${trendUp ? 'text-accent' : 'text-destructive'} mt-0.5 md:mt-1`}>
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
