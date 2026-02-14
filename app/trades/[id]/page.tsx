import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteTrade } from "@/app/trades/actions";
import { TradeDeleteForm } from "@/components/trade-delete-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTradeDetail } from "@/lib/trades/queries";

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

function calculatePnl(
  direction: "long" | "short" | null,
  entryPrice: number | null,
  exitPrice: number | null,
  quantity: number | null,
) {
  if (
    !direction ||
    entryPrice === null ||
    exitPrice === null ||
    quantity === null
  ) {
    return null;
  }
  if (direction === "long") {
    return (exitPrice - entryPrice) * quantity;
  }
  return (entryPrice - exitPrice) * quantity;
}

export default async function TradeDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const trade = await getTradeDetail(params.id);

  if (!trade) {
    notFound();
  }

  const pnl = calculatePnl(
    trade.direction,
    trade.entryPrice,
    trade.exitPrice,
    trade.quantity,
  );

  return (
    <main className="mx-auto w-full max-w-2xl p-6 md:p-10">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button asChild variant="ghost">
          <Link href="/trades">뒤로가기</Link>
        </Button>
        <TradeDeleteForm tradeId={trade.id} action={deleteTrade} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{trade.symbol ?? "종목 없음"}</CardTitle>
          <CardDescription>
            {trade.direction === "long" ? "롱" : "숏"} 거래 ·{" "}
            {formatDateTime(trade.createdAt)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <p>진입가: {formatNumber(trade.entryPrice)}</p>
            <p>청산가: {formatNumber(trade.exitPrice)}</p>
            <p>수량: {formatNumber(trade.quantity)}</p>
            <p>손익: {pnl === null ? "-" : pnl.toLocaleString("ko-KR")}</p>
            <p>진입 시각: {formatDateTime(trade.entryAt)}</p>
            <p>청산 시각: {formatDateTime(trade.exitAt)}</p>
            <p>거래소: {trade.exchange ?? "-"}</p>
          </div>

          <div>
            <p className="mb-1 font-medium">전략 태그</p>
            <p className="text-muted-foreground">
              {trade.strategies.length > 0
                ? trade.strategies.join(", ")
                : "없음"}
            </p>
          </div>

          <div>
            <p className="mb-1 font-medium">감정 태그</p>
            <p className="text-muted-foreground">
              {trade.emotions.length > 0 ? trade.emotions.join(", ") : "없음"}
            </p>
          </div>

          <div>
            <p className="mb-1 font-medium">메모</p>
            <p className="text-muted-foreground">
              {trade.notes || "메모 없음"}
            </p>
          </div>
        </CardContent>
        <CardFooter />
      </Card>
    </main>
  );
}
