import { sleep } from "k6";
import { ProductService } from "../shared/product-service.js";
import { RestClient } from "./utils/rest-client.js";
import { TEST_CONFIG } from "../config/test-config.js";
import { setupAuth } from "./utils/test-base.js";

export const options = TEST_CONFIG.SMOKE_TEST_OPTIONS;

export default async function () {
  const { sessionHeaders } = setupAuth();
  const client = new RestClient();
  
  // ProductService will automatically detect this is a REST client
  // No queries needed for REST - the service handles URL construction
  const productService = new ProductService(client);
  productService.setSessionHeaders(sessionHeaders);

  await productService.runProductWorkflowTest("airpods-pro");
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);


  await productService.runEdgeCaseTests();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  await productService.runNegativeFlowTests();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
}