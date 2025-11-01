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

      // Try to get from cache with error handling
      let cached = null;
      try {
        cached = await cacheService.get(cacheKey);
        if (cached !== null) {
          return cached;
        }
      } catch (cacheError) {
        console.warn('Cache read error, proceeding without cache:', cacheError);
      }

      // Execute original method
      const result = await method.apply(this, args);

      // Cache the result with error handling
      if (result !== null && result !== undefined) {
        try {
          await cacheService.set(cacheKey, result, options.ttl);
        } catch (cacheError) {
          console.warn('Cache write error, result still returned:', cacheError);
        }
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

      // Invalidate cache patterns with error handling
      for (const pattern of options.patterns) {
        try {
          await cacheService.deletePattern(pattern);
        } catch (cacheError) {
          console.warn('Cache invalidation error, operation still completed:', cacheError);
        }
      }

      return result;
    };

    return descriptor;
  };
}
