import { averageVolume, highLow, normalize, pctChange, periodReturn, summarizeHistory } from './metrics';
import type { PriceHistory } from '@/types/finance';

const history: PriceHistory = [
  { time: '2026-01-01T00:00:00Z', close: 100, volume: 10 },
  { time: '2026-01-02T00:00:00Z', close: 110, volume: 30 },
  { time: '2026-01-03T00:00:00Z', close: 95, volume: 20 },
];

describe('metrics', () => {
  it('computes pctChange and guards zero base', () => {
    expect(pctChange(100, 110)).toBeCloseTo(10);
    expect(pctChange(0, 50)).toBe(0);
  });

  it('computes period return', () => {
    expect(periodReturn(history)).toBeCloseTo(-5);
    expect(periodReturn([])).toBe(0);
  });

  it('computes high/low and average volume', () => {
    expect(highLow(history)).toEqual({ high: 110, low: 95 });
    expect(highLow([])).toEqual({ high: 0, low: 0 });
    expect(averageVolume(history)).toBe(20);
  });

  it('summarizes a history for trend panels', () => {
    expect(summarizeHistory(history)).toEqual({
      start: 100,
      end: 95,
      returnPercent: -5,
      high: 110,
      low: 95,
      averageVolume: 20,
    });
    expect(summarizeHistory([])).toEqual({ start: 0, end: 0, returnPercent: 0, high: 0, low: 0, averageVolume: 0 });
  });

  it('normalizes to percent change from first point', () => {
    expect(normalize(history)).toEqual([0, 10, -5]);
    expect(normalize([])).toEqual([]);
  });
});
