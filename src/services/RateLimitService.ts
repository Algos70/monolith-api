import { CacheService } from './CacheService';

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  keyPrefix?: string;  // Custom key prefix
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  total: number;
}

export class RateLimitService {
  private cacheService: CacheService;

  // Default rate limit configurations
  private readonly configs = {
    // General API limits
    api: { windowMs: 60000, maxRequests: 100 }, // 100 req/min
    auth: { windowMs: 300000, maxRequests: 5 }, // 5 req/5min for auth
    catalog: { windowMs: 60000, maxRequests: 200 }, // 200 req/min for catalog
    
    // User-specific limits (higher limits for authenticated users)
    userApi: { windowMs: 60000, maxRequests: 500 }, // 500 req/min
    userCatalog: { windowMs: 60000, maxRequests: 1000 }, // 1000 req/min
  };

  constructor() {
    this.cacheService = new CacheService();
  }

  /**
   * Check and increment rate limit for IP address
   */
  async checkIPLimit(
    ip: string, 
    type: keyof typeof this.configs = 'api'
  ): Promise<RateLimitResult> {
    const config = this.configs[type];
    const key = `rate:v1:ip:${type}:${ip}`;
    
    return await this.checkLimit(key, config);
  }

  /**
   * Check and increment rate limit for user
   */
  async checkUserLimit(
    userId: string, 
    type: keyof typeof this.configs = 'userApi'
  ): Promise<RateLimitResult> {
    const config = this.configs[type];
    const key = `rate:v1:user:${type}:${userId}`;
    
    return await this.checkLimit(key, config);
  }

  /**
   * Check and increment rate limit for combined IP + endpoint
   */
  async checkEndpointLimit(
    ip: string,
    endpoint: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const cleanEndpoint = endpoint.replace(/[^a-zA-Z0-9]/g, '_');
    const key = `rate:v1:endpoint:${cleanEndpoint}:${ip}`;
    
    return await this.checkLimit(key, config);
  }

  /**
   * Core rate limiting logic using sliding window
   */
  private async checkLimit(
    key: string, 
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const windowSeconds = Math.ceil(config.windowMs / 1000);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
      // Get current count
      const currentCount = await this.cacheService.get<number>(key) || 0;
      
      if (currentCount >= config.maxRequests) {
        // Rate limit exceeded
        const ttl = await this.getTTL(key);
        const resetTime = now + (ttl * 1000);
        
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          total: config.maxRequests
        };
      }

      // Increment counter
      const newCount = currentCount + 1;
      
      if (currentCount === 0) {
        // First request in window, set with TTL
        await this.cacheService.set(key, newCount, windowSeconds);
      } else {
        // Increment existing counter
        await this.cacheService.set(key, newCount);
      }

      const ttl = await this.getTTL(key);
      const resetTime = now + (ttl * 1000);

      return {
        allowed: true,
        remaining: config.maxRequests - newCount,
        resetTime,
        total: config.maxRequests
      };

    } catch (error) {
      console.error('Rate limit check error:', error);
      // On error, allow the request (fail open)
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs,
        total: config.maxRequests
      };
    }
  }

  /**
   * Get TTL for a key
   */
  private async getTTL(key: string): Promise<number> {
    try {
      const redis = this.cacheService['redis'].getClient();
      const ttl = await redis.ttl(key);
      return ttl > 0 ? ttl : 60; // Default 60 seconds if no TTL
    } catch (error) {
      return 60; // Default fallback
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  async resetLimit(key: string): Promise<void> {
    await this.cacheService.delete(key);
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getStatus(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const currentCount = await this.cacheService.get<number>(key) || 0;
    const now = Date.now();
    const ttl = await this.getTTL(key);
    const resetTime = now + (ttl * 1000);

    return {
      allowed: currentCount < config.maxRequests,
      remaining: Math.max(0, config.maxRequests - currentCount),
      resetTime,
      total: config.maxRequests
    };
  }

  /**
   * Custom rate limit with specific config
   */
  async checkCustomLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const prefix = config.keyPrefix || 'custom';
    const key = `rate:v1:${prefix}:${identifier}`;
    
    return await this.checkLimit(key, config);
  }
}