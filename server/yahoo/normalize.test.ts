import { lastSession, normalizeHistory, normalizeQuote, toMarketState } from './normalize';

describe('normalizeQuote', () => {
  const raw = {
    symbol: 'IBM',
    shortName: 'INTL BUSINESS MACHINES',
    currency: 'USD',
    marketState: 'REGULAR',
    regularMarketPrice: 201.2345,
    regularMarketPreviousClose: 200,
    regularMarketChange: 1.2345,
    regularMarketChangePercent: 0.61725,
    regularMarketDayHigh: 202,
    regularMarketDayLow: 199.5,
    regularMarketVolume: 4_000_000,
    regularMarketTime: new Date('2026-01-05T15:00:00Z'),
  };

  it('maps and rounds a full Yahoo quote, preferring the registry display name', () => {
    expect(normalizeQuote(raw)).toEqual({
      symbol: 'IBM',
      name: 'IBM',
      currency: 'USD',
      marketState: 'REGULAR',
      price: 201.23,
      previousClose: 200,
      change: 1.23,
      changePercent: 0.62,
      dayHigh: 202,
      dayLow: 199.5,
      volume: 4_000_000,
      updatedAt: '2026-01-05T15:00:00.000Z',
    });
  });

  it('returns null when there is no usable price', () => {
    expect(normalizeQuote({ symbol: 'IBM' })).toBeNull();
    expect(normalizeQuote({ symbol: 'IBM', regularMarketPrice: NaN })).toBeNull();
  });

  it('derives missing fields from what is available', () => {
    const quote = normalizeQuote({ symbol: 'XYZ', shortName: 'XYZ Corp', regularMarketPrice: 110, regularMarketChange: 10 });
    expect(quote).toMatchObject({
      name: 'XYZ Corp',
      previousClose: 100,
      change: 10,
      changePercent: 10,
      dayHigh: 110,
      dayLow: 110,
      volume: 0,
      currency: 'USD',
      marketState: 'CLOSED',
    });
  });
});

describe('toMarketState', () => {
  it('collapses Yahoo states and defaults to CLOSED', () => {
    expect(toMarketState('PREPRE')).toBe('PRE');
    expect(toMarketState('POSTPOST')).toBe('POST');
    expect(toMarketState('REGULAR')).toBe('REGULAR');
    expect(toMarketState('???')).toBe('CLOSED');
    expect(toMarketState(undefined)).toBe('CLOSED');
  });
});

describe('normalizeHistory', () => {
  it('drops null closes, zero-fills volume, and sorts ascending', () => {
    const history = normalizeHistory([
      { date: new Date('2026-01-02T15:00:00Z'), close: 11.111, volume: null },
      { date: new Date('2026-01-01T15:00:00Z'), close: 10, volume: 5 },
      { date: new Date('2026-01-03T15:00:00Z'), close: null, volume: 9 },
    ]);
    expect(history).toEqual([
      { time: '2026-01-01T15:00:00.000Z', close: 10, volume: 5 },
      { time: '2026-01-02T15:00:00.000Z', close: 11.11, volume: 0 },
    ]);
  });
});

describe('lastSession', () => {
  it('keeps only the most recent trading day in the exchange time zone', () => {
    const point = (time: string) => ({ time, close: 1, volume: 1 });
    const history = [
      point('2026-01-08T15:00:00.000Z'), // Thu 10:00 ET
      point('2026-01-09T14:30:00.000Z'), // Fri 09:30 ET
      point('2026-01-09T20:55:00.000Z'), // Fri 15:55 ET
    ];
    expect(lastSession(history).map((p) => p.time)).toEqual([history[1].time, history[2].time]);
  });

  it('uses local calendar day, not UTC day', () => {
    const point = (time: string) => ({ time, close: 1, volume: 1 });
    // 01:00 UTC on Jan 10 is still Jan 9 evening in New York.
    const history = [point('2026-01-09T15:00:00.000Z'), point('2026-01-10T01:00:00.000Z')];
    expect(lastSession(history)).toHaveLength(2);
  });

  it('handles empty input', () => {
    expect(lastSession([])).toEqual([]);
  });
});
