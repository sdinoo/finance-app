import YahooFinance from 'yahoo-finance2';
import { SymbolNotFoundError, isYahooNotFound } from './errors';
import type { ChartWindow } from './windows';
import type { RawBar, RawQuote } from './normalize';

/** The only Yahoo-specific surface the rest of the server depends on. Fake it in tests. */
export interface YahooGateway {
  quotes(symbols: string[]): Promise<RawQuote[]>;
  bars(symbol: string, window: ChartWindow): Promise<{ bars: RawBar[]; timeZone?: string }>;
}

export function createYahooGateway(): YahooGateway {
  const yahoo = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

  return {
    async quotes(symbols) {
      return (await yahoo.quote(symbols)) as RawQuote[];
    },
    async bars(symbol, window) {
      const result = await yahoo
        .chart(symbol, {
          period1: window.period1,
          period2: window.period2,
          interval: window.interval,
          // Regular session only, so history agrees with the quote's regularMarket* figures.
          includePrePost: false,
          return: 'array',
        })
        .catch((error: unknown) => {
          throw isYahooNotFound(error) ? new SymbolNotFoundError(symbol) : error;
        });
      const timeZone =
        typeof result.meta.exchangeTimezoneName === 'string' ? result.meta.exchangeTimezoneName : undefined;
      return { bars: result.quotes, timeZone };
    },
  };
}
