
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle: string;
  gradient: string;
}

export const StatsCard = ({ title, value, subtitle, gradient }: StatsCardProps) => {
  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardContent className="p-0">
        <div className={`${gradient} p-1`}>
          <div className="bg-card p-6 rounded-sm">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
