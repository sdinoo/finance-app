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

  /** `maxEntries` bounds memory when keys come from user input; the oldest entry is evicted first. */
  constructor(
    private readonly now: () => number = Date.now,
    private readonly maxEntries = Infinity,
  ) {}

  async getOrLoad(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
    const hit = this.entries.get(key);
    if (hit && hit.expiresAt > this.now()) return hit.value;

    const pending = this.inflight.get(key);
    if (pending) return pending;

    const request = load()
      .then((value) => {
        this.entries.delete(key); // re-insert so it counts as the newest entry
        this.entries.set(key, { value, expiresAt: this.now() + ttlMs });
        if (this.entries.size > this.maxEntries) {
          this.entries.delete(this.entries.keys().next().value as string);
        }
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
