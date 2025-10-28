import { CacheService } from "../services/index";

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
        // Add version if not already included in custom key
        if (!cacheKey.includes(':v')) {
          const parts = cacheKey.split(':');
          if (parts.length === 1) {
            // Single part key like "products" -> "products:v1"
            cacheKey = `${cacheKey}:${version}`;
          } else {
            // Multi-part key like "product:slug" -> "product:v1:slug"
            cacheKey = `${parts[0]}:${version}:${parts.slice(1).join(':')}`;
          }
        }
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
