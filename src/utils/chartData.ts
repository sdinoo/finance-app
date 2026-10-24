import { COMPANIES, getCompany } from '@/config/markets';
import type { PriceHistory, TrendSummary } from '@/types/finance';
import { normalize, summarizeHistory } from './metrics';

const PALETTE = ['#0f62fe', '#8a3ffc', '#fa4d56', '#198038', '#b28600', '#009d9a', '#ee5396'];

/** Stable per-company colour (by registry position), so toggling companies never recolours the rest. */
export function symbolColor(symbol: string): string {
  const index = COMPANIES.findIndex((c) => c.symbol === symbol);
  return PALETTE[(index < 0 ? COMPANIES.length : index) % PALETTE.length];
}

export interface ComparisonRow {
  time: string;
  [symbol: string]: string | number;
}

/**
 * Merges per-company histories into one row per timestamp holding each company's
 * % change from its own first point. Aligning by timestamp (not array index) keeps the
 * chart correct if one company has a missing or extra bar.
 */
export function buildComparisonRows(histories: Record<string, PriceHistory>): ComparisonRow[] {
  const byTime = new Map<string, ComparisonRow>();
  for (const [symbol, history] of Object.entries(histories)) {
    const values = normalize(history);
    history.forEach((point, i) => {
      const row = byTime.get(point.time) ?? { time: point.time };
      row[symbol] = Number(values[i].toFixed(2));
      byTime.set(point.time, row);
    });
  }
  return [...byTime.values()].sort((a, b) => a.time.localeCompare(b.time));
}

export interface TrendRow {
  symbol: string;
  name: string;
  summary: TrendSummary;
}

/** One summary row per company with data, best performer first. */
export function buildTrendRows(histories: Record<string, PriceHistory>): TrendRow[] {
  return Object.entries(histories)
    .filter(([, history]) => history.length > 0)
    .map(([symbol, history]) => ({
      symbol,
      name: getCompany(symbol)?.name ?? symbol,
      summary: summarizeHistory(history),
    }))
    .sort((a, b) => b.summary.returnPercent - a.summary.returnPercent);
}
