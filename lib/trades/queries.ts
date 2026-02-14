import { createClient } from "@/lib/supabase/server";
import type {
  EmotionOption,
  NameRow,
  NameSource,
  StrategyOption,
  TradeDetail,
  TradeDetailRow,
  TradeFilterInput,
  TradeListItem,
  TradeListRow,
} from "@/lib/trades/types";

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractName(source: NameSource) {
  if (!source) {
    return null;
  }
  if (Array.isArray(source)) {
    return source[0]?.name ?? null;
  }
  return source.name ?? null;
}

export async function getTradeOptions() {
  const supabase = await createClient();

  const [{ data: strategies, error: strategiesError }, { data: emotions, error: emotionsError }] =
    await Promise.all([
      supabase.from("strategies").select("id,name").order("name", { ascending: true }),
      supabase.from("emotions").select("id,name").order("name", { ascending: true }),
    ]);

  if (strategiesError || emotionsError) {
    return {
      strategies: [] as StrategyOption[],
      emotions: [] as EmotionOption[],
    };
  }

  return {
    strategies: (strategies ?? []) as StrategyOption[],
    emotions: (emotions ?? []) as EmotionOption[],
  };
}

export async function getTrades(filters: TradeFilterInput) {
  const supabase = await createClient();

  let tickerIdFilter: string[] | null = null;

  if (filters.symbol) {
    const { data: tickers } = await supabase
      .from("tickers")
      .select("id")
      .ilike("symbol", `%${filters.symbol.trim().toUpperCase()}%`)
      .limit(100);

    tickerIdFilter = (tickers ?? []).map((ticker) => ticker.id);
    if (tickerIdFilter.length === 0) {
      return [] as TradeListItem[];
    }
  }

  let query = supabase.from("trades").select(
    `
      id,
      direction,
      entry_price,
      exit_price,
      quantity,
      entry_at,
      created_at,
      ticker_id,
      tickers (
        symbol
      )
    `,
  );

  if (filters.direction && filters.direction !== "all") {
    query = query.eq("direction", filters.direction);
  }

  if (filters.from) {
    query = query.gte("entry_at", filters.from);
  }

  if (filters.to) {
    query = query.lte("entry_at", `${filters.to}T23:59:59`);
  }

  if (tickerIdFilter) {
    query = query.in("ticker_id", tickerIdFilter);
  }

  const { data } = await query
    .order("entry_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as TradeListRow[];

  return rows.map((row) => ({
    id: row.id,
    direction: row.direction,
    entryPrice: toNumberOrNull(row.entry_price),
    exitPrice: toNumberOrNull(row.exit_price),
    quantity: toNumberOrNull(row.quantity),
    entryAt: row.entry_at,
    createdAt: row.created_at,
    symbol: Array.isArray(row.tickers)
      ? row.tickers[0]?.symbol ?? null
      : row.tickers?.symbol ?? null,
  })) as TradeListItem[];
}

export async function getTradeDetail(tradeId: string) {
  const supabase = await createClient();

  const { data: trade } = await supabase
    .from("trades")
    .select(
      `
      id,
      direction,
      entry_price,
      exit_price,
      quantity,
      entry_at,
      exit_at,
      notes,
      created_at,
      tickers (
        symbol,
        exchange
      )
    `,
    )
    .eq("id", tradeId)
    .maybeSingle();

  if (!trade) {
    return null;
  }
  const tradeRow = trade as TradeDetailRow;
  const ticker = Array.isArray(tradeRow.tickers)
    ? tradeRow.tickers[0]
    : tradeRow.tickers;

  const [{ data: strategyRows }, { data: emotionRows }] = await Promise.all([
    supabase
      .from("trade_strategies")
      .select("strategies(name)")
      .eq("trade_id", tradeId),
    supabase
      .from("trade_emotions")
      .select("emotions(name)")
      .eq("trade_id", tradeId),
  ]);

  const strategyNames = ((strategyRows ?? []) as NameRow[])
    .map((row) => extractName(row.strategies))
    .filter((name): name is string => Boolean(name));

  const emotionNames = ((emotionRows ?? []) as NameRow[])
    .map((row) => extractName(row.emotions))
    .filter((name): name is string => Boolean(name));

  return {
    id: tradeRow.id,
    direction: tradeRow.direction,
    entryPrice: toNumberOrNull(tradeRow.entry_price),
    exitPrice: toNumberOrNull(tradeRow.exit_price),
    quantity: toNumberOrNull(tradeRow.quantity),
    entryAt: tradeRow.entry_at,
    exitAt: tradeRow.exit_at,
    notes: tradeRow.notes,
    createdAt: tradeRow.created_at,
    symbol: ticker?.symbol ?? null,
    exchange: ticker?.exchange ?? null,
    strategies: strategyNames,
    emotions: emotionNames,
  } as TradeDetail;
}
