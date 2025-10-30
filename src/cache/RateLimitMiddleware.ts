import { Request, Response, NextFunction } from "express";
import {
  RateLimitService,
  RateLimitConfig,
} from "../services/RateLimitService";

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyPrefix?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  onLimitReached?: (req: Request, res: Response) => void;
  message?: string;
}

export class RateLimitMiddleware {
  private rateLimitService: RateLimitService;

  constructor() {
    this.rateLimitService = new RateLimitService();
  }

  /**
   * Create rate limit middleware for IP-based limiting
   */
  createIPRateLimit(options: RateLimitOptions = {}) {
    const config: RateLimitConfig = {
      windowMs: options.windowMs || 60000, // 1 minute default
      maxRequests: options.maxRequests || 100,
      keyPrefix: options.keyPrefix || "api",
    };

    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const ip = this.getClientIP(req);
        const result = await this.rateLimitService.checkIPLimit(ip, "api");

        // Set rate limit headers
        this.setRateLimitHeaders(res, result);

        if (!result.allowed) {
          if (options.onLimitReached) {
            options.onLimitReached(req, res);
          }

          return res.status(429).json({
            error: options.message || "Too many requests",
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          });
        }

        next();
      } catch (error) {
        console.error("Rate limit middleware error:", error);
        // Fail open - allow request on error
        next();
      }
    };
  }

  /**
   * Create rate limit middleware for user-based limiting
   */
  createUserRateLimit(options: RateLimitOptions = {}) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = this.getUserId(req);

        if (!userId) {
          // Fall back to IP-based limiting for unauthenticated users
          return this.createIPRateLimit(options)(req, res, next);
        }

        const result = await this.rateLimitService.checkUserLimit(
          userId,
          "userApi"
        );

        this.setRateLimitHeaders(res, result);

        if (!result.allowed) {
          if (options.onLimitReached) {
            options.onLimitReached(req, res);
          }

          return res.status(429).json({
            error: options.message || "Too many requests",
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          });
        }

        next();
      } catch (error) {
        console.error("User rate limit middleware error:", error);
        next();
      }
    };
  }

  /**
   * Create endpoint-specific rate limit
   */
  createEndpointRateLimit(
    config: RateLimitConfig,
    options: RateLimitOptions = {}
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const ip = this.getClientIP(req);
        const endpoint = req.route?.path || req.path;

        const result = await this.rateLimitService.checkEndpointLimit(
          ip,
          endpoint,
          config
        );

        this.setRateLimitHeaders(res, result);

        if (!result.allowed) {
          if (options.onLimitReached) {
            options.onLimitReached(req, res);
          }

          return res.status(429).json({
            error: options.message || `Too many requests to ${endpoint}`,
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          });
        }

        next();
      } catch (error) {
        console.error("Endpoint rate limit middleware error:", error);
        next();
      }
    };
  }

  /**
   * Auth-specific rate limiting (stricter limits)
   */
  createAuthRateLimit() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const ip = this.getClientIP(req);
        const result = await this.rateLimitService.checkIPLimit(ip, "auth");

        this.setRateLimitHeaders(res, result);

        if (!result.allowed) {
          return res.status(429).json({
            error: "Too many authentication attempts",
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          });
        }

        next();
      } catch (error) {
        console.error("Auth rate limit middleware error:", error);
        next();
      }
    };
  }

  /**
   * Catalog-specific rate limiting (higher limits)
   */
  createCatalogRateLimit() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = this.getUserId(req);
        const ip = this.getClientIP(req);

        let result;
        if (userId) {
          // Higher limits for authenticated users
          result = await this.rateLimitService.checkUserLimit(
            userId,
            "userCatalog"
          );
        } else {
          // Standard limits for anonymous users
          result = await this.rateLimitService.checkIPLimit(ip, "catalog");
        }

        this.setRateLimitHeaders(res, result);

        if (!result.allowed) {
          return res.status(429).json({
            error: "Too many catalog requests",
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          });
        }

        next();
      } catch (error) {
        console.error("Catalog rate limit middleware error:", error);
        next();
      }
    };
  }

  /**
   * Extract client IP address
   */
  private getClientIP(req: Request): string {
    return (
      req.ip ||
      req.socket.remoteAddress ||
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      "unknown"
    );
  }

  /**
   * Extract user ID from request (assumes user is attached to req)
   */
  private getUserId(req: Request): string | null {
    // Adjust this based on your auth implementation
    return (req as any).user?.id || (req as any).userId || null;
  }

  /**
   * Set standard rate limit headers
   */
  private setRateLimitHeaders(res: Response, result: any) {
    res.set({
      "X-RateLimit-Limit": result.total.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
    });
  }
}

// Export singleton instance
export const rateLimitMiddleware = new RateLimitMiddleware();