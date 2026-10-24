import type { PriceHistory, TrendSummary } from '@/types/finance';

/** Percent change of the last value relative to the first. Returns 0 for empty/zero-base input. */
export function pctChange(from: number, to: number): number {
  if (!from) return 0;
  return ((to - from) / from) * 100;
}

/** Period return (%) for a price history. */
export function periodReturn(history: PriceHistory): number {
  if (history.length < 2) return 0;
  return pctChange(history[0].close, history[history.length - 1].close);
}

export function highLow(history: PriceHistory): { high: number; low: number } {
  if (history.length === 0) return { high: 0, low: 0 };
  const closes = history.map((p) => p.close);
  return { high: Math.max(...closes), low: Math.min(...closes) };
}

export function averageVolume(history: PriceHistory): number {
  if (history.length === 0) return 0;
  return history.reduce((sum, p) => sum + p.volume, 0) / history.length;
}

/** Aggregates a history into the figures shown on summary and quarterly trend panels. */
export function summarizeHistory(history: PriceHistory): TrendSummary {
  const { high, low } = highLow(history);
  return {
    start: history[0]?.close ?? 0,
    end: history[history.length - 1]?.close ?? 0,
    returnPercent: periodReturn(history),
    high,
    low,
    averageVolume: averageVolume(history),
  };
}

/** Re-bases a history to % change from its first point, for cross-ticker comparison. */
export function normalize(history: PriceHistory): number[] {
  if (history.length === 0) return [];
  const base = history[0].close;
  return history.map((p) => pctChange(base, p.close));
}
