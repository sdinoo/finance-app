/** The provider has no data for the requested symbol (unknown, delisted, or no bars). */
export class SymbolNotFoundError extends Error {
  constructor(readonly symbol: string) {
    super(`No market data found for ${symbol}`);
    this.name = 'SymbolNotFoundError';
  }
}

/** Recognizes yahoo-finance2's "unknown symbol" failures, which are not a dedicated error class. */
export function isYahooNotFound(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as { code?: unknown }).code;
  return code === 404 || /no data found|not found/i.test(error.message);
}
