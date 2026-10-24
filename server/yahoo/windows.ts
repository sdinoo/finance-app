import { VIEWS } from '@/config/markets';
import type { ViewConfig, ViewRange } from '@/types/finance';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ChartWindow {
  period1: Date;
  period2: Date;
  interval: ViewConfig['interval'];
}

/** How far back to request per view. "today" over-fetches so the last session can be isolated. */
const LOOKBACK_DAYS: Record<ViewRange, number> = { today: 5, week: 7, quarter: 90 };

export function chartWindow(range: ViewRange, now = new Date()): ChartWindow {
  return {
    period1: new Date(now.getTime() - LOOKBACK_DAYS[range] * DAY_MS),
    period2: now,
    interval: VIEWS[range].interval,
  };
}

/** Server-side cache lifetimes in ms; longer for slower-moving views. */
export const TTL_MS = {
  quotes: 30_000,
  history: { today: 60_000, week: 5 * 60_000, quarter: 60 * 60_000 } satisfies Record<ViewRange, number>,
} as const;
