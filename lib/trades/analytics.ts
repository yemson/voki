import type {
  CumulativePoint,
  EquityPoint,
  MonthlyWinRatePoint,
  RiskAlert,
  RiskSummary,
  RiskThresholds,
  TradeListItem,
} from "@/lib/trades/types";

function safeDate(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function getTradeDate(trade: TradeListItem) {
  return safeDate(trade.entryAt ?? trade.createdAt);
}

export function calculateTradePnl(trade: TradeListItem) {
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

function tradeCapital(trade: TradeListItem) {
  if (trade.entryPrice === null || trade.quantity === null) {
    return 0;
  }
  return Math.abs(trade.entryPrice * trade.quantity);
}

export function filterTradesByRecentDays(
  trades: TradeListItem[],
  days: number,
  now = new Date(),
) {
  const from = new Date(now);
  from.setDate(from.getDate() - days);

  return trades.filter((trade) => {
    const date = getTradeDate(trade);
    return date !== null && date >= from;
  });
}

function sortByTradeDateAsc(trades: TradeListItem[]) {
  return [...trades].sort((a, b) => {
    const aTime = getTradeDate(a)?.getTime() ?? 0;
    const bTime = getTradeDate(b)?.getTime() ?? 0;
    return aTime - bTime;
  });
}

function sortByTradeDateDesc(trades: TradeListItem[]) {
  return [...trades].sort((a, b) => {
    const aTime = getTradeDate(a)?.getTime() ?? 0;
    const bTime = getTradeDate(b)?.getTime() ?? 0;
    return bTime - aTime;
  });
}

export function buildEquityCurve(trades: TradeListItem[]) {
  const sorted = sortByTradeDateAsc(trades);
  let cumulativePnl = 0;
  let cumulativeCapital = 0;

  return sorted.map((trade) => {
    const pnl = calculateTradePnl(trade);
    const capital = tradeCapital(trade);

    if (pnl !== null) {
      cumulativePnl += pnl;
    }
    cumulativeCapital += capital;

    const equity = cumulativePnl;
    const rate =
      cumulativeCapital > 0 ? (cumulativePnl / cumulativeCapital) * 100 : 0;

    const date = getTradeDate(trade)?.toISOString() ?? "";

    return {
      id: trade.id,
      date,
      cumulativePnl,
      cumulativeCapital,
      equity,
      rate: Number(rate.toFixed(2)),
    } as EquityPoint;
  });
}

export function buildCumulativeRateSeries(trades: TradeListItem[]) {
  const curve = buildEquityCurve(trades);
  return curve.map((point, index) => ({
    index: index + 1,
    label: point.date
      ? new Date(point.date).toLocaleDateString("ko-KR", {
          month: "numeric",
          day: "numeric",
        })
      : `${index + 1}`,
    rate: point.rate,
  })) as CumulativePoint[];
}

export function buildMonthlyWinRateSeries(trades: TradeListItem[]) {
  const monthlyStats = new Map<string, { label: string; total: number; win: number }>();

  for (const trade of trades) {
    const date = getTradeDate(trade);
    const pnl = calculateTradePnl(trade);
    if (!date || pnl === null || pnl === 0) continue;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyStats.has(key)) {
      monthlyStats.set(key, {
        label: `${date.getMonth() + 1}월`,
        total: 0,
        win: 0,
      });
    }

    const month = monthlyStats.get(key)!;
    month.total += 1;
    if (pnl > 0) {
      month.win += 1;
    }
  }

  return [...monthlyStats.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, stat]) => ({
      month: stat.label,
      total: stat.total,
      win: stat.win,
      winRate: stat.total > 0 ? Number(((stat.win / stat.total) * 100).toFixed(1)) : 0,
    })) as MonthlyWinRatePoint[];
}

