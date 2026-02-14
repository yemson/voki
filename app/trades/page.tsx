import Link from "next/link";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getTradesPage } from "@/lib/trades/queries";
import type { TradeFilterInput, TradeListItem } from "@/lib/trades/types";
import { createClient } from "@/lib/supabase/server";

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

function buildPageItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages] as (number | "...")[];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ] as (number | "...")[];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ] as (number | "...")[];
}

export default async function TradesPage(props: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    direction?: "all" | "long" | "short";
    symbol?: string;
    page?: string;
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

  const page = Number(searchParams.page ?? "1");
  const currentPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const pageSize = 10;

  const { items: trades, totalCount } = await getTradesPage(
    filters,
    currentPage,
    pageSize,
  );
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const fromCount = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toCount = Math.min(currentPage * pageSize, totalCount);

  const makePageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.direction && filters.direction !== "all") {
      params.set("direction", filters.direction);
    }
    if (filters.symbol?.trim()) params.set("symbol", filters.symbol.trim());
    params.set("page", String(nextPage));
    return `/trades?${params.toString()}`;
  };

  if (totalCount > 0 && currentPage > totalPages) {
    redirect(makePageHref(totalPages));
  }

  const pageItems = buildPageItems(currentPage, totalPages);

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
              <h1 className="text-base font-medium">거래 리스트</h1>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
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
                      종목
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

            <Card>
              <CardHeader className="space-y-3">
                <div className="flex flex-row items-center justify-between gap-2">
                  <CardTitle>전체 거래</CardTitle>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/trades/new">새 거래 작성</Link>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  총 {totalCount}건 중 {fromCount}-{toCount}건
                </p>
              </CardHeader>
              <CardContent>
                {trades.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    조건에 맞는 거래가 없어요. 필터를 바꿔 보세요.
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
                        {trades.map((trade) => {
                          const pnl = calcPnl(trade);
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
                <Pagination className="mt-4 justify-center">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href={hasPrev ? makePageHref(currentPage - 1) : "#"}
                        className={
                          !hasPrev ? "pointer-events-none opacity-50" : ""
                        }
                      />
                    </PaginationItem>
                    {pageItems.map((item, index) =>
                      item === "..." ? (
                        <PaginationItem key={`ellipsis-${index}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={`page-${item}`}>
                          <PaginationLink
                            href={makePageHref(item)}
                            isActive={item === currentPage}
                          >
                            {item}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    )}
                    <PaginationItem>
                      <PaginationNext
                        href={hasNext ? makePageHref(currentPage + 1) : "#"}
                        className={
                          !hasNext ? "pointer-events-none opacity-50" : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
