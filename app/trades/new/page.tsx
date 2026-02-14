import Link from "next/link";
import { TradeCreateForm } from "@/components/trade-create-form";
import { Button } from "@/components/ui/button";
import { createTrade } from "@/app/trades/actions";
import { getTradeOptions } from "@/lib/trades/queries";

export default async function NewTradePage() {
  const { strategies, emotions } = await getTradeOptions();

  return (
    <main className="mx-auto w-full max-w-2xl p-6 md:p-10">
      <div className="mb-4">
        <Button asChild variant="ghost">
          <Link href="/dashboard">대시보드로 돌아가기</Link>
        </Button>
      </div>
      <TradeCreateForm
        strategies={strategies}
        emotions={emotions}
        action={createTrade}
      />
    </main>
  );
}
