import type { Company, ViewConfig, ViewRange } from '@/types/finance';

/**
 * Company registry: the single place to add or remove tracked companies.
 * The server allowlist, the selector UI and the mock provider all derive from it.
 * Symbols are Yahoo Finance tickers.
 */
export const COMPANIES: Company[] = [
  { symbol: 'IBM', name: 'IBM' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'ORCL', name: 'Oracle' },
  { symbol: 'SAP', name: 'SAP' },
  { symbol: 'CRM', name: 'Salesforce' },
];

/** The company all comparisons are anchored on. It cannot be deselected. */
export const PRIMARY_SYMBOL = 'IBM';

/** All tracked companies are US-listed; chart and timestamp labels are shown in exchange time. */
export const MARKET_TIME_ZONE = 'America/New_York';

export const MAX_TICKERS = 5;

export const getCompany = (symbol: string): Company | undefined =>
  COMPANIES.find((c) => c.symbol === symbol);

export const isKnownSymbol = (symbol: string): boolean => getCompany(symbol) !== undefined;

export const VIEWS: Record<ViewRange, ViewConfig> = {
  today: { range: 'today', label: 'Today', period: 'today', days: 1, interval: '5m' },
  week: { range: 'week', label: 'Last 7 Days', period: 'over the last 7 days', days: 7, interval: '30m' },
  quarter: { range: 'quarter', label: 'Last Quarter', period: 'over the last quarter', days: 90, interval: '1d' },
};

export const VIEW_ORDER: ViewRange[] = ['today', 'week', 'quarter'];

export const isViewRange = (value: string): value is ViewRange => value in VIEWS;
