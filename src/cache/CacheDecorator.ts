import { CacheService } from "../services/CacheService";

export interface CacheDecoratorOptions {
  ttl?: number;
  keyGenerator?: (...args: any[]) => string;
  version?: string;
}

/**
 * Cache decorator for methods
 * Usage: @Cache({ ttl: 300, keyGenerator: (id) => `user:${id}` })
 */
export function Cache(options: CacheDecoratorOptions = {}) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;
    const cacheService = new CacheService();

    descriptor.value = async function (...args: any[]) {
      // Generate cache key with version (defaults to v1)
      const version = options.version || 'v1';
      let cacheKey: string;
      
      if (options.keyGenerator) {
        cacheKey = options.keyGenerator(...args);
        // Don't modify the key if it already includes version (v1, v2, etc.)
        // Custom keyGenerators should handle their own versioning
      } else {
        const argsKey = args.length > 0 ? `:${args.join(":")}` : "";
        cacheKey = `${target.constructor.name.toLowerCase()}:${version}:${propertyName}${argsKey}`;
      }

      // Try to get from cache
      const cached = await cacheService.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await method.apply(this, args);

      // Cache the result
      if (result !== null && result !== undefined) {
        await cacheService.set(cacheKey, result, options.ttl);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Cache invalidation decorator
 * Usage: @InvalidateCache({ patterns: ['user:*', 'users:*'] })
 */
export function InvalidateCache(options: { patterns: string[] }) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;
    const cacheService = new CacheService();

    descriptor.value = async function (...args: any[]) {
      // Execute original method
      const result = await method.apply(this, args);

      // Invalidate cache patterns
      for (const pattern of options.patterns) {
        await cacheService.deletePattern(pattern);
      }

      return result;
    };

    return descriptor;
  };
}
