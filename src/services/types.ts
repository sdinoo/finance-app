import type { PriceHistory, Quote, ViewRange } from '@/types/finance';

/** Contract every market data source (mock, HTTP proxy, future providers) must satisfy. */
export interface MarketDataProvider {
  getQuotes(symbols: string[]): Promise<Quote[]>;
  getHistory(symbol: string, range: ViewRange): Promise<PriceHistory>;
}

export class MarketDataError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'MarketDataError';
    this.status = status;
  }
}
