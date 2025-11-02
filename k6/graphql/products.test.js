import { sleep } from "k6";
import { ProductService } from "./services/product-service.js";
import { TEST_CONFIG } from "./config/test-config.js";
import { setupAuth } from "./utils/test-base.js";

export const options = TEST_CONFIG.SMOKE_TEST_OPTIONS;

export default async function () {
  const { sessionHeaders } = setupAuth();

  const productService = new ProductService(undefined, sessionHeaders);

  await productService.runProductWorkflowTest("airpods-pro");
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  await productService.runEdgeCaseTests();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  await productService.runNegativeFlowTests();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
}
