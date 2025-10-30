import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { RateLimitError } from '../plugins/rateLimitPlugin';

export function formatError(formattedError: GraphQLFormattedError, error: unknown): GraphQLFormattedError {
  // Handle rate limit errors
  if (error instanceof RateLimitError) {
    return {
      message: formattedError.message,
      extensions: {
        code: 'RATE_LIMIT_EXCEEDED',
        resetTime: error.resetTime,
        remaining: error.remaining,
        retryAfter: Math.ceil((error.resetTime - Date.now()) / 1000)
      },
      locations: formattedError.locations,
      path: formattedError.path,
    };
  }

  // Handle other GraphQL errors
  if (error instanceof GraphQLError) {
    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production') {
      // Only expose safe error codes
      const safeCodes = [
        'BAD_USER_INPUT',
        'UNAUTHENTICATED',
        'FORBIDDEN',
        'RATE_LIMIT_EXCEEDED'
      ];

      if (error.extensions?.code && safeCodes.includes(error.extensions.code as string)) {
        return formattedError;
      }

      return {
        message: 'Internal server error',
        extensions: {
          code: 'INTERNAL_ERROR'
        }
      };
    }
  }

  return formattedError;
}