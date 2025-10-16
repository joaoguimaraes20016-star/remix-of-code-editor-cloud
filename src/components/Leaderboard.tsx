import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LeaderboardEntry {
  name: string;
  sales: number;
  revenue: number;
  commission: number;
}

interface LeaderboardProps {
  title: string;
  entries: LeaderboardEntry[];
  type: 'closer' | 'setter';
}

export function Leaderboard({ title, entries, type }: LeaderboardProps) {
  const getMedalIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Award className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground font-semibold">#{index + 1}</span>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No {type}s yet. Start adding sales to see the leaderboard!
          </p>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <div
                key={entry.name}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8">
                    {getMedalIcon(index)}
                  </div>
                  <div>
                    <p className="font-semibold">{entry.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.sales} {entry.sales === 1 ? 'sale' : 'sales'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    ${entry.commission.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ${entry.revenue.toLocaleString()} revenue
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
