import { check } from "k6";
import { GraphQLClient } from "../utils/graphql-client.js";
import { WALLET_QUERIES, WALLET_MUTATIONS } from "../queries/wallet-queries.js";

export class WalletService {
  constructor(client = new GraphQLClient(), sessionHeaders = {}) {
    this.client = client;
    this.sessionHeaders = sessionHeaders;
  }

  async getUserWallets(variables = {}, expectedWallet = null) {
    const response = this.client.requestWithParsing(
      WALLET_QUERIES.GET_USER_WALLETS,
      variables,
      this.sessionHeaders
    );

    check(response, {
      "userWallets: response parsed": (r) => r.parsed !== null,
      "userWallets: success is true": (r) =>
        r.parsed?.data?.userWallets?.success === true,
      "userWallets: message contains 'Found'": (r) =>
        r.parsed?.data?.userWallets?.message?.includes("Found"),
    });

    check(response, {
      "userWallets: wallets array exists": (r) =>
        Array.isArray(r.parsed?.data?.userWallets?.wallets),
    });

    // If we expect a specific wallet, validate it
    if (expectedWallet) {
      check(response, {
        "userWallets: has exactly one wallet": (r) =>
          r.parsed?.data?.userWallets?.wallets?.length === 1,
        "userWallets: wallet matches expected wallet": (r) => {
          const wallets = r.parsed?.data?.userWallets?.wallets;
          if (!wallets || wallets.length !== 1) return false;
          const wallet = wallets[0];
          return (
            wallet &&
            wallet.id === expectedWallet.id &&
            wallet.currency === expectedWallet.currency &&
            wallet.balanceMinor === expectedWallet.balanceMinor
          );
        },
      });
    } else {
      // General validation when no specific wallet is expected
      check(response, {
        "userWallets: has wallets": (r) =>
          r.parsed?.data?.userWallets?.wallets?.length >= 0,
      });
    }

    check(response, {
      "userWallets: wallet has required fields": (r) => {
        const wallets = r.parsed?.data?.userWallets?.wallets;
        if (!wallets || wallets.length === 0) return true; // Empty is valid
        const w = wallets[0];
        return (
          w &&
          w.id &&
          w.currency &&
          w.balanceMinor &&
          w.createdAt &&
          w.updatedAt &&
          w.user &&
          w.user.id &&
          w.user.email
        );
      },
    });

    return response;
  }

  async getUserWalletByCurrency(variables = {}, expectedWallet = null) {
    const response = this.client.requestWithParsing(
      WALLET_QUERIES.GET_USER_WALLET_BY_CURRENCY,
      variables,
      this.sessionHeaders
    );

    check(response, {
      "userWalletByCurrency: response parsed": (r) => r.parsed !== null,
      "userWalletByCurrency: success true": (r) =>
         r.parsed?.data?.userWalletByCurrency?.success === true,
      "userWalletByCurrency: wallet found": (r) =>
        r.parsed?.data?.userWalletByCurrency?.message?.includes("found"),
    });

    // Check wallet data based on success status
    check(response, {
      "userWalletByCurrency: wallet data is valid": (r) => {
        const result = r.parsed?.data?.userWalletByCurrency;
        if (!result) return false;
        
        // If success is false, wallet should be null
        if (!result.success) {
          return result.wallet === null;
        }
        
        // If success is true, wallet should exist and be valid
        const wallet = result.wallet;
        return (
          wallet &&
          wallet.id &&
          wallet.currency &&
          wallet.balanceMinor &&
          wallet.createdAt &&
          wallet.updatedAt &&
          wallet.user &&
          wallet.user.id &&
          wallet.user.email
        );
      },
    });

    // If we expect a specific wallet, validate it matches
    if (expectedWallet) {
      check(response, {
        "userWalletByCurrency: success should be true": (r) =>
          r.parsed?.data?.userWalletByCurrency?.success === true,
        "userWalletByCurrency: wallet matches expected wallet": (r) => {
          const result = r.parsed?.data?.userWalletByCurrency;
          if (!result || !result.success || !result.wallet) return false;
          
          const wallet = result.wallet;
          return (
            wallet.id === expectedWallet.id &&
            wallet.currency === expectedWallet.currency &&
            wallet.balanceMinor === expectedWallet.balanceMinor
          );
        },
      });
    }

    return response;
  }

