interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

export function serverCacheSet<T>(key: string, value: T, ttlMs: number): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function serverCacheGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function serverCacheClear(): void {
  cache.clear();
}

export const CACHE_TTL = {
  search: 24 * 60 * 60 * 1000,
  basic: 6 * 60 * 60 * 1000,
  navHistory: 6 * 60 * 60 * 1000,
  latestNav: 5 * 60 * 1000,
  realtime: 60 * 1000,
  snapshot: 60 * 1000,
};

// This in-memory Map is suitable for local dev/serverless warm instances.
// Production deployments can replace it with Redis, KV, or a database cache.
