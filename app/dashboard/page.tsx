import Link from "next/link";

import { AppSidebar } from "@/components/app-sidebar";
import { TradeOverviewCharts } from "@/components/trade-overview-charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getTrades } from "@/lib/trades/queries";
import type { TradeFilterInput, TradeListItem } from "@/lib/trades/types";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

function calcPnl(trade: TradeListItem) {
  if (
    trade.direction === null ||
    trade.entryPrice === null ||
    trade.exitPrice === null ||
    trade.quantity === null
  ) {
    return null;
  }

  if (trade.direction === "long") {
    return (trade.exitPrice - trade.entryPrice) * trade.quantity;
  }
  return (trade.entryPrice - trade.exitPrice) * trade.quantity;
}

function getTradeDate(trade: TradeListItem) {
  const value = trade.entryAt ?? trade.createdAt;
  return value ? new Date(value) : null;
}

function filterLastThreeMonths(trades: TradeListItem[]) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  return trades.filter((trade) => {
    const date = getTradeDate(trade);
    return date !== null && date >= from;
  });
}

function filterLastSixMonths(trades: TradeListItem[]) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  return trades.filter((trade) => {
    const date = getTradeDate(trade);
    return date !== null && date >= from;
  });
}

function buildCumulativeRateSeries(trades: TradeListItem[]) {
  const sorted = [...trades].sort((a, b) => {
    const aTime = getTradeDate(a)?.getTime() ?? 0;
    const bTime = getTradeDate(b)?.getTime() ?? 0;
    return aTime - bTime;
  });

  let cumulativePnl = 0;
  let cumulativeCapital = 0;

  return sorted.slice(-20).map((trade, index) => {
    const pnl = calcPnl(trade);
    const capital =
      trade.entryPrice !== null && trade.quantity !== null
        ? Math.abs(trade.entryPrice * trade.quantity)
        : 0;

    if (pnl !== null) {
      cumulativePnl += pnl;
    }
    cumulativeCapital += capital;

    const rate =
      cumulativeCapital > 0 ? (cumulativePnl / cumulativeCapital) * 100 : 0;

    return {
      index: index + 1,
      label: `${index + 1}`,
      rate: Number(rate.toFixed(2)),
    };
  });
}

function buildMonthlyWinRateSeries(trades: TradeListItem[]) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: `${d.getMonth() + 1}월`,
    };
  });

  const stats = new Map(
    months.map((month) => [month.key, { total: 0, win: 0 }]),
  );

  for (const trade of trades) {
    const date = getTradeDate(trade);
    if (!date) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const pnl = calcPnl(trade);
    if (pnl === null || !stats.has(key)) continue;

    const month = stats.get(key)!;
    month.total += 1;
    if (pnl > 0) {
      month.win += 1;
    }
  }

  return months.map((month) => {
    const { total, win } = stats.get(month.key)!;
    return {
      month: month.label,
      total,
      win,
      winRate: total > 0 ? Number(((win / total) * 100).toFixed(1)) : 0,
    };
  });
}

export default async function DashboardPage(props: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    direction?: "all" | "long" | "short";
    symbol?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const filters: TradeFilterInput = {
    from: searchParams.from,
    to: searchParams.to,
    direction: searchParams.direction ?? "all",
    symbol: searchParams.symbol ?? "",
  };

  const trades = await getTrades(filters);
  const pnlTrades = filterLastThreeMonths(trades);
  const winRateTrades = filterLastSixMonths(trades);
  const cumulative = buildCumulativeRateSeries(pnlTrades);
  const monthlyWinRate = buildMonthlyWinRateSeries(winRateTrades);

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
              <h1 className="text-base font-medium">트레이딩 대시보드</h1>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
            <TradeOverviewCharts
              cumulative={cumulative}
              monthlyWinRate={monthlyWinRate}
            />

            <Card>
              <CardHeader>
                <CardTitle>필터</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="grid grid-cols-1 gap-3 md:grid-cols-5">
                  <div>
                    <label
                      htmlFor="from"
                      className="mb-1 block text-xs text-muted-foreground"
                    >
                      시작일
                    </label>
                    <input
                      id="from"
                      name="from"
                      type="date"
                      defaultValue={filters.from}
                      className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="to"
                      className="mb-1 block text-xs text-muted-foreground"
                    >
                      종료일
                    </label>
                    <input
                      id="to"
                      name="to"
                      type="date"
                      defaultValue={filters.to}
                      className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="direction"
                      className="mb-1 block text-xs text-muted-foreground"
                    >
                      방향
                    </label>
                    <select
                      id="direction"
                      name="direction"
                      defaultValue={filters.direction ?? "all"}
                      className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                    >
                      <option value="all">전체</option>
                      <option value="long">롱</option>
                      <option value="short">숏</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="symbol"
                      className="mb-1 block text-xs text-muted-foreground"
                    >
                      티커
                    </label>
                    <input
                      id="symbol"
                      name="symbol"
                      type="text"
                      defaultValue={filters.symbol}
                      placeholder="예: AAPL"
                      className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full">
                      필터 적용
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card id="trades-list">
              <CardHeader>
                <CardTitle>트레이드 리스트</CardTitle>
              </CardHeader>
              <CardContent>
                {trades.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    아직 기록된 거래가 없어요. 첫 거래를 남겨 보세요.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-205 text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-2">티커</th>
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
                        {trades.map((trade) => {
                          const pnl = calcPnl(trade);
                          return (
                            <tr key={trade.id} className="border-b">
                              <td className="py-2">{trade.symbol ?? "-"}</td>
                              <td className="py-2">
                                {trade.direction === "long" ? "롱" : "숏"}
                              </td>
                              <td className="py-2">
                                {formatNumber(trade.entryPrice)}
                              </td>
                              <td className="py-2">
                                {formatNumber(trade.exitPrice)}
                              </td>
                              <td className="py-2">
                                {formatNumber(trade.quantity)}
                              </td>
                              <td
                                className={`py-2 ${pnl !== null && pnl < 0 ? "text-red-500" : "text-emerald-600"}`}
                              >
                                {pnl === null
                                  ? "-"
                                  : pnl.toLocaleString("ko-KR")}
                              </td>
                              <td className="py-2">
                                {formatDateTime(trade.entryAt)}
                              </td>
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
