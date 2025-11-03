// REST-specific wrapper for shared test-base
import { setupAuth as sharedSetupAuth, TestBase as SharedTestBase, withAuthentication as sharedWithAuthentication } from '../../shared/test-base.js';
import { RestClient } from './rest-client.js';
import { REST_BASE_URL } from '../../config/test-config.js';

// REST-specific TestBase
export class TestBase extends SharedTestBase {
  constructor() {
    const restClient = new RestClient(REST_BASE_URL);
    super(restClient, null); // REST doesn't need queries, auth service handles endpoints internally
  }
}

// REST-specific auth setup function
export async function setupAuth() {
  const restClient = new RestClient(REST_BASE_URL);
  return await sharedSetupAuth(restClient, null); // REST doesn't need queries
}

// REST-specific withAuthentication wrapper
export function withAuthentication(testFunction) {
  const restClient = new RestClient(REST_BASE_URL);
  return sharedWithAuthentication(restClient, null, testFunction); // REST doesn't need queries
}