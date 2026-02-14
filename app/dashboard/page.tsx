import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTrades } from "@/lib/trades/queries";
import type { TradeFilterInput } from "@/lib/trades/types";
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

  return (
    <main className="mx-auto w-full max-w-6xl p-6 md:p-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">대시보드</h1>
          <p className="text-sm text-muted-foreground">
            {user.email} 계정으로 기록을 관리하고 있어요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/trades/new">새 거래 작성</Link>
          </Button>
          <form action={logout}>
            <Button type="submit" variant="outline">
              로그아웃
            </Button>
          </form>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>기본 필터</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <input type="hidden" name="direction" value={filters.direction ?? "all"} />
            <div>
              <label htmlFor="from" className="mb-1 block text-xs text-muted-foreground">
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
              <label htmlFor="to" className="mb-1 block text-xs text-muted-foreground">
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

      <Card>
        <CardHeader>
          <CardTitle>내 거래 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              아직 기록된 거래가 없어요. 첫 거래를 남겨 보세요.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2">티커</th>
                    <th className="py-2">방향</th>
                    <th className="py-2">진입가</th>
                    <th className="py-2">청산가</th>
                    <th className="py-2">수량</th>
                    <th className="py-2">진입 시각</th>
                    <th className="py-2">상세</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => (
                    <tr key={trade.id} className="border-b">
                      <td className="py-2">{trade.symbol ?? "-"}</td>
                      <td className="py-2">{trade.direction === "long" ? "롱" : "숏"}</td>
                      <td className="py-2">{formatNumber(trade.entryPrice)}</td>
                      <td className="py-2">{formatNumber(trade.exitPrice)}</td>
                      <td className="py-2">{formatNumber(trade.quantity)}</td>
                      <td className="py-2">{formatDateTime(trade.entryAt)}</td>
                      <td className="py-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/trades/${trade.id}`}>보기</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
