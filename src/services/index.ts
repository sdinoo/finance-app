import { DATA_PROVIDER } from '@/config/constants';
import { httpProvider } from './httpProvider';
import { mockProvider } from './mockProvider';
import type { MarketDataProvider } from './types';

/** Single entry point for the UI. Swap providers via VITE_DATA_PROVIDER. */
export const marketData: MarketDataProvider = DATA_PROVIDER === 'http' ? httpProvider : mockProvider;

export { MarketDataError } from './types';
export type { MarketDataProvider } from './types';