  async getUserWalletBalance(variables = {}, expectedBalance = null) {
    const response = this.client.requestWithParsing(
      WALLET_QUERIES.GET_USER_WALLET_BALANCE,
      variables,
      this.sessionHeaders
    );

    check(response, {
      "userWalletBalance: response parsed": (r) => r.parsed !== null,
      "userWalletBalance: success is true": (r) =>
        r.parsed?.data?.userWalletBalance?.success === true,
      "userWalletBalance: message contains 'successfully'": (r) =>
        r.parsed?.data?.userWalletBalance?.message?.includes("successfully"),
      "userWalletBalance: balance is numeric string": (r) => {
        const balance = r.parsed?.data?.userWalletBalance?.balance;
        return balance && !isNaN(Number(balance));
      },
    });

    // If expectedBalance is provided, validate it matches
    if (expectedBalance !== null) {
      check(response, {
        "userWalletBalance: success should be true": (r) =>
          r.parsed?.data?.userWalletBalance?.success === true,
        "userWalletBalance: balance matches expected": (r) => {
          const result = r.parsed?.data?.userWalletBalance;
          if (!result || !result.success) return false;
          const actualBalance = result.balance;
          const expectedBalanceStr = expectedBalance.toString();
          return actualBalance === expectedBalanceStr;
        },
        "userWalletBalance: message indicates success": (r) =>
          r.parsed?.data?.userWalletBalance?.message?.includes("successfully"),
      });
    }

    return response;
  }

  async createUserWallet(variables = {}) {
    const response = this.client.requestWithParsing(
      WALLET_MUTATIONS.CREATE_USER_WALLET,
      variables,
      this.sessionHeaders
    );

    check(response, {
      "createUserWallet: response parsed": (r) => r.parsed !== null,
      "createUserWallet: success true": (r) =>
        r.parsed?.data?.createUserWallet?.success === true,
      "createUserWallet: message is correct": (r) =>
        r.parsed?.data?.createUserWallet?.message === "Wallet created successfully",
    });

    check(response, {
      "createUserWallet: wallet has required fields": (r) => {
        const wallet = r.parsed?.data?.createUserWallet?.wallet;
        return (
          wallet &&
          wallet.id &&
          wallet.currency &&
          wallet.balanceMinor &&
          wallet.createdAt &&
          wallet.updatedAt &&
          wallet.user &&
          wallet.user.id &&
          wallet.user.email
        );
      },
    });

    return response;
  }

  async increaseUserWalletBalance(variables = {}) {
    const response = this.client.requestWithParsing(
      WALLET_MUTATIONS.INCREASE_USER_WALLET_BALANCE,
      variables,
      this.sessionHeaders
    );

    check(response, {
      "increaseUserWalletBalance: response parsed": (r) => r.parsed !== null,
      "increaseUserWalletBalance: success is true": (r) =>
        r.parsed?.data?.increaseUserWalletBalance?.success === true,
      "increaseUserWalletBalance: message contains 'successfully'": (r) =>
        r.parsed?.data?.increaseUserWalletBalance?.message?.includes("successfully"),
    });

    return response;
  }

  // Integration test: Increase balance and verify the new balance
  async increaseBalanceAndVerify(walletId, amountMinor, currency, expectedNewBalance) {
    // Step 1: Increase balance
    const increaseResponse = this.client.requestWithParsing(
      WALLET_MUTATIONS.INCREASE_USER_WALLET_BALANCE,
      {
        walletId: walletId,
        input: {
          amountMinor: amountMinor.toString(),
        },
      },
      this.sessionHeaders
    );

    check(increaseResponse, {
      "increaseBalanceAndVerify: increase operation parsed": (r) => r.parsed !== null,
      "increaseBalanceAndVerify: increase operation success": (r) =>
        r.parsed?.data?.increaseUserWalletBalance?.success === true,
      "increaseBalanceAndVerify: increase operation message": (r) =>
        r.parsed?.data?.increaseUserWalletBalance?.message?.includes("successfully"),
    });

    // Step 2: Verify new balance
    const balanceResponse = this.client.requestWithParsing(
      WALLET_QUERIES.GET_USER_WALLET_BALANCE,
      {
        currency: currency,
      },
      this.sessionHeaders
    );

    check(balanceResponse, {
      "increaseBalanceAndVerify: balance check parsed": (r) => r.parsed !== null,
      "increaseBalanceAndVerify: balance check success": (r) =>
        r.parsed?.data?.userWalletBalance?.success === true,
      "increaseBalanceAndVerify: balance updated correctly": (r) => {
        const result = r.parsed?.data?.userWalletBalance;
        if (!result || !result.success) return false;
        const actualBalance = result.balance;
        const expectedBalanceStr = expectedNewBalance.toString();
        return actualBalance === expectedBalanceStr;
      },
    });

    return {
      increaseResponse,
      balanceResponse,
    };
  }

