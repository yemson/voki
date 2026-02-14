import Link from "next/link";

import { AppSidebar } from "@/components/app-sidebar";
import { DashboardRiskCards } from "@/components/dashboard-risk-cards";
import { TradeOverviewCharts } from "@/components/trade-overview-charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  buildCumulativeRateSeries,
  buildMonthlyWinRateSeries,
  calculateRiskSummary,
  calculateTradePnl,
  filterTradesByRecentDays,
} from "@/lib/trades/analytics";
import { getTrades } from "@/lib/trades/queries";
import type { TradeFilterInput } from "@/lib/trades/types";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const DASHBOARD_DAYS = 90;

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString("ko-KR");
}

function formatNumber(value: number | null) {
  if (value === null) {
    return "-";
  }
  return value.toLocaleString("ko-KR");
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const filters: TradeFilterInput = {
    direction: "all",
    symbol: "",
  };

  const trades = await getTrades(filters);
  const dashboardTrades = filterTradesByRecentDays(trades, DASHBOARD_DAYS);
  const recentTrades = dashboardTrades.slice(0, 5);

  const cumulative = buildCumulativeRateSeries(dashboardTrades);
  const monthlyWinRate = buildMonthlyWinRateSeries(dashboardTrades);
  const riskSummary = calculateRiskSummary(dashboardTrades);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <header className="flex h-(--header-height) items-center gap-2 border-b">
          <div className="flex w-full items-center gap-2 px-4 lg:px-6">
            <SidebarTrigger className="-ml-1" />
            <div>
              <h1 className="text-base font-medium">대시보드</h1>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
            <TradeOverviewCharts
              cumulative={cumulative}
              monthlyWinRate={monthlyWinRate}
            />

            <DashboardRiskCards summary={riskSummary} />

            <Card id="trades-list">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle>최근 거래 5개</CardTitle>
                <Button asChild size="sm" variant="outline">
                  <Link href="/trades">전체 보기</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentTrades.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    최근 90일에 기록된 거래가 없어요. 새 거래를 남겨 보세요.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-205 text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-2">종목</th>
                          <th className="py-2">방향</th>
                          <th className="py-2">진입가</th>
                          <th className="py-2">청산가</th>
                          <th className="py-2">수량</th>
                          <th className="py-2">손익</th>
                          <th className="py-2">진입 시각</th>
                          <th className="py-2">상세</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTrades.map((trade) => {
                          const pnl = calculateTradePnl(trade);
                          const rowClassName =
                            pnl !== null && pnl < 0
                              ? "border-b bg-red-50/70"
                              : pnl !== null && pnl > 0
                                ? "border-b bg-emerald-50/70"
                                : "border-b";

                          return (
                            <tr key={trade.id} className={rowClassName}>
                              <td className="py-2">{trade.symbol ?? "-"}</td>
                              <td className="py-2">
                                {trade.direction === "long" ? "롱" : "숏"}
                              </td>
                              <td className="py-2">{formatNumber(trade.entryPrice)}</td>
                              <td className="py-2">{formatNumber(trade.exitPrice)}</td>
                              <td className="py-2">{formatNumber(trade.quantity)}</td>
                              <td
                                className={`py-2 ${
                                  pnl !== null && pnl < 0
                                    ? "text-red-500"
                                    : pnl !== null && pnl > 0
                                      ? "text-emerald-600"
                                      : "text-muted-foreground"
                                }`}
                              >
                                {pnl === null ? "-" : pnl.toLocaleString("ko-KR")}
                              </td>
                              <td className="py-2">{formatDateTime(trade.entryAt)}</td>
                              <td className="py-2">
                                <Button asChild size="sm" variant="outline">
                                  <Link href={`/trades/${trade.id}`}>보기</Link>
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
