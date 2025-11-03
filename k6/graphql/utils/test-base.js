// GraphQL-specific wrapper for shared test-base
import { setupAuth as sharedSetupAuth, TestBase as SharedTestBase, withAuthentication as sharedWithAuthentication } from '../../shared/test-base.js';
import { GraphQLClient } from './graphql-client.js';
import { AUTH_QUERIES } from '../queries/auth-queries.js';

// GraphQL-specific TestBase
export class TestBase extends SharedTestBase {
  constructor() {
    const graphqlClient = new GraphQLClient();
    super(graphqlClient, AUTH_QUERIES);
  }
}

// GraphQL-specific auth setup function
export async function setupAuth() {
  const graphqlClient = new GraphQLClient();
  return await sharedSetupAuth(graphqlClient, AUTH_QUERIES);
}

// GraphQL-specific withAuthentication wrapper
export function withAuthentication(testFunction) {
  const graphqlClient = new GraphQLClient();
  return sharedWithAuthentication(graphqlClient, AUTH_QUERIES, testFunction);
}