  async deleteUserWallet(variables = {}) {
    const response = this.client.requestWithParsing(
      WALLET_MUTATIONS.DELETE_USER_WALLET,
      variables,
      this.sessionHeaders
    );

    check(response, {
      "deleteUserWallet: response parsed": (r) => r.parsed !== null,
      "deleteUserWallet: returns true": (r) =>
        r.parsed?.data?.deleteUserWallet === true,
    });

    return response;
  }

  async transferFromUserWallet(variables = {}) {
    const response = this.client.requestWithParsing(
      WALLET_MUTATIONS.TRANSFER_FROM_USER_WALLET,
      variables,
      this.sessionHeaders
    );

    check(response, {
      "transferFromUserWallet: response parsed": (r) => r.parsed !== null,
      "transferFromUserWallet: success true": (r) =>
        r.parsed?.data?.transferFromUserWallet?.success === true,
      "transferFromUserWallet: message is correct": (r) =>
        r.parsed?.data?.transferFromUserWallet?.message === "Transfer completed successfully",
    });

    return response;
  }

  // Comprehensive wallet workflow test - covers all main wallet operations
  async runWalletWorkflowTest() {
    // Test 1: Create a new USD wallet first
    const createWalletResponse = await this.createUserWallet({
      input: {
        currency: "USD",
        initialBalanceMinor: "1000", // $10.00 in minor units (cents)
      },
    });

    // Test 2: Get user wallets - Should now include the created wallet
    const createdWallet = createWalletResponse.parsed?.data?.createUserWallet?.wallet;
    await this.getUserWallets({}, createdWallet);

    // Test 3: Get wallet by currency (USD) - Should match created wallet
    await this.getUserWalletByCurrency({
      currency: "USD",
    }, createdWallet);

    // Test 4: Get wallet balance for USD - Should match initial balance
    await this.getUserWalletBalance({
      currency: "USD",
    }, 1000); // Expected balance: 1000 (initial balance)

    // Test 5: Increase wallet balance and verify new balance (Integration Test)
    const walletId = createWalletResponse.parsed?.data?.createUserWallet?.wallet?.id;
    if (walletId) {
      await this.increaseBalanceAndVerify(
        walletId,
        500, // Add $5.00
        "USD",
        1500 // Expected new balance: 1000 + 500 = 1500
      );
    }

    return createWalletResponse;
  }

  // Edge case tests for wallet operations
  async runEdgeCaseTests() {
    // Test getting non-existent wallet - should return success: false
    const nonExistentWalletResponse = this.client.requestWithParsing(
      WALLET_QUERIES.GET_USER_WALLET_BY_CURRENCY,
      {
        currency: "GBP", // Non-existent currency
      },
      this.sessionHeaders
    );

    check(nonExistentWalletResponse, {
      "edgeCase: non-existent wallet response parsed": (r) => r.parsed !== null,
      "edgeCase: non-existent wallet success false": (r) =>
        r.parsed?.data?.userWalletByCurrency?.success === false,
      "edgeCase: non-existent wallet is null": (r) =>
        r.parsed?.data?.userWalletByCurrency?.wallet === null,
      "edgeCase: non-existent wallet message indicates not found": (r) =>
        r.parsed?.data?.userWalletByCurrency?.message?.includes("not found") ||
        r.parsed?.data?.userWalletByCurrency?.message?.includes("Wallet not found"),
    });

    // Test getting balance for non-existent wallet - returns success: true with balance: "0"
    const nonExistentBalanceResponse = this.client.requestWithParsing(
      WALLET_QUERIES.GET_USER_WALLET_BALANCE,
      {
        currency: "JPY", // Non-existent currency
      },
      this.sessionHeaders
    );

    check(nonExistentBalanceResponse, {
      "edgeCase: non-existent balance response parsed": (r) => r.parsed !== null,
      "edgeCase: non-existent balance success true": (r) =>
        r.parsed?.data?.userWalletBalance?.success === true,
      "edgeCase: non-existent balance returns zero": (r) =>
        r.parsed?.data?.userWalletBalance?.balance === "0",
      "edgeCase: non-existent balance message success": (r) =>
        r.parsed?.data?.userWalletBalance?.message === "Balance retrieved successfully",
    });
  }

