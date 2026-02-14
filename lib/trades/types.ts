export type TradeDirection = "long" | "short";

export interface TradeFilterInput {
  from?: string;
  to?: string;
  direction?: "all" | TradeDirection;
  symbol?: string;
}

export interface TradeFormInput {
  symbol: string;
  direction: TradeDirection;
  entryPrice?: number;
  exitPrice?: number;
  quantity: number;
  entryAt: string;
  exitAt?: string;
  notes?: string;
  strategyIds: string[];
  emotionIds: string[];
}

export interface TradeListItem {
  id: string;
  direction: TradeDirection | null;
  entryPrice: number | null;
  exitPrice: number | null;
  quantity: number | null;
  entryAt: string | null;
  createdAt: string | null;
  symbol: string | null;
}

export interface TradeDetail {
  id: string;
  direction: TradeDirection | null;
  entryPrice: number | null;
  exitPrice: number | null;
  quantity: number | null;
  entryAt: string | null;
  exitAt: string | null;
  notes: string | null;
  createdAt: string | null;
  symbol: string | null;
  exchange: string | null;
  strategies: string[];
  emotions: string[];
}

export interface StrategyOption {
  id: string;
  name: string;
}

export interface EmotionOption {
  id: string;
  name: string;
}

export type TradeListRow = {
  id: string;
  direction: "long" | "short" | null;
  entry_price: number | string | null;
  exit_price: number | string | null;
  quantity: number | string | null;
  entry_at: string | null;
  created_at: string | null;
  tickers?: { symbol: string | null } | { symbol: string | null }[] | null;
};

export type TradeDetailRow = {
  id: string;
  direction: "long" | "short" | null;
  entry_price: number | string | null;
  exit_price: number | string | null;
  quantity: number | string | null;
  entry_at: string | null;
  exit_at: string | null;
  notes: string | null;
  created_at: string | null;
  tickers?:
    | { symbol: string | null; exchange: string | null }
    | { symbol: string | null; exchange: string | null }[]
    | null;
};

export type NameRow = {
  strategies?: { name: string | null } | { name: string | null }[] | null;
  emotions?: { name: string | null } | { name: string | null }[] | null;
};

export type NameSource =
  | { name: string | null }
  | { name: string | null }[]
  | null
  | undefined;
