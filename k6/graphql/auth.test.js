import { sleep } from "k6";
import { AuthService } from "./services/auth-service.js";
import { TEST_CONFIG } from "../config/test-config.js";

export const options = TEST_CONFIG.SMOKE_TEST_OPTIONS;

export default async function () {
  console.log("Starting Authentication Tests");

  const authService = new AuthService();

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
