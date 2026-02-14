"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { EmotionOption, StrategyOption } from "@/lib/trades/types";

interface TradeCreateFormProps {
  strategies: StrategyOption[];
  emotions: EmotionOption[];
  action: (
    prevState: { error?: string } | null,
    formData: FormData,
  ) => Promise<{ error?: string }>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "저장 중이에요" : "거래 저장"}
    </Button>
  );
}

export function TradeCreateForm({
  strategies,
  emotions,
  action,
}: TradeCreateFormProps) {
  const [state, formAction] = useActionState(action, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>새 거래 기록</CardTitle>
        <CardDescription>한 건씩 차분히 남기면 복기가 쉬워져요.</CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="symbol">티커</FieldLabel>
              <Input id="symbol" name="symbol" placeholder="예: AAPL" required />
            </Field>

            <Field>
              <FieldLabel htmlFor="direction">방향</FieldLabel>
              <select
                id="direction"
                name="direction"
                required
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                defaultValue="long"
              >
                <option value="long">롱</option>
                <option value="short">숏</option>
              </select>
            </Field>

            <Field>
              <FieldLabel htmlFor="entry_price">진입가</FieldLabel>
              <Input id="entry_price" name="entry_price" type="number" step="0.0001" />
            </Field>

            <Field>
              <FieldLabel htmlFor="exit_price">청산가</FieldLabel>
              <Input id="exit_price" name="exit_price" type="number" step="0.0001" />
            </Field>

            <Field>
              <FieldLabel htmlFor="quantity">수량</FieldLabel>
              <Input id="quantity" name="quantity" type="number" step="0.0001" required />
            </Field>

            <Field>
              <FieldLabel htmlFor="entry_at">진입 시각</FieldLabel>
              <Input id="entry_at" name="entry_at" type="datetime-local" required />
            </Field>

            <Field>
              <FieldLabel htmlFor="exit_at">청산 시각</FieldLabel>
              <Input id="exit_at" name="exit_at" type="datetime-local" />
            </Field>

            <Field>
              <FieldLabel htmlFor="notes">메모</FieldLabel>
              <textarea
                id="notes"
                name="notes"
                className="border-input bg-background min-h-24 rounded-md border px-3 py-2 text-sm"
                placeholder="복기 메모를 남겨 주세요"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="strategy_ids">전략 태그</FieldLabel>
              <select
                id="strategy_ids"
                name="strategy_ids"
                multiple
                className="border-input bg-background min-h-28 rounded-md border px-3 py-2 text-sm"
              >
                {strategies.map((strategy) => (
                  <option key={strategy.id} value={strategy.id}>
                    {strategy.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field>
              <FieldLabel htmlFor="emotion_ids">감정 태그</FieldLabel>
              <select
                id="emotion_ids"
                name="emotion_ids"
                multiple
                className="border-input bg-background min-h-28 rounded-md border px-3 py-2 text-sm"
              >
                {emotions.map((emotion) => (
                  <option key={emotion.id} value={emotion.id}>
                    {emotion.name}
                  </option>
                ))}
              </select>
            </Field>

            {state?.error && (
              <p className="text-center text-sm text-red-500">{state.error}</p>
            )}

            <Field>
              <SubmitButton />
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
