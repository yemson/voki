"use server";

import { createClient } from "@/lib/supabase/server";
import type { TradeDirection } from "@/lib/trades/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface TradeActionState {
  error?: string;
}

function parsePositiveNumber(raw: FormDataEntryValue | null) {
  if (raw === null || raw === "") {
    return undefined;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function parseDateTime(raw: FormDataEntryValue | null) {
  if (raw === null || raw === "") {
    return undefined;
  }
  const value = String(raw);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
}

function parseIdArray(raw: FormDataEntryValue | FormDataEntryValue[] | null) {
  if (!raw) {
    return [] as string[];
  }
  const values = Array.isArray(raw) ? raw : [raw];
  return values.map(String).filter(Boolean);
}

async function getOrCreateTickerId(symbol: string) {
  const supabase = await createClient();
  const normalized = symbol.trim().toUpperCase();

  const { data: found } = await supabase
    .from("tickers")
    .select("id")
    .eq("symbol", normalized)
    .maybeSingle();

  if (found?.id) {
    return found.id;
  }

  const { data: created, error } = await supabase
    .from("tickers")
    .insert({ symbol: normalized })
    .select("id")
    .single();

  if (error) {
    const { data: fallback } = await supabase
      .from("tickers")
      .select("id")
      .eq("symbol", normalized)
      .maybeSingle();
    return fallback?.id ?? null;
  }

  return created.id;
}

export async function createTrade(
  prevState: TradeActionState | null,
  formData: FormData,
): Promise<TradeActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요해요." };
  }

  const symbol = String(formData.get("symbol") ?? "")
    .trim()
    .toUpperCase();
  const direction = String(formData.get("direction") ?? "") as TradeDirection;
  const quantity = parsePositiveNumber(formData.get("quantity"));
  const entryPrice = parsePositiveNumber(formData.get("entry_price"));
  const exitPrice = parsePositiveNumber(formData.get("exit_price"));
  const entryAt = parseDateTime(formData.get("entry_at"));
  const exitAt = parseDateTime(formData.get("exit_at"));
  const notes = String(formData.get("notes") ?? "").trim();
  const strategyIds = parseIdArray(formData.getAll("strategy_ids"));
  const emotionIds = parseIdArray(formData.getAll("emotion_ids"));

  if (!symbol) {
    return { error: "종목을 입력해 주세요." };
  }
  if (!["long", "short"].includes(direction)) {
    return { error: "방향을 선택해 주세요." };
  }
  if (!quantity) {
    return { error: "수량은 0보다 커야 해요." };
  }
  if (entryPrice === null || exitPrice === null) {
    return { error: "가격은 0보다 커야 해요." };
  }
  if (!entryAt) {
    return { error: "진입 시각을 입력해 주세요." };
  }
  if (exitAt === null) {
    return { error: "청산 시각 형식이 올바르지 않아요." };
  }
  if (exitAt && entryAt && new Date(exitAt) < new Date(entryAt)) {
    return { error: "청산 시각은 진입 시각보다 빠를 수 없어요." };
  }

  if (strategyIds.length > 0) {
    const { data: validStrategies } = await supabase
      .from("strategies")
      .select("id")
      .in("id", strategyIds);
    if ((validStrategies ?? []).length !== strategyIds.length) {
      return { error: "전략 선택값이 올바르지 않아요." };
    }
  }

  if (emotionIds.length > 0) {
    const { data: validEmotions } = await supabase
      .from("emotions")
      .select("id")
      .in("id", emotionIds);
    if ((validEmotions ?? []).length !== emotionIds.length) {
      return { error: "감정 선택값이 올바르지 않아요." };
    }
  }

  const tickerId = await getOrCreateTickerId(symbol);
  if (!tickerId) {
    return { error: "종목을 저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
  }

  const { data: trade, error: tradeError } = await supabase
    .from("trades")
    .insert({
      user_id: user.id,
      ticker_id: tickerId,
      direction,
      entry_price: entryPrice,
      exit_price: exitPrice,
      quantity,
      entry_at: entryAt,
      exit_at: exitAt,
      notes: notes || null,
    })
    .select("id")
    .single();

  if (tradeError || !trade) {
    return { error: "거래를 저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
  }

  try {
    if (strategyIds.length > 0) {
      const { error } = await supabase.from("trade_strategies").insert(
        strategyIds.map((strategyId) => ({
          trade_id: trade.id,
          strategy_id: strategyId,
        })),
      );
      if (error) {
        throw error;
      }
    }

    if (emotionIds.length > 0) {
      const { error } = await supabase.from("trade_emotions").insert(
        emotionIds.map((emotionId) => ({
          trade_id: trade.id,
          emotion_id: emotionId,
        })),
      );
      if (error) {
        throw error;
      }
    }
  } catch {
    await supabase.from("trade_strategies").delete().eq("trade_id", trade.id);
    await supabase.from("trade_emotions").delete().eq("trade_id", trade.id);
    await supabase.from("trades").delete().eq("id", trade.id);
    return { error: "태그 저장 중 문제가 생겼어요. 다시 시도해 주세요." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/trades/new");
  redirect(`/trades/${trade.id}`);
}

export async function deleteTrade(formData: FormData) {
  const tradeId = String(formData.get("trade_id") ?? "");
  if (!tradeId) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  await supabase.from("trade_strategies").delete().eq("trade_id", tradeId);
  await supabase.from("trade_emotions").delete().eq("trade_id", tradeId);
  await supabase.from("trades").delete().eq("id", tradeId);

  revalidatePath("/dashboard");
  revalidatePath(`/trades/${tradeId}`);
  redirect("/dashboard");
}
