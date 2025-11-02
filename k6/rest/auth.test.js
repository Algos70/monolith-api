import { sleep } from "k6";
import { AuthService } from "../shared/auth-service.js";
import { RestClient } from "./utils/rest-client.js";
import { REST_BASE_URL, TEST_CONFIG } from "../config/test-config.js";

export const options = TEST_CONFIG.SMOKE_TEST_OPTIONS;

export default async function () {
  console.log("Starting REST Authentication Tests");

  const restClient = new RestClient(REST_BASE_URL);
  const authService = new AuthService(restClient);

  // Run comprehensive authentication workflow test
  await authService.runAuthWorkflowTest();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  // Run edge case tests
  await authService.runEdgeCaseTests();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  // Run negative tests
  await authService.runNegativeTests();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  console.log("REST Authentication Tests Completed");
}