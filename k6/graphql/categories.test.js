import { sleep } from "k6";
import { CategoryService } from "./services/category-service.js";
import { TEST_CONFIG } from "./config/test-config.js";
import { setupAuth } from "./utils/test-base.js";

export const options = TEST_CONFIG.SMOKE_TEST_OPTIONS;

export default async function () {
  console.log("Starting Category User Queries Tests");
  console.log("====================================");

  const { user, sessionHeaders, cleanup } = setupAuth();

  // Create category service with authenticated session
  const categoryService = new CategoryService(undefined, sessionHeaders);

  // Run comprehensive category workflow test
  // Uses real category "electronics" from the database (adjust as needed)
  await categoryService.runCategoryWorkflowTest("electronics");
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  // Run edge case tests
  await categoryService.runEdgeCaseTests();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  // Run comprehensive negative tests
  await categoryService.runNegativeTests();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  console.log("Category User Tests Completed");
  console.log("============================");
}