import { COMPANIES } from '@/config/markets';
import { handleApiRequest } from '../api';
import { SymbolNotFoundError } from './errors';
import type { YahooGateway } from './gateway';
import { RequestError, FinanceService } from './service';

function makeGateway(overrides: Partial<YahooGateway> = {}): YahooGateway {
  return {
    quotes: vi.fn(async (symbols: string[]) =>
      symbols.map((symbol) => ({ symbol, regularMarketPrice: 100, regularMarketPreviousClose: 99 })),
    ),
    bars: vi.fn(async () => ({
      timeZone: 'America/New_York',
      bars: [
        { date: new Date('2026-01-08T15:00:00Z'), close: 10, volume: 1 },
        { date: new Date('2026-01-09T15:00:00Z'), close: 11, volume: 2 },
        { date: new Date('2026-01-09T16:00:00Z'), close: null, volume: 2 },
        { date: new Date('2026-01-09T17:00:00Z'), close: 12, volume: 3 },
      ],
    })),
    ...overrides,
  };
}

describe('FinanceService', () => {
  it('returns normalized quotes in the requested order and caches repeated calls', async () => {
    const gateway = makeGateway();
    const service = new FinanceService(gateway);

    const first = await service.getQuotes(['msft', 'IBM', 'ibm']);
    expect(first.map((q) => q.symbol)).toEqual(['MSFT', 'IBM']);
    expect(first[0]).toMatchObject({ price: 100, change: 1, name: 'Microsoft' });

    await service.getQuotes(['IBM', 'MSFT']);
    expect(gateway.quotes).toHaveBeenCalledTimes(1);
  });

  it('rejects empty and unsupported symbols with 400', async () => {
    const service = new FinanceService(makeGateway());
    await expect(service.getQuotes([''])).rejects.toMatchObject({ status: 400 });
    await expect(service.getQuotes(['IBM', 'NOPE'])).rejects.toBeInstanceOf(RequestError);
  });

  it('rejects malformed history symbols with 400 before calling the provider', async () => {
    const gateway = makeGateway();
    const service = new FinanceService(gateway);
    for (const bad of ['', 'A1', '../etc', 'TOOLONG', 'AAPL,MSFT']) {
      await expect(service.getHistory(bad, 'week')).rejects.toMatchObject({ status: 400 });
    }
    expect(gateway.bars).not.toHaveBeenCalled();
  });

  it('serves history for a well-formed symbol outside the registry, normalizing case', async () => {
    const gateway = makeGateway();
    const service = new FinanceService(gateway);
    const history = await service.getHistory(' aapl ', 'week');
    expect(history).toHaveLength(3);
    expect(gateway.bars).toHaveBeenCalledWith('AAPL', expect.anything());
  });

  it('maps an unknown symbol, or one with no bars, to 404', async () => {
    const unknown = new FinanceService(
      makeGateway({ bars: vi.fn().mockRejectedValue(new SymbolNotFoundError('ZZZZ')) }),
    );
    await expect(unknown.getHistory('ZZZZ', 'week')).rejects.toMatchObject({ status: 404 });

    const empty = new FinanceService(makeGateway({ bars: vi.fn(async () => ({ bars: [] })) }));
    await expect(empty.getHistory('ZZZZ', 'quarter')).rejects.toMatchObject({ status: 404 });
  });

  it('accepts every company in the registry (extensibility)', async () => {
    const service = new FinanceService(makeGateway());
    const quotes = await service.getQuotes(COMPANIES.map((c) => c.symbol));
    expect(quotes).toHaveLength(COMPANIES.length);
  });

  it('trims the "today" history to the latest session but leaves other ranges intact', async () => {
    const service = new FinanceService(makeGateway());
    const today = await service.getHistory('IBM', 'today');
    expect(today.map((p) => p.close)).toEqual([11, 12]);

    const week = await service.getHistory('IBM', 'week');
    expect(week.map((p) => p.close)).toEqual([10, 11, 12]);
  });
});

describe('handleApiRequest', () => {
  const service = () => new FinanceService(makeGateway());

  it('serves quotes', async () => {
    const res = await handleApiRequest(service(), '/quotes', new URLSearchParams('symbols=IBM,MSFT'));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('serves history', async () => {
    const res = await handleApiRequest(service(), '/history', new URLSearchParams('symbol=IBM&range=quarter'));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });

  it('validates input', async () => {
    const bad = await handleApiRequest(service(), '/history', new URLSearchParams('symbol=IBM&range=year'));
    expect(bad.status).toBe(400);
    const unknown = await handleApiRequest(service(), '/quotes', new URLSearchParams('symbols=NOPE'));
    expect(unknown.status).toBe(400);
    const missing = await handleApiRequest(service(), '/nope', new URLSearchParams());
    expect(missing.status).toBe(404);
  });

  it('returns 404 for an unknown history symbol and 400 for a malformed one', async () => {
    const notFound = new FinanceService(
      makeGateway({ bars: vi.fn().mockRejectedValue(new SymbolNotFoundError('ZZZZ')) }),
    );
    const missing = await handleApiRequest(notFound, '/history', new URLSearchParams('symbol=ZZZZ&range=week'));
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: 'No market data found for ZZZZ' });

    const malformed = await handleApiRequest(service(), '/history', new URLSearchParams('symbol=A1&range=week'));
    expect(malformed.status).toBe(400);
  });

  it('keeps quotes restricted to the registry', async () => {
    const res = await handleApiRequest(service(), '/quotes', new URLSearchParams('symbols=AAPL'));
    expect(res.status).toBe(400);
  });

  it('maps upstream failures to 502 without leaking details', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const failing = new FinanceService(makeGateway({ quotes: vi.fn().mockRejectedValue(new Error('secret detail')) }));
    const res = await handleApiRequest(failing, '/quotes', new URLSearchParams('symbols=IBM'));
    expect(res.status).toBe(502);
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });
});
