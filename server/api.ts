import { isViewRange } from '@/config/markets';
import { RequestError, type FinanceService } from './yahoo/service';

export interface ApiResponse {
  status: number;
  body: unknown;
  /** Seconds the CDN/browser may cache the response. */
  maxAge?: number;
}

/**
 * Framework-agnostic route handler for GET /quotes and GET /history.
 * The Node server below and any serverless wrapper can both delegate to it.
 */
export async function handleApiRequest(
  service: FinanceService,
  pathname: string,
  params: URLSearchParams,
): Promise<ApiResponse> {
  try {
    if (pathname === '/quotes') {
      const symbols = (params.get('symbols') ?? '').split(',');
      return { status: 200, body: await service.getQuotes(symbols), maxAge: 15 };
    }

    if (pathname === '/history') {
      const range = params.get('range') ?? '';
      if (!isViewRange(range)) throw new RequestError(`Unsupported range: ${range}`, 400);
      return { status: 200, body: await service.getHistory(params.get('symbol') ?? '', range), maxAge: 30 };
    }

    return { status: 404, body: { error: 'Not found' } };
  } catch (error) {
    if (error instanceof RequestError) return { status: error.status, body: { error: error.message } };
    console.error('Upstream failure:', error);
    return { status: 502, body: { error: 'Market data provider unavailable' } };
  }
}
