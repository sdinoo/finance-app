import { getCompany } from '@/config/markets';
import type { MarketState, PriceHistory, Quote } from '@/types/finance';

/**
 * Structural subsets of the yahoo-finance2 result types. Normalizers depend on these
 * instead of the library, so they stay pure and are trivially testable with plain objects.
 */
export interface RawQuote {
  symbol: string;
  shortName?: string;
  currency?: string;
  marketState?: string;
  regularMarketPrice?: number;
  regularMarketPreviousClose?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  regularMarketTime?: Date | number | string;
}

export interface RawBar {
  date: Date;
  close: number | null;
  volume: number | null;
}

const MARKET_STATES: Record<string, MarketState> = {
  PREPRE: 'PRE',
  PRE: 'PRE',
  REGULAR: 'REGULAR',
  POST: 'POST',
  POSTPOST: 'POST',
  CLOSED: 'CLOSED',
};

export const toMarketState = (raw: string | undefined): MarketState =>
  (raw && MARKET_STATES[raw]) || 'CLOSED';

const round = (value: number, digits = 2): number => Number(value.toFixed(digits));

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/** Returns null when the quote has no usable price (delisted symbol, halted feed). */
export function normalizeQuote(raw: RawQuote): Quote | null {
  const price = raw.regularMarketPrice;
  if (!isFiniteNumber(price)) return null;

  const change = isFiniteNumber(raw.regularMarketChange) ? raw.regularMarketChange : undefined;
  const previousClose = isFiniteNumber(raw.regularMarketPreviousClose)
    ? raw.regularMarketPreviousClose
    : change !== undefined
      ? price - change
      : price;
  const resolvedChange = change ?? price - previousClose;
  const changePercent = isFiniteNumber(raw.regularMarketChangePercent)
    ? raw.regularMarketChangePercent
    : previousClose
      ? (resolvedChange / previousClose) * 100
      : 0;
  const time = raw.regularMarketTime ? new Date(raw.regularMarketTime) : new Date();

  return {
    symbol: raw.symbol,
    name: getCompany(raw.symbol)?.name ?? raw.shortName ?? raw.symbol,
    currency: raw.currency ?? 'USD',
    marketState: toMarketState(raw.marketState),
    price: round(price),
    previousClose: round(previousClose),
    change: round(resolvedChange),
    changePercent: round(changePercent),
    dayHigh: round(isFiniteNumber(raw.regularMarketDayHigh) ? raw.regularMarketDayHigh : price),
    dayLow: round(isFiniteNumber(raw.regularMarketDayLow) ? raw.regularMarketDayLow : price),
    volume: isFiniteNumber(raw.regularMarketVolume) ? raw.regularMarketVolume : 0,
    updatedAt: time.toISOString(),
  };
}

/** Drops bars with a missing close (Yahoo emits nulls during halts), sorts ascending. */
export function normalizeHistory(bars: RawBar[]): PriceHistory {
  return bars
    .filter((bar): bar is RawBar & { close: number } => isFiniteNumber(bar.close))
    .map((bar) => ({
      time: bar.date.toISOString(),
      close: round(bar.close),
      volume: isFiniteNumber(bar.volume) ? bar.volume : 0,
    }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

/** Calendar date (YYYY-MM-DD) of an instant in the given IANA time zone. */
function localDate(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date(iso));
}

/**
 * Keeps only the most recent trading session. Requesting a few days of intraday bars and
 * trimming here makes the "today" view correct on weekends, holidays and before the open.
 */
export function lastSession(history: PriceHistory, timeZone = 'America/New_York'): PriceHistory {
  if (history.length === 0) return history;
  const day = localDate(history[history.length - 1].time, timeZone);
  return history.filter((point) => localDate(point.time, timeZone) === day);
}
