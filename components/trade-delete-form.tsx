"use client";

import { Button } from "@/components/ui/button";

interface TradeDeleteFormProps {
  tradeId: string;
  action: (formData: FormData) => Promise<void>;
}

export function TradeDeleteForm({ tradeId, action }: TradeDeleteFormProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm("이 거래를 삭제할까요? 삭제하면 되돌릴 수 없어요.");
        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="trade_id" value={tradeId} />
      <Button type="submit" variant="destructive">
        거래 삭제
      </Button>
    </form>
  );
}
