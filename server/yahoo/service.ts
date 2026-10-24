import { isKnownSymbol, isValidSymbol, normalizeSymbol } from '@/config/markets';
import type { PriceHistory, Quote, ViewRange } from '@/types/finance';
import { TtlCache } from '../cache';
import { SymbolNotFoundError } from './errors';
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

/** History is cached per user-entered symbol, so the cache is bounded. */
const MAX_HISTORY_ENTRIES = 200;

/**
 * Orchestrates Yahoo access: validates input, fetches via the gateway, normalizes into
 * UI-ready types and caches. Quotes are limited to the company registry; history also
 * accepts any well-formed symbol so users can chart a company outside the registry.
 */
export class FinanceService {
  private readonly quoteCache = new TtlCache<Quote[]>();
  private readonly historyCache = new TtlCache<PriceHistory>(Date.now, MAX_HISTORY_ENTRIES);

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
    const normalized = normalizeSymbol(symbol);
    if (!isValidSymbol(normalized)) throw new RequestError(`Invalid symbol: ${symbol.trim() || '(empty)'}`, 400);

    try {
      return await this.historyCache.getOrLoad(`${normalized}:${range}`, TTL_MS.history[range], async () => {
        const { bars, timeZone } = await this.gateway.bars(normalized, chartWindow(range));
        const history = normalizeHistory(bars);
        const result = range === 'today' ? lastSession(history, timeZone) : history;
        if (result.length === 0) throw new SymbolNotFoundError(normalized);
        return result;
      });
    } catch (error) {
      if (error instanceof SymbolNotFoundError) {
        throw new RequestError(`No market data found for ${normalized}`, 404);
      }
      throw error;
    }
  }
}
