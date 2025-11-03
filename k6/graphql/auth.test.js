import { sleep } from "k6";
import { AuthService } from "../shared/auth-service.js";
import { GraphQLClient } from './utils/graphql-client.js';
import { TEST_CONFIG } from "../config/test-config.js";
import { AUTH_QUERIES } from "./queries/auth-queries.js";

export const options = TEST_CONFIG.SMOKE_TEST_OPTIONS;

export default async function () {
  console.log("Starting Authentication Tests");

  const authService = new AuthService(new GraphQLClient(), AUTH_QUERIES);

  // Run comprehensive authentication workflow test
  await authService.runAuthWorkflowTest();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  // Run edge case tests
  await authService.runEdgeCaseTests();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  // Run negative tests
  await authService.runNegativeTests();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  console.log("Authentication Tests Completed");
}
