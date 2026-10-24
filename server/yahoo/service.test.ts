import { COMPANIES } from '@/config/markets';
import { handleApiRequest } from '../api';
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
    await expect(service.getHistory('NOPE', 'week')).rejects.toMatchObject({ status: 400 });
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

  it('maps upstream failures to 502 without leaking details', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const failing = new FinanceService(makeGateway({ quotes: vi.fn().mockRejectedValue(new Error('secret detail')) }));
    const res = await handleApiRequest(failing, '/quotes', new URLSearchParams('symbols=IBM'));
    expect(res.status).toBe(502);
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });
});
