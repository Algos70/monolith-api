import { sleep } from "k6";
import { CategoryService } from "../shared/category-service.js";
import { RestClient } from "./utils/rest-client.js";
import { REST_BASE_URL, TEST_CONFIG } from "../config/test-config.js";
import { setupAuth } from "./utils/test-base.js";

export const options = TEST_CONFIG.SMOKE_TEST_OPTIONS;

export default async function () {
  console.log("Starting REST Category Tests");

  const { sessionHeaders } = setupAuth();

  // Create REST client and category service with authenticated session
  const restClient = new RestClient(REST_BASE_URL);
  const categoryService = new CategoryService(restClient);
  categoryService.setSessionHeaders(sessionHeaders);

  // Run comprehensive category workflow test
  await categoryService.runCategoryWorkflowTest("electronics");
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
  
  // Run edge case tests
  await categoryService.runEdgeCaseTests();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  // Run comprehensive negative tests
  await categoryService.runNegativeTests();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  console.log("REST Category Tests Completed");
}

