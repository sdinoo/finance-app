import { SymbolNotFoundError, isYahooNotFound } from './errors';

describe('isYahooNotFound', () => {
  it('recognizes 404s and "no data found" messages', () => {
    expect(isYahooNotFound(Object.assign(new Error('x'), { code: 404 }))).toBe(true);
    expect(isYahooNotFound(new Error('No data found, symbol may be delisted'))).toBe(true);
    expect(isYahooNotFound(new Error('Quote not found for symbol: ZZZZ'))).toBe(true);
  });

  it('does not treat outages or non-errors as not-found', () => {
    expect(isYahooNotFound(Object.assign(new Error('Server Error'), { code: 500 }))).toBe(false);
    expect(isYahooNotFound(new Error('fetch failed'))).toBe(false);
    expect(isYahooNotFound('No data found')).toBe(false);
  });

  it('SymbolNotFoundError carries the symbol', () => {
    expect(new SymbolNotFoundError('ZZZZ')).toMatchObject({ symbol: 'ZZZZ', message: 'No market data found for ZZZZ' });
  });
});
