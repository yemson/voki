import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RiskSummary } from "@/lib/trades/types";

interface DashboardRiskCardsProps {
  summary: RiskSummary;
}

function formatCurrency(value: number) {
  return value.toLocaleString("ko-KR");
}

export function DashboardRiskCards({ summary }: DashboardRiskCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            최대 연속 손실
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{summary.maxLossStreak}회</div>
          <p className="mt-1 text-xs text-muted-foreground">
            현재 연속 손실 {summary.latestLossStreak}회
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            최대 낙폭 (MDD)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-red-600">
            -{formatCurrency(summary.maxDrawdownAmount)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            고점 대비 {summary.maxDrawdownRate.toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            평균 손실금
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-red-600">
            -{formatCurrency(summary.averageLossAmount)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            손실 거래 {summary.lossTradeCount}건 기준
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
