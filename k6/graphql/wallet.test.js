import { sleep } from "k6";
import { WalletService } from "./services/wallet-service.js";
import { TEST_CONFIG } from "./config/test-config.js";
import { setupAuth } from "./utils/test-base.js";

export const options = TEST_CONFIG.SMOKE_TEST_OPTIONS;

export default async function () {
  console.log("\n💰 Starting Wallet User Queries Tests");
  console.log("==========================================");

  const { user, sessionHeaders, cleanup } = setupAuth();

  // Create wallet service with authenticated session
  const walletService = new WalletService(undefined, sessionHeaders);

  // Test 1: Create a new USD wallet first
  const createWalletResponse = await walletService.createUserWallet({
    input: {
      currency: "USD",
      initialBalanceMinor: "1000", // $10.00 in minor units (cents)
    },
  });
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  // Test 2: Get user wallets - Should now include the created wallet
  const createdWallet = createWalletResponse.parsed?.data?.createUserWallet?.wallet;
  await walletService.getUserWallets({}, createdWallet);
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  // Test 3: Get wallet by currency (USD) - Should match created wallet
  await walletService.getUserWalletByCurrency({
    currency: "USD",
  }, createdWallet);
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  // Test 4: Get wallet balance for USD - Should match initial balance
  await walletService.getUserWalletBalance({
    currency: "USD",
  }, 1000); // Expected balance: 1000 (initial balance)
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);

  // Test 5: Increase wallet balance and verify new balance (Integration Test)
  const walletId = createWalletResponse.parsed?.data?.createUserWallet?.wallet?.id;
  if (walletId) {
    await walletService.increaseBalanceAndVerify(
      walletId,
      500, // Add $5.00
      "USD",
      1500 // Expected new balance: 1000 + 500 = 1500
    );
    sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
  }
  
  // Test 6: Run comprehensive multi-wallet test (EUR wallet creation, operations, and cleanup)
  await walletService.runMultiWalletTest();
  sleep(TEST_CONFIG.TIMEOUTS.DEFAULT_SLEEP);
  
  console.log("\n✅ Wallet User Tests Completed");
}
