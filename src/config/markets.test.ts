import { isValidSymbol, normalizeSymbol } from './markets';

describe('symbol validation', () => {
  it('normalizes case and surrounding whitespace', () => {
    expect(normalizeSymbol('  aapl ')).toBe('AAPL');
  });

  it.each(['A', 'AAPL', 'GOOGL', 'BRK.B', 'RDS-A'])('accepts %s', (symbol) => {
    expect(isValidSymbol(symbol)).toBe(true);
  });

  it.each(['', 'aapl', 'TOOLONG', 'A1', 'AA PL', 'BRK.', 'BRK.BB', '../etc', 'AAPL,MSFT'])(
    'rejects %j',
    (symbol) => {
      expect(isValidSymbol(symbol)).toBe(false);
    },
  );
});
