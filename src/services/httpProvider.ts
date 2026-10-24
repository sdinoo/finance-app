import { API_BASE_URL } from '@/config/constants';
import type { PriceHistory, Quote } from '@/types/finance';
import { MarketDataError, type MarketDataProvider } from './types';

async function getJson<T>(path: string, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { signal: controller.signal });
    if (!response.ok) {
      throw new MarketDataError(`Request failed: ${response.status}`, response.status);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof MarketDataError) throw error;
    throw new MarketDataError(error instanceof Error ? error.message : 'Network error');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Talks to a backend proxy (e.g. wrapping yahoo-finance2) exposing:
 *   GET /quotes?symbols=IBM,MSFT
 *   GET /history?symbol=IBM&range=week
 */
export const httpProvider: MarketDataProvider = {
  getQuotes: (symbols) => getJson<Quote[]>(`/quotes?symbols=${encodeURIComponent(symbols.join(','))}`),
  getHistory: (symbol, range) =>
    getJson<PriceHistory>(`/history?symbol=${encodeURIComponent(symbol)}&range=${range}`),
};
