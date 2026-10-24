import { TtlCache } from './cache';

describe('TtlCache', () => {
  it('serves cached values until the TTL expires', async () => {
    let now = 0;
    const cache = new TtlCache<number>(() => now);
    const load = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);

    expect(await cache.getOrLoad('k', 100, load)).toBe(1);
    now = 99;
    expect(await cache.getOrLoad('k', 100, load)).toBe(1);
    now = 100;
    expect(await cache.getOrLoad('k', 100, load)).toBe(2);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('de-duplicates concurrent loads for the same key', async () => {
    const cache = new TtlCache<number>();
    const load = vi.fn().mockResolvedValue(7);
    const results = await Promise.all([
      cache.getOrLoad('k', 100, load),
      cache.getOrLoad('k', 100, load),
      cache.getOrLoad('k', 100, load),
    ]);
    expect(results).toEqual([7, 7, 7]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('serves the stale value when a refresh fails', async () => {
    let now = 0;
    const cache = new TtlCache<number>(() => now);
    await cache.getOrLoad('k', 10, async () => 1);
    now = 50;
    expect(await cache.getOrLoad('k', 10, () => Promise.reject(new Error('down')))).toBe(1);
  });

  it('propagates errors when there is nothing cached', async () => {
    const cache = new TtlCache<number>();
    await expect(cache.getOrLoad('k', 10, () => Promise.reject(new Error('down')))).rejects.toThrow('down');
  });
});
