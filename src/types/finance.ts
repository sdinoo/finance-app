export type ViewRange = 'today' | 'week' | 'quarter';

export interface Company {
  symbol: string;
  name: string;
}

/** Normalized trading session state, independent of the data provider's vocabulary. */
export type MarketState = 'PRE' | 'REGULAR' | 'POST' | 'CLOSED';

export interface Quote {
  symbol: string;
  name: string;
  currency: string;
  marketState: MarketState;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  updatedAt: string; // ISO timestamp
}

export interface PricePoint {
  time: string; // ISO timestamp
  close: number;
  volume: number;
}

/** Ascending by time. Points without a valid close are never included. */
export type PriceHistory = PricePoint[];

/** Aggregate view of a PriceHistory, used for summary cards and quarterly trend panels. */
export interface TrendSummary {
  start: number;
  end: number;
  returnPercent: number;
  high: number;
  low: number;
  averageVolume: number;
}

export interface ViewConfig {
  range: ViewRange;
  label: string;
  /** Phrase used in sentences, e.g. "over the last 7 days". */
  period: string;
  /** Provider-agnostic range/interval hints used by the service layer. */
  days: number;
  interval: '5m' | '30m' | '1d';
}
