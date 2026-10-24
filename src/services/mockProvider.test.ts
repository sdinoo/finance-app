import { buildHistory, mockProvider } from './mockProvider';
import { MarketDataError } from './types';

describe('mockProvider', () => {
  it('is deterministic for a given symbol/range/time', () => {
    const now = Date.UTC(2026, 0, 1);
    expect(buildHistory('IBM', 'week', now)).toEqual(buildHistory('IBM', 'week', now));
  });

  it('returns a quote per requested symbol', async () => {
    const quotes = await mockProvider.getQuotes(['IBM', 'MSFT']);
    expect(quotes.map((q) => q.symbol)).toEqual(['IBM', 'MSFT']);
    expect(quotes[0].dayHigh).toBeGreaterThanOrEqual(quotes[0].dayLow);
  });

  it('returns history sized per range', async () => {
    const today = await mockProvider.getHistory('IBM', 'today');
    const quarter = await mockProvider.getHistory('IBM', 'quarter');
    expect(today.length).toBeGreaterThan(0);
    expect(quarter.length).toBeGreaterThan(0);
    expect(today).not.toEqual(quarter);
  });
});

describe('mockProvider custom symbols', () => {
  it('charts a known non-registry symbol', async () => {
    const history = await mockProvider.getHistory('AAPL', 'week');
    expect(history.length).toBeGreaterThan(0);
  });

  it('rejects an unknown symbol with a 404 MarketDataError', async () => {
    await expect(mockProvider.getHistory('ZZZZ', 'week')).rejects.toEqual(
      expect.objectContaining({ name: 'MarketDataError', status: 404 }),
    );
    await expect(mockProvider.getHistory('ZZZZ', 'week')).rejects.toBeInstanceOf(MarketDataError);
  });
});

describe('mockProvider timestamps', () => {
  it('aligns timestamps across symbols so they can be charted together', async () => {
    const [ibm, msft] = await Promise.all([
      mockProvider.getHistory('IBM', 'today'),
      mockProvider.getHistory('MSFT', 'today'),
    ]);
    expect(ibm.map((p) => p.time)).toEqual(msft.map((p) => p.time));
  });
});
