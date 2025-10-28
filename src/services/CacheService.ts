import { RedisClient } from '../cache/RedisClient';

export interface CacheOptions {
  ttl?: number;
  version?: string;
}

export class CacheService {
  private redis: RedisClient;

  constructor() {
    this.redis = RedisClient.getInstance();
  }

  // Cache TTL constants (in seconds)
  private readonly TTL = {
    CATEGORIES: 300, // 5 minutes
    PRODUCT: 180,    // 3 minutes
    PRODUCTS_LIST: 120, // 2 minutes
    SESSION: 3600,   // 1 hour
    RATE_LIMIT: 60,  // 1 minute
    CART: 1800,      // 30 minutes
  };

  // Cache key builders
  private buildKey(type: string, identifier: string, version = 'v1'): string {
    return `${type}:${version}:${identifier}`;
  }

  // Categories cache
  async getCategoriesCache(): Promise<any[] | null> {
    const cached = await this.redis.get(this.buildKey('categories', 'all'));
    return cached ? JSON.parse(cached) : null;
  }

  async setCategoriesCache(categories: any[]): Promise<void> {
    const key = this.buildKey('categories', 'all');
    await this.redis.set(key, JSON.stringify(categories), this.TTL.CATEGORIES);
  }

  async invalidateCategoriesCache(): Promise<void> {
    await this.redis.del(this.buildKey('categories', 'all'));
  }

  // Product cache
  async getProductCache(slug: string): Promise<any | null> {
    const cached = await this.redis.get(this.buildKey('product', slug));
    return cached ? JSON.parse(cached) : null;
  }

  async setProductCache(slug: string, product: any): Promise<void> {
    const key = this.buildKey('product', slug);
    await this.redis.set(key, JSON.stringify(product), this.TTL.PRODUCT);
  }

  async invalidateProductCache(slug: string): Promise<void> {
    await this.redis.del(this.buildKey('product', slug));
  }

  // Products list cache
  async getProductsListCache(categorySlug: string, page: number, pageSize: number): Promise<any | null> {
    const identifier = `${categorySlug}:${page}:${pageSize}`;
    const cached = await this.redis.get(this.buildKey('products', identifier));
    return cached ? JSON.parse(cached) : null;
  }

  async setProductsListCache(categorySlug: string, page: number, pageSize: number, products: any): Promise<void> {
    const identifier = `${categorySlug}:${page}:${pageSize}`;
    const key = this.buildKey('products', identifier);
    await this.redis.set(key, JSON.stringify(products), this.TTL.PRODUCTS_LIST);
  }

  async invalidateProductsListCache(categorySlug: string): Promise<void> {
    const pattern = this.buildKey('products', `${categorySlug}:*`);
    await this.redis.delPattern(pattern);
  }

  // Session cache
  async getSessionCache(sessionId: string): Promise<any | null> {
    const cached = await this.redis.get(this.buildKey('session', sessionId));
    return cached ? JSON.parse(cached) : null;
  }

  async setSessionCache(sessionId: string, sessionData: any): Promise<void> {
    const key = this.buildKey('session', sessionId);
    await this.redis.set(key, JSON.stringify(sessionData), this.TTL.SESSION);
  }

  async invalidateSessionCache(sessionId: string): Promise<void> {
    await this.redis.del(this.buildKey('session', sessionId));
  }

  // PKCE verifier cache
  async setPKCEVerifier(codeChallenge: string, verifier: string): Promise<void> {
    const key = this.buildKey('pkce', codeChallenge);
    await this.redis.set(key, verifier, 600); // 10 minutes
  }

  async getPKCEVerifier(codeChallenge: string): Promise<string | null> {
    return await this.redis.get(this.buildKey('pkce', codeChallenge));
  }

  async deletePKCEVerifier(codeChallenge: string): Promise<void> {
    await this.redis.del(this.buildKey('pkce', codeChallenge));
  }

  // Rate limiting
  async getRateLimit(identifier: string): Promise<number> {
    const key = this.buildKey('rate_limit', identifier);
    const current = await this.redis.get(key);
    return current ? parseInt(current) : 0;
  }

  async incrementRateLimit(identifier: string, windowSeconds = 60): Promise<number> {
    const key = this.buildKey('rate_limit', identifier);
    const current = await this.redis.get(key);
    
    if (current) {
      return await this.redis.getClient().incr(key);
    } else {
      await this.redis.set(key, '1', windowSeconds);
      return 1;
    }
  }

  // Cart cache (optional)
  async getCartCache(userId: string): Promise<any | null> {
    const cached = await this.redis.get(this.buildKey('cart', userId));
    return cached ? JSON.parse(cached) : null;
  }

  async setCartCache(userId: string, cart: any): Promise<void> {
    const key = this.buildKey('cart', userId);
    await this.redis.set(key, JSON.stringify(cart), this.TTL.CART);
  }

  async invalidateCartCache(userId: string): Promise<void> {
    await this.redis.del(this.buildKey('cart', userId));
  }

  // Generic cache methods
  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), ttl);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async deletePattern(pattern: string): Promise<void> {
    await this.redis.delPattern(pattern);
  }

  async exists(key: string): Promise<boolean> {
    return await this.redis.exists(key);
  }
}