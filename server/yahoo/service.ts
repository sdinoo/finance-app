import { isKnownSymbol } from '@/config/markets';
import type { PriceHistory, Quote, ViewRange } from '@/types/finance';
import { TtlCache } from '../cache';
import type { YahooGateway } from './gateway';
import { lastSession, normalizeHistory, normalizeQuote } from './normalize';
import { TTL_MS, chartWindow } from './windows';

export class RequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'RequestError';
  }
}

/**
 * Orchestrates Yahoo access: validates against the company registry, fetches via the gateway,
 * normalizes into UI-ready types and caches. Adding a company is a one-line registry change.
 */
export class FinanceService {
  private readonly quoteCache = new TtlCache<Quote[]>();
  private readonly historyCache = new TtlCache<PriceHistory>();

  constructor(private readonly gateway: YahooGateway) {}

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    const unique = [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))];
    if (unique.length === 0) throw new RequestError('At least one symbol is required', 400);
    const unknown = unique.filter((s) => !isKnownSymbol(s));
    if (unknown.length > 0) throw new RequestError(`Unsupported symbols: ${unknown.join(', ')}`, 400);

    const key = [...unique].sort().join(',');
    const quotes = await this.quoteCache.getOrLoad(key, TTL_MS.quotes, async () => {
      const raw = await this.gateway.quotes(unique);
      return raw.map(normalizeQuote).filter((q): q is Quote => q !== null);
    });

    // Preserve the caller's ordering regardless of what Yahoo returned.
    return unique.flatMap((s) => quotes.filter((q) => q.symbol === s));
  }

  async getHistory(symbol: string, range: ViewRange): Promise<PriceHistory> {
    const normalized = symbol.trim().toUpperCase();
    if (!isKnownSymbol(normalized)) throw new RequestError(`Unsupported symbol: ${normalized}`, 400);

    return this.historyCache.getOrLoad(`${normalized}:${range}`, TTL_MS.history[range], async () => {
      const { bars, timeZone } = await this.gateway.bars(normalized, chartWindow(range));
      const history = normalizeHistory(bars);
      return range === 'today' ? lastSession(history, timeZone) : history;
    });
  }
}
