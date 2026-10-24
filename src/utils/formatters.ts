import { MARKET_TIME_ZONE } from '@/config/markets';
import type { MarketState, ViewRange } from '@/types/finance';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

export const formatCurrency = (value: number): string => usd.format(value);

export const formatCompact = (value: number): string => compact.format(value);

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

const tickFormatters: Record<ViewRange, Intl.DateTimeFormat> = {
  today: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: MARKET_TIME_ZONE }),
  week: new Intl.DateTimeFormat('en-US', { weekday: 'short', hour: 'numeric', timeZone: MARKET_TIME_ZONE }),
  quarter: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: MARKET_TIME_ZONE }),
};

/** Short x-axis label whose granularity matches the view (time, weekday + hour, or date). */
export const formatTick = (iso: string, range: ViewRange): string => tickFormatters[range].format(new Date(iso));

const timestampFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
  timeZone: MARKET_TIME_ZONE,
});

export const formatTimestamp = (iso: string): string => timestampFormatter.format(new Date(iso));

const MARKET_STATE_LABELS: Record<MarketState, string> = {
  PRE: 'Pre-market',
  REGULAR: 'Market open',
  POST: 'After hours',
  CLOSED: 'Market closed',
};

export const formatMarketState = (state: MarketState): string => MARKET_STATE_LABELS[state];

/** CSS class for a signed value; direction is always paired with an arrow or sign in the UI. */
export const toneClass = (value: number): 'positive' | 'negative' | 'neutral' =>
  value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
