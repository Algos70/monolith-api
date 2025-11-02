import { ApolloServerPlugin, GraphQLRequestListener } from "@apollo/server";
import { RateLimitService } from "../../services/RateLimitService";

export interface GraphQLRateLimitConfig {
  // Query/mutation specific limits
  queryLimits?: Record<string, { windowMs: number; maxRequests: number }>;
  // General GraphQL limits
  generalLimit?: { windowMs: number; maxRequests: number };
  // Complexity-based limiting
  complexityLimit?: { windowMs: number; maxComplexity: number };
}

export class GraphQLRateLimitPlugin implements ApolloServerPlugin {
  private rateLimitService: RateLimitService;
  private config: GraphQLRateLimitConfig;

  constructor(config: GraphQLRateLimitConfig = {}) {
    this.rateLimitService = new RateLimitService();
    this.config = {
      generalLimit: { windowMs: 60000, maxRequests: 300 }, // 300 req/min default (3x)
      queryLimits: {
        // PUBLIC CATALOG QUERIES - High limits for user-facing operations
        products: { windowMs: 60000, maxRequests: 900 },
        product: { windowMs: 60000, maxRequests: 1200 },
        productBySlug: { windowMs: 60000, maxRequests: 1200 },
        productsByCategory: { windowMs: 60000, maxRequests: 900 },

        featuredProducts: { windowMs: 60000, maxRequests: 300 },
        searchProducts: { windowMs: 60000, maxRequests: 600 },

        categories: { windowMs: 60000, maxRequests: 900 },
        category: { windowMs: 60000, maxRequests: 1200 },
        categoryBySlug: { windowMs: 60000, maxRequests: 1200 },
        categoryProducts: { windowMs: 60000, maxRequests: 900 },

        // USER OPERATIONS - Moderate limits
        userCart: { windowMs: 60000, maxRequests: 600 },
        userOrders: { windowMs: 60000, maxRequests: 300 },
        userWallets: { windowMs: 60000, maxRequests: 300 },
        userWalletByCurrency: { windowMs: 60000, maxRequests: 450 },
        userWalletBalance: { windowMs: 60000, maxRequests: 300 },

        // USER MUTATIONS - Stricter limits
        addItemToCart: { windowMs: 60000, maxRequests: 150 },
        updateItemQuantity: { windowMs: 60000, maxRequests: 150 },
        decreaseItemQuantity: { windowMs: 60000, maxRequests: 150 },
        removeItemFromCart: { windowMs: 60000, maxRequests: 90 },
        clearCart: { windowMs: 60000, maxRequests: 30 },
        createOrderFromCart: { windowMs: 60000, maxRequests: 30 },
        createUserWallet: { windowMs: 60000, maxRequests: 15 },
        increaseUserWalletBalance: { windowMs: 60000, maxRequests: 60 },
        deleteUserWallet: { windowMs: 60000, maxRequests: 15 },
        transferFromUserWallet: { windowMs: 60000, maxRequests: 30 },

        // ADMIN QUERIES - Moderate limits
        adminProducts: { windowMs: 60000, maxRequests: 300 },
        adminProduct: { windowMs: 60000, maxRequests: 450 },
        adminProductBySlug: { windowMs: 60000, maxRequests: 450 },
        adminProductsByCategory: { windowMs: 60000, maxRequests: 300 },
        adminProductStockCheck: { windowMs: 60000, maxRequests: 600 },

        adminCategories: { windowMs: 60000, maxRequests: 300 },
        adminCategory: { windowMs: 60000, maxRequests: 450 },
        adminCategoryBySlug: { windowMs: 60000, maxRequests: 450 },

        adminUsers: { windowMs: 60000, maxRequests: 300 },
        adminUser: { windowMs: 60000, maxRequests: 450 },
        adminUserWithRelations: { windowMs: 60000, maxRequests: 300 },

        adminOrders: { windowMs: 60000, maxRequests: 300 },
        adminOrder: { windowMs: 60000, maxRequests: 450 },
        adminOrdersByStatus: { windowMs: 60000, maxRequests: 300 },
        adminOrdersByUser: { windowMs: 60000, maxRequests: 300 },

        adminOrderItems: { windowMs: 60000, maxRequests: 300 },
        adminOrderItem: { windowMs: 60000, maxRequests: 450 },
        adminOrderItemsByOrder: { windowMs: 60000, maxRequests: 300 },
        adminOrderItemsByProduct: { windowMs: 60000, maxRequests: 300 },

        adminWallets: { windowMs: 60000, maxRequests: 300 },
        adminWallet: { windowMs: 60000, maxRequests: 450 },
        adminWalletsByUser: { windowMs: 60000, maxRequests: 300 },
        adminWalletsByCurrency: { windowMs: 60000, maxRequests: 300 },
        adminWalletByUserAndCurrency: { windowMs: 60000, maxRequests: 450 },
        adminWalletBalance: { windowMs: 60000, maxRequests: 300 },

        adminCarts: { windowMs: 60000, maxRequests: 300 },
        adminCart: { windowMs: 60000, maxRequests: 450 },
        adminCartWithRelations: { windowMs: 60000, maxRequests: 300 },
        adminCartsByUser: { windowMs: 60000, maxRequests: 300 },
        adminCartStats: { windowMs: 60000, maxRequests: 150 },

        // ADMIN MUTATIONS - Strict limits for data modification
        // Product mutations
        adminCreateProduct: { windowMs: 60000, maxRequests: 30 },
        adminUpdateProduct: { windowMs: 60000, maxRequests: 60 },
        adminDeleteProduct: { windowMs: 60000, maxRequests: 15 },
        adminIncreaseProductStock: { windowMs: 60000, maxRequests: 90 },
        adminDecreaseProductStock: { windowMs: 60000, maxRequests: 90 },
        adminUpdateProductPrice: { windowMs: 60000, maxRequests: 60 },

        // Category mutations
        adminCreateCategory: { windowMs: 60000, maxRequests: 30 },
        adminUpdateCategory: { windowMs: 60000, maxRequests: 60 },
        adminDeleteCategory: { windowMs: 60000, maxRequests: 15 },

        // User mutations
        adminCreateUser: { windowMs: 60000, maxRequests: 30 },
        adminUpdateUser: { windowMs: 60000, maxRequests: 60 },
        adminDeleteUser: { windowMs: 60000, maxRequests: 15 },

        // Order mutations
        adminCreateOrder: { windowMs: 60000, maxRequests: 30 },
        adminUpdateOrder: { windowMs: 60000, maxRequests: 60 },
        adminUpdateOrderStatus: { windowMs: 60000, maxRequests: 90 },
        adminDeleteOrder: { windowMs: 60000, maxRequests: 15 },

        // OrderItem mutations
        adminCreateOrderItem: { windowMs: 60000, maxRequests: 60 },
        adminUpdateOrderItem: { windowMs: 60000, maxRequests: 90 },
        adminUpdateOrderItemQuantity: { windowMs: 60000, maxRequests: 90 },
        adminUpdateOrderItemPrice: { windowMs: 60000, maxRequests: 60 },
        adminDeleteOrderItem: { windowMs: 60000, maxRequests: 30 },

        // Wallet mutations
        adminCreateWallet: { windowMs: 60000, maxRequests: 30 },
        adminDeleteWallet: { windowMs: 60000, maxRequests: 15 },
        adminIncreaseWalletBalance: { windowMs: 60000, maxRequests: 60 },
        adminDecreaseWalletBalance: { windowMs: 60000, maxRequests: 60 },
        adminTransferBetweenWallets: { windowMs: 60000, maxRequests: 30 },

        // Cart mutations
        adminDeleteCart: { windowMs: 60000, maxRequests: 30 },
      },
      ...config,
    };
  }