  // Negative flow tests for wallet operations
  async runNegativeFlowTests() {
    // Test creating wallet with invalid currency (should fail - more than 3 characters)
    const invalidWalletResponse = this.client.requestWithParsing(
      WALLET_MUTATIONS.CREATE_USER_WALLET,
      {
        input: {
          currency: "INVALID", // 7 characters - exceeds 3 character limit
          initialBalanceMinor: "1000",
        },
      },
      this.sessionHeaders
    );

    check(invalidWalletResponse, {
      "negativeFlow: invalid currency wallet creation should fail": (r) => {
        // Should either have errors or success should be false
        return r.parsed?.errors || r.parsed?.data?.createUserWallet?.success === false;
      },
    });

    // Test creating wallet with another invalid currency (too long)
    const longCurrencyResponse = this.client.requestWithParsing(
      WALLET_MUTATIONS.CREATE_USER_WALLET,
      {
        input: {
          currency: "TOOLONG", // 7 characters - exceeds 3 character limit
          initialBalanceMinor: "500",
        },
      },
      this.sessionHeaders
    );

    check(longCurrencyResponse, {
      "negativeFlow: long currency wallet creation should fail": (r) => {
        // Should either have errors or success should be false
        return r.parsed?.errors || r.parsed?.data?.createUserWallet?.success === false;
      },
    });

    // Test increasing balance with invalid wallet ID
    const invalidIncreaseResponse = this.client.requestWithParsing(
      WALLET_MUTATIONS.INCREASE_USER_WALLET_BALANCE,
      {
        walletId: "invalid-wallet-id",
        input: {
          amountMinor: "100",
        },
      },
      this.sessionHeaders
    );

    check(invalidIncreaseResponse, {
      "negativeFlow: invalid wallet ID increase should fail": (r) => {
        return r.parsed?.errors || r.parsed?.data?.increaseUserWalletBalance?.success === false;
      },
    });
  }

