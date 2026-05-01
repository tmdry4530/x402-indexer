import type { CachePort } from '../../application/ports/cache.port.js';

interface RedisCacheClientLike {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<unknown>;
}

const DASHBOARD_CACHE_TTL_SECONDS = 30;

export class RedisDashboardCacheAdapter implements CachePort {
  constructor(private readonly redis?: RedisCacheClientLike) {}

  public async readThrough<T>(key: string, loader: () => Promise<T>): Promise<T> {
    if (!this.redis) {
      return loader();
    }

    try {
      const cached = await this.redis.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (error) {
      console.error('[cache] read failed, falling back to db', key, error);
    }

    const fresh = await loader();
    try {
      await this.redis.setex(key, DASHBOARD_CACHE_TTL_SECONDS, JSON.stringify(fresh));
    } catch (error) {
      console.error('[cache] write failed, continuing without cache', key, error);
    }
    return fresh;
  }
}