export function calculateRiskSummary(trades: TradeListItem[]) {
  const sortedAsc = sortByTradeDateAsc(trades);
  const curve = buildEquityCurve(sortedAsc);

  let peak = 0;
  let maxDrawdownAmount = 0;
  let maxDrawdownRate = 0;
  let baselineCapital = 0;

  let maxLossStreak = 0;
  let currentLossStreak = 0;

  const lossValues: number[] = [];

  for (const trade of sortedAsc) {
    const pnl = calculateTradePnl(trade);
    if (pnl === null) continue;

    if (pnl < 0) {
      currentLossStreak += 1;
      maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      lossValues.push(Math.abs(pnl));
    } else if (pnl > 0) {
      currentLossStreak = 0;
    } else {
      currentLossStreak = 0;
    }

    if (baselineCapital === 0) {
      baselineCapital = tradeCapital(trade);
    }
  }

  for (const point of curve) {
    peak = Math.max(peak, point.equity);
    const drawdown = peak - point.equity;
    const denominator = Math.max(peak, baselineCapital, 1);
    const drawdownRate = (drawdown / denominator) * 100;

    if (drawdown > maxDrawdownAmount) {
      maxDrawdownAmount = drawdown;
      maxDrawdownRate = drawdownRate;
    }
  }

  const recent30 = filterTradesByRecentDays(trades, 30);
  const recent30LossValues = recent30
    .map((trade) => calculateTradePnl(trade))
    .filter((pnl): pnl is number => pnl !== null && pnl < 0)
    .map((pnl) => Math.abs(pnl));

  const averageLossAmount =
    lossValues.length > 0
      ? Number(
          (lossValues.reduce((sum, value) => sum + value, 0) / lossValues.length).toFixed(2),
        )
      : 0;

  const averageLossAmountLast30Days =
    recent30LossValues.length > 0
      ? Number(
          (
            recent30LossValues.reduce((sum, value) => sum + value, 0) /
            recent30LossValues.length
          ).toFixed(2),
        )
      : 0;

  const sortedDesc = sortByTradeDateDesc(trades);
  let latestLossStreak = 0;
  for (const trade of sortedDesc) {
    const pnl = calculateTradePnl(trade);
    if (pnl === null) continue;
    if (pnl < 0) {
      latestLossStreak += 1;
    } else {
      break;
    }
  }

  return {
    maxLossStreak,
    latestLossStreak,
    maxDrawdownAmount: Number(maxDrawdownAmount.toFixed(2)),
    maxDrawdownRate: Number(maxDrawdownRate.toFixed(2)),
    averageLossAmount,
    averageLossAmountLast30Days,
    lossTradeCount: lossValues.length,
  } as RiskSummary;
}

export function evaluateRiskAlerts(
  summary: RiskSummary,
  thresholds: RiskThresholds,
) {
  const alerts: RiskAlert[] = [];

  if (summary.maxLossStreak >= thresholds.maxLossStreak) {
    alerts.push({
      id: "loss-streak",
      title: `연속 손실이 ${summary.maxLossStreak}회예요`,
      description: "포지션 크기를 잠깐 줄이고 진입 기준을 다시 점검해 보세요.",
      href: "/trades",
      ctaLabel: "손실 구간 확인",
    });
  }

  if (summary.maxDrawdownRate >= thresholds.maxDrawdownRate) {
    alerts.push({
      id: "drawdown",
      title: `최대 낙폭이 ${summary.maxDrawdownRate.toFixed(1)}%예요`,
      description: "손실 상한을 먼저 정하고, 당분간 보수적으로 운용해 보세요.",
      href: "/trades",
      ctaLabel: "낙폭 구간 보기",
    });
  }

  if (
    summary.averageLossAmountLast30Days > 0 &&
    summary.averageLossAmount >=
      summary.averageLossAmountLast30Days * thresholds.averageLossMultiplier
  ) {
    alerts.push({
      id: "avg-loss",
      title: "평균 손실금이 빠르게 커지고 있어요",
      description: "최근 손실 거래를 먼저 복기하고, 손절 규칙을 다시 맞춰 보세요.",
      href: "/trades?direction=long",
      ctaLabel: "최근 손실 거래 보기",
    });
  }

  return alerts;
}

export function buildLossStreakMap(trades: TradeListItem[]) {
  const sortedDesc = sortByTradeDateDesc(trades);
  const streakById = new Map<string, number>();
  let currentStreak = 0;

  for (const trade of sortedDesc) {
    const pnl = calculateTradePnl(trade);
    if (pnl !== null && pnl < 0) {
      currentStreak += 1;
      streakById.set(trade.id, currentStreak);
      continue;
    }

    currentStreak = 0;
    streakById.set(trade.id, 0);
  }

  return streakById;
}
