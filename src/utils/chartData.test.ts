import { buildComparisonRows, buildTrendRows, symbolColor } from './chartData';
import type { PriceHistory } from '@/types/finance';

const history = (points: Array<[string, number]>): PriceHistory =>
  points.map(([time, close]) => ({ time, close, volume: 10 }));

describe('buildComparisonRows', () => {
  it('merges companies by timestamp and normalizes each to its own start', () => {
    const rows = buildComparisonRows({
      IBM: history([['t1', 100], ['t2', 110]]),
      MSFT: history([['t1', 200], ['t2', 190]]),
    });
    expect(rows).toEqual([
      { time: 't1', IBM: 0, MSFT: 0 },
      { time: 't2', IBM: 10, MSFT: -5 },
    ]);
  });

  it('leaves a gap (not a shifted value) when a company is missing a bar', () => {
    const rows = buildComparisonRows({
      IBM: history([['t1', 100], ['t2', 101], ['t3', 102]]),
      MSFT: history([['t1', 50], ['t3', 51]]),
    });
    expect(rows.map((r) => r.time)).toEqual(['t1', 't2', 't3']);
    expect(rows[1]).not.toHaveProperty('MSFT');
    expect(rows[2].MSFT).toBe(2);
  });

  it('handles empty input', () => {
    expect(buildComparisonRows({})).toEqual([]);
    expect(buildComparisonRows({ IBM: [] })).toEqual([]);
  });
});

describe('buildTrendRows', () => {
  it('sorts best performer first, resolves names, and skips empty histories', () => {
    const rows = buildTrendRows({
      IBM: history([['t1', 100], ['t2', 102]]),
      MSFT: history([['t1', 100], ['t2', 110]]),
      ORCL: [],
    });
    expect(rows.map((r) => r.symbol)).toEqual(['MSFT', 'IBM']);
    expect(rows[0]).toMatchObject({ name: 'Microsoft', summary: { returnPercent: 10 } });
  });
});

describe('symbolColor', () => {
  it('is stable per symbol and distinct across registry companies', () => {
    expect(symbolColor('IBM')).toBe(symbolColor('IBM'));
    expect(new Set(['IBM', 'MSFT', 'ORCL', 'SAP', 'CRM'].map(symbolColor)).size).toBe(5);
  });

  it('falls back for unknown symbols', () => {
    expect(symbolColor('ZZZ')).toMatch(/^#/);
  });
});
