import { getCompany } from '@/config/markets';
import type { PriceHistory, Quote, ViewRange } from '@/types/finance';
import type { MarketDataProvider } from './types';

/** Small deterministic PRNG so mock data is stable across renders and tests. */
function seeded(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hash(text: string): number {
  return [...text].reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7);
}

const POINTS: Record<ViewRange, number> = { today: 78, week: 70, quarter: 63 };
const STEP_MS: Record<ViewRange, number> = {
  today: 5 * 60_000,
  week: 30 * 60_000,
  quarter: 24 * 3_600_000,
};
function basePrice(symbol: string): number {
  return 60 + (hash(symbol) % 340);
}

export function buildHistory(symbol: string, range: ViewRange, now = Date.now()): PriceHistory {
  const rand = seeded(hash(`${symbol}:${range}`));
  const count = POINTS[range];
  const step = STEP_MS[range];
  // Snap to the bar interval so every symbol shares identical timestamps, like real data.
  const end = Math.floor(now / step) * step;
  let price = basePrice(symbol);
  const history: PriceHistory = [];
  for (let i = 0; i < count; i += 1) {
    price = Math.max(1, price * (1 + (rand() - 0.5) * 0.012));
    history.push({
      time: new Date(end - (count - 1 - i) * step).toISOString(),
      close: Number(price.toFixed(2)),
      volume: Math.round(100_000 + rand() * 900_000),
    });
  }
  return history;
}

export const mockProvider: MarketDataProvider = {
  async getQuotes(symbols) {
    return symbols.map((symbol): Quote => {
      const history = buildHistory(symbol, 'today');
      const last = history[history.length - 1];
      const previousClose = history[0].close;
      const closes = history.map((p) => p.close);
      return {
        symbol,
        name: getCompany(symbol)?.name ?? symbol,
        currency: 'USD',
        marketState: 'CLOSED',
        price: last.close,
        previousClose,
        change: Number((last.close - previousClose).toFixed(2)),
        changePercent: Number((((last.close - previousClose) / previousClose) * 100).toFixed(2)),
        dayHigh: Math.max(...closes),
        dayLow: Math.min(...closes),
        volume: history.reduce((sum, p) => sum + p.volume, 0),
        updatedAt: last.time,
      };
    });
  },

  async getHistory(symbol, range) {
    return buildHistory(symbol, range);
  },
};
