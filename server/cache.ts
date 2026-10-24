interface Entry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Minimal TTL cache with in-flight request de-duplication and stale-if-error:
 * concurrent callers share one upstream call, and if a refresh fails the last good
 * value is served instead of an error.
 */
export class TtlCache<T> {
  private readonly entries = new Map<string, Entry<T>>();
  private readonly inflight = new Map<string, Promise<T>>();

  constructor(private readonly now: () => number = Date.now) {}

  async getOrLoad(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
    const hit = this.entries.get(key);
    if (hit && hit.expiresAt > this.now()) return hit.value;

    const pending = this.inflight.get(key);
    if (pending) return pending;

    const request = load()
      .then((value) => {
        this.entries.set(key, { value, expiresAt: this.now() + ttlMs });
        return value;
      })
      .catch((error: unknown) => {
        if (hit) return hit.value; // stale-if-error
        throw error;
      })
      .finally(() => this.inflight.delete(key));

    this.inflight.set(key, request);
    return request;
  }
}