  // Comprehensive multi-wallet test: Create EUR wallet, test operations, and cleanup
  async runMultiWalletTest() {
    const testResults = {
      createEurWallet: null,
      getEurWalletByCurrency: null,
      getAllWallets: null,
      getNonExistentWallet: null,
      deleteEurWallet: null,
      finalWalletCheck: null,
    };

    // Test 6: Create a EUR wallet for additional testing
    testResults.createEurWallet = this.client.requestWithParsing(
      WALLET_MUTATIONS.CREATE_USER_WALLET,
      {
        input: {
          currency: "EUR",
          initialBalanceMinor: "0",
        },
      },
      this.sessionHeaders
    );

    check(testResults.createEurWallet, {
      "multiWalletTest: EUR wallet creation parsed": (r) => r.parsed !== null,
      "multiWalletTest: EUR wallet creation success": (r) =>
        r.parsed?.data?.createUserWallet?.success === true,
      "multiWalletTest: EUR wallet creation message": (r) =>
        r.parsed?.data?.createUserWallet?.message === "Wallet created successfully",
      "multiWalletTest: EUR wallet has zero balance": (r) => {
        const wallet = r.parsed?.data?.createUserWallet?.wallet;
        return wallet && wallet.balanceMinor === "0";
      },
      "multiWalletTest: EUR wallet currency is correct": (r) => {
        const wallet = r.parsed?.data?.createUserWallet?.wallet;
        return wallet && wallet.currency === "EUR";
      },
    });

    // Test 7: Get wallet by currency (EUR)
    testResults.getEurWalletByCurrency = this.client.requestWithParsing(
      WALLET_QUERIES.GET_USER_WALLET_BY_CURRENCY,
      {
        currency: "EUR",
      },
      this.sessionHeaders
    );

    check(testResults.getEurWalletByCurrency, {
      "multiWalletTest: EUR wallet by currency parsed": (r) => r.parsed !== null,
      "multiWalletTest: EUR wallet by currency success": (r) =>
        r.parsed?.data?.userWalletByCurrency?.success === true,
      "multiWalletTest: EUR wallet by currency found": (r) =>
        r.parsed?.data?.userWalletByCurrency?.message?.includes("found"),
      "multiWalletTest: EUR wallet by currency has correct data": (r) => {
        const wallet = r.parsed?.data?.userWalletByCurrency?.wallet;
        return wallet && wallet.currency === "EUR" && wallet.balanceMinor === "0";
      },
    });

    // Test 8: Get all user wallets - Should now have both USD and EUR
    testResults.getAllWallets = this.client.requestWithParsing(
      WALLET_QUERIES.GET_USER_WALLETS,
      {},
      this.sessionHeaders
    );

    check(testResults.getAllWallets, {
      "multiWalletTest: all wallets parsed": (r) => r.parsed !== null,
      "multiWalletTest: all wallets success": (r) =>
        r.parsed?.data?.userWallets?.success === true,
      "multiWalletTest: has multiple wallets": (r) => {
        const wallets = r.parsed?.data?.userWallets?.wallets;
        return Array.isArray(wallets) && wallets.length >= 2;
      },
      "multiWalletTest: has both USD and EUR wallets": (r) => {
        const wallets = r.parsed?.data?.userWallets?.wallets;
        if (!Array.isArray(wallets)) return false;
        const currencies = wallets.map(w => w.currency);
        return currencies.includes("USD") && currencies.includes("EUR");
      },
    });

    // Test 9: Try to get wallet by non-existent currency (should return null)
    testResults.getNonExistentWallet = this.client.requestWithParsing(
      WALLET_QUERIES.GET_USER_WALLET_BY_CURRENCY,
      {
        currency: "GBP",
      },
      this.sessionHeaders
    );

    check(testResults.getNonExistentWallet, {
      "multiWalletTest: non-existent wallet parsed": (r) => r.parsed !== null,
      "multiWalletTest: non-existent wallet success false": (r) =>
        r.parsed?.data?.userWalletByCurrency?.success === false,
      "multiWalletTest: non-existent wallet is null": (r) =>
        r.parsed?.data?.userWalletByCurrency?.wallet === null,
      "multiWalletTest: non-existent wallet message indicates not found": (r) =>
        r.parsed?.data?.userWalletByCurrency?.message?.includes("not found") ||
        r.parsed?.data?.userWalletByCurrency?.message?.includes("No wallet"),
    });

    // Test 10: Delete the EUR wallet (should have 0 balance)
    const eurWalletId = testResults.createEurWallet.parsed?.data?.createUserWallet?.wallet?.id;
    if (eurWalletId) {
      testResults.deleteEurWallet = this.client.requestWithParsing(
        WALLET_MUTATIONS.DELETE_USER_WALLET,
        {
          walletId: eurWalletId,
        },
        this.sessionHeaders
      );

      check(testResults.deleteEurWallet, {
        "multiWalletTest: EUR wallet deletion parsed": (r) => r.parsed !== null,
        "multiWalletTest: EUR wallet deletion success": (r) =>
          r.parsed?.data?.deleteUserWallet === true,
      });
    }

    // Test 11: Final check - Get all user wallets (should only have USD now)
    testResults.finalWalletCheck = this.client.requestWithParsing(
      WALLET_QUERIES.GET_USER_WALLETS,
      {},
      this.sessionHeaders
    );

    check(testResults.finalWalletCheck, {
      "multiWalletTest: final wallet check parsed": (r) => r.parsed !== null,
      "multiWalletTest: final wallet check success": (r) =>
        r.parsed?.data?.userWallets?.success === true,
      "multiWalletTest: final check has only USD wallet": (r) => {
        const wallets = r.parsed?.data?.userWallets?.wallets;
        if (!Array.isArray(wallets)) return false;
        const currencies = wallets.map(w => w.currency);
        return currencies.includes("USD") && !currencies.includes("EUR");
      },
      "multiWalletTest: final check EUR wallet removed": (r) => {
        const wallets = r.parsed?.data?.userWallets?.wallets;
        if (!Array.isArray(wallets)) return false;
        return !wallets.some(w => w.currency === "EUR");
      },
    });

    return testResults;
  }
}
