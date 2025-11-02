import { sleep } from "k6";
import { WalletService } from "./services/wallet-service.js";
import { TEST_CONFIG } from "./config/test-config.js";
import { setupAuth } from "./utils/test-base.js";

export const options = TEST_CONFIG.SMOKE_TEST_OPTIONS;

export default async function () {
  console.log("Starting Wallet User Queries Tests");
  console.log("==========================================");

  const { sessionHeaders } = setupAuth();

  // Create wallet service with authenticated session
  const walletService = new WalletService(undefined, sessionHeaders);

  // Run comprehensive wallet workflow test - this covers all main wallet operations
  // Creates USD wallet, tests all queries, increases balance, and verifies operations
  await walletService.runWalletWorkflowTest();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  // Run comprehensive multi-wallet test (EUR wallet creation, operations, and cleanup)
  await walletService.runMultiWalletTest();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  // Run edge case tests
  await walletService.runEdgeCaseTests();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  // Run negative flow tests
  await walletService.runNegativeFlowTests();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);


  console.log("Wallet User Tests Completed");
  console.log("==========================================");
}