  async requestDidStart(): Promise<GraphQLRequestListener<any>> {
    return {
      didResolveOperation: async (requestContext) => {
        const { request, contextValue } = requestContext;

        if (!request.operationName && !request.query) {
          return;
        }

        try {
          // Extract operation info
          const operationInfo = this.extractOperationInfo(request.query || "");
          const ip = this.getClientIP(contextValue);

          // Apply general GraphQL rate limiting first
          await this.checkGeneralLimit(ip);

          // Apply operation-specific rate limiting
          if (operationInfo.operations.length > 0) {
            await this.checkOperationLimits(ip, operationInfo.operations);
          }
        } catch (error) {
          if (error instanceof RateLimitError) {
            throw error;
          }
          console.error("GraphQL rate limit error:", error);
          // Fail open on unexpected errors
        }
      },
    };
  }

  private async checkGeneralLimit(ip: string): Promise<void> {
    if (!this.config.generalLimit) return;

    // Always use IP-based rate limiting for GraphQL
    const result = await this.rateLimitService.checkIPLimit(ip, "api");

    if (!result.allowed) {
      throw new RateLimitError(
        "GraphQL rate limit exceeded",
        result.resetTime,
        result.remaining
      );
    }
  }

  private async checkOperationLimits(
    ip: string,
    operations: string[]
  ): Promise<void> {
    if (!this.config.queryLimits) return;

    for (const operation of operations) {
      const limit = this.config.queryLimits[operation];
      if (!limit) continue;

      // Always use IP-based rate limiting for GraphQL operations
      const identifier = `${operation}:${ip}`;
      const customConfig = { ...limit, keyPrefix: "graphql" };

      const result = await this.rateLimitService.checkCustomLimit(
        identifier,
        customConfig
      );

      if (!result.allowed) {
        throw new RateLimitError(
          `Rate limit exceeded for operation: ${operation}`,
          result.resetTime,
          result.remaining
        );
      }
    }
  }

