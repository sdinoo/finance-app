import { useEffect, useState } from 'react';
import { marketData } from '@/services';
import type { PriceHistory, Quote, ViewRange } from '@/types/finance';

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: string | undefined;
}

const initial = <T,>(): AsyncState<T> => ({ data: undefined, loading: true, error: undefined });

function useAsync<T>(load: () => Promise<T>, key: string, enabled: boolean): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>(initial<T>());

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: undefined }));
    load().then(
      (data) => !cancelled && setState({ data, loading: false, error: undefined }),
      (err: unknown) =>
        !cancelled &&
        setState({ data: undefined, loading: false, error: err instanceof Error ? err.message : 'Unknown error' }),
    );
    return () => {
      cancelled = true;
    };
    // `key` encodes the inputs of `load`, which is recreated every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  return state;
}

export function useQuotes(symbols: string[]): AsyncState<Quote[]> {
  return useAsync(() => marketData.getQuotes(symbols), symbols.join(','), symbols.length > 0);
}

/** Fetches histories for all symbols; a single failing symbol fails the whole set. */
export function useHistories(symbols: string[], range: ViewRange): AsyncState<Record<string, PriceHistory>> {
  return useAsync(
    async () => {
      const entries = await Promise.all(
        symbols.map(async (symbol) => [symbol, await marketData.getHistory(symbol, range)] as const),
      );
      return Object.fromEntries(entries);
    },
    `${symbols.join(',')}:${range}`,
    symbols.length > 0,
  );
}
