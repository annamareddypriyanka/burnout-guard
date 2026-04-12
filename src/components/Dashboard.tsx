import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCheckIns, getRiskLevel, getRiskLabel, clearCheckIns, type CheckInData } from "@/lib/burnout";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, Trash2, TrendingDown, TrendingUp, Minus, Loader2 } from "lucide-react";

interface DashboardProps {
  refreshKey: number;
}

export function Dashboard({ refreshKey }: DashboardProps) {
  const { user } = useAuth();
  const [checkIns, setCheckIns] = useState<CheckInData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getCheckIns(user.uid).then((data) => {
      setCheckIns(data);
      setLoading(false);
    });
  }, [user, refreshKey]);

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-8 pb-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (checkIns.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-8 pb-8 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No check-ins yet. Complete your first one!</p>
        </CardContent>
      </Card>
    );
  }

  const latest = checkIns[checkIns.length - 1];
  const latestLevel = getRiskLevel(latest.burnoutScore);
  const colorClass = latestLevel === 'low' ? 'risk-low' : latestLevel === 'medium' ? 'risk-medium' : 'risk-high';
  const bgClass = latestLevel === 'low' ? 'bg-risk-low/10' : latestLevel === 'medium' ? 'bg-risk-medium/10' : 'bg-risk-high/10';

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (checkIns.length >= 2) {
    const recent = checkIns.slice(-3);
    const recentAvg = recent.reduce((s, c) => s + c.burnoutScore, 0) / recent.length;
    const older = checkIns.slice(-6, -3);
    if (older.length > 0) {
      const olderAvg = older.reduce((s, c) => s + c.burnoutScore, 0) / older.length;
      if (recentAvg > olderAvg + 0.5) trend = 'up';
      else if (recentAvg < olderAvg - 0.5) trend = 'down';
    }
  }

  const sparkData = checkIns.slice(-7);
  const maxScore = 6;

  const handleClear = async () => {
    if (!user) return;
    await clearCheckIns(user.uid);
    setCheckIns([]);
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Latest Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center w-16 h-16 rounded-full ${bgClass}`}>
              <span className={`text-2xl font-bold ${colorClass}`}>{latest.burnoutScore}</span>
            </div>
            <div>
              <p className={`font-semibold ${colorClass}`}>{getRiskLabel(latestLevel)}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(latest.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
              {trend === 'up' && <><TrendingUp className="h-4 w-4 text-destructive" /> Rising</>}
              {trend === 'down' && <><TrendingDown className="h-4 w-4 risk-low" /> Improving</>}
              {trend === 'stable' && <><Minus className="h-4 w-4" /> Stable</>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Recent Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-24">
            {sparkData.map((d, i) => {
              const height = Math.max(8, (d.burnoutScore / maxScore) * 100);
              const level = getRiskLevel(d.burnoutScore);
              const barBg = level === 'low' ? 'bg-risk-low' : level === 'medium' ? 'bg-risk-medium' : 'bg-risk-high';
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-md ${barBg} transition-all duration-300`}
                    style={{ height: `${height}%`, minHeight: 4 }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(d.timestamp).toLocaleDateString(undefined, { weekday: 'narrow' })}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-3">
            <span className="text-xs text-muted-foreground">{checkIns.length} check-in{checkIns.length !== 1 ? 's' : ''} total</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground h-auto p-0 hover:text-destructive"
              onClick={handleClear}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