  private extractOperationInfo(query: string): {
    operations: string[];
    type: "query" | "mutation";
  } {
    const operations: string[] = [];
    let type: "query" | "mutation" = "query";

    try {
      // Simple regex to extract operation names
      // This is a basic implementation - you might want to use a proper GraphQL parser
      const queryMatch = query.match(/query\s*{?\s*([^{(]+)/);
      const mutationMatch = query.match(/mutation\s*{?\s*([^{(]+)/);

      if (mutationMatch) {
        type = "mutation";
        const operationNames = mutationMatch[1]
          .split(/[,\s]+/)
          .map((op) => op.trim())
          .filter((op) => op && !op.includes("{") && !op.includes("("));
        operations.push(...operationNames);
      } else if (queryMatch) {
        const operationNames = queryMatch[1]
          .split(/[,\s]+/)
          .map((op) => op.trim())
          .filter((op) => op && !op.includes("{") && !op.includes("("));
        operations.push(...operationNames);
      }

      // Also try to extract from selection sets
      const selectionMatches = query.match(
        /{[\s\S]*?([a-zA-Z][a-zA-Z0-9]*)\s*[\({]/g
      );
      if (selectionMatches) {
        selectionMatches.forEach((match) => {
          const opMatch = match.match(/([a-zA-Z][a-zA-Z0-9]*)\s*[\({]/);
          if (opMatch && opMatch[1]) {
            operations.push(opMatch[1]);
          }
        });
      }
    } catch (error) {
      console.error("Error parsing GraphQL query:", error);
    }

    return {
      operations: [...new Set(operations)], // Remove duplicates
      type,
    };
  }

  private getClientIP(contextValue: any): string {
    const req = contextValue?.req;
    if (!req) return "unknown";

    return (
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      "unknown"
    );
  }
}

export class RateLimitError extends Error {
  public resetTime: number;
  public remaining: number;

  constructor(message: string, resetTime: number, remaining: number) {
    super(message);
    this.name = "RateLimitError";
    this.resetTime = resetTime;
    this.remaining = remaining;
  }
}

// Export configured plugin instances
export const createGraphQLRateLimitPlugin = (
  config?: GraphQLRateLimitConfig
) => {
  return new GraphQLRateLimitPlugin(config);
};
