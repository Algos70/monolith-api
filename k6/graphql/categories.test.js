import { sleep } from "k6";
import { CategoryService } from "../shared/category-service.js";
import { GraphQLClient } from "./utils/graphql-client.js";
import {
  GET_CATEGORIES,
  GET_CATEGORY_PRODUCTS,
} from "./queries/category-queries.js";
import { TEST_CONFIG } from "../config/test-config.js";
import { setupAuth } from "./utils/test-base.js";

export const options = TEST_CONFIG.SMOKE_TEST_OPTIONS;

export default async function () {
  console.log("Starting Category User Queries Tests");
  console.log("====================================");

  const { sessionHeaders } = setupAuth();

  // Create GraphQL client and category service with authenticated session
  const graphqlClient = new GraphQLClient();
  const categoryQueries = {
    GET_CATEGORIES,
    GET_CATEGORY_PRODUCTS,
  };
  
  const categoryService = new CategoryService(graphqlClient, categoryQueries);
  categoryService.setSessionHeaders(sessionHeaders);

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