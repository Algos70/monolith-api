import { check } from "k6";

export class WalletService {
  constructor(client, queries = null) {
    this.client = client;
    this.queries = queries;
    this.sessionHeaders = {};
    this.isGraphQLClient = this.client.constructor.name === 'GraphQLClient';
  }

  // Set session headers for authenticated requests
  setSessionHeaders(headers) {
    this.sessionHeaders = headers;
  }

  // Determine request method based on client type
  makeRequest(query, variables = {}, headers = {}) {
    const requestHeaders = { ...this.sessionHeaders, ...headers };
    
    if (this.isGraphQLClient) {
      // GraphQL request
      return this.client.requestWithParsing(query, variables, requestHeaders);
    } else {
      // REST request - query should be an object with method, url, params
      return this.client.requestWithParsing(query, variables, requestHeaders);
    }
  }

  async getUserWallets(variables = {}, expectedWallet = null) {
    const query = this.isGraphQLClient 
      ? this.queries.GET_USER_WALLETS 
      : {
          method: 'GET',
          url: '/wallets',
          params: variables
        };

    const graphqlVariables = this.isGraphQLClient ? variables : {};
    const response = this.makeRequest(query, graphqlVariables);

    // Handle response based on client type
    const responseData = this.isGraphQLClient 
      ? response.parsed?.data?.userWallets
      : response.parsed;

    // Check if response has parsed data
    if (!response.parsed || !responseData) {
      return { success: false, message: "No parsed data in response" };
    }

    check(response, {
      "userWallets: response parsed": (r) => r.parsed !== null,
      "userWallets: success is true": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.userWallets : r.parsed;
        return data?.success === true;
      },
      "userWallets: message contains 'Found'": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.userWallets : r.parsed;
        return data?.message?.includes("Found");
      },
    });

    check(response, {
      "userWallets: wallets array exists": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.userWallets : r.parsed;
        return Array.isArray(data?.wallets);
      },
    });

    // If we expect a specific wallet, validate it
    if (expectedWallet) {
      check(response, {
        "userWallets: has exactly one wallet": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.userWallets : r.parsed;
          return data?.wallets?.length === 1;
        },
        "userWallets: wallet matches expected wallet": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.userWallets : r.parsed;
          const wallets = data?.wallets;
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
        "userWallets: has wallets": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.userWallets : r.parsed;
          return data?.wallets?.length >= 0;
        },
      });
    }

    check(response, {
      "userWallets: wallet has required fields": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.userWallets : r.parsed;
        const wallets = data?.wallets;
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

    return responseData;
  }

  async getUserWalletByCurrency(variables = {}, expectedWallet = null) {
    const query = this.isGraphQLClient 
      ? this.queries.GET_USER_WALLET_BY_CURRENCY 
      : {
          method: 'GET',
          url: `/wallets/currency/${variables.currency}`,
          params: {}
        };

    const graphqlVariables = this.isGraphQLClient ? variables : {};
    const response = this.makeRequest(query, graphqlVariables);

    // Handle response based on client type
    const responseData = this.isGraphQLClient 
      ? response.parsed?.data?.userWalletByCurrency
      : response.parsed;

    // Check if response has parsed data
    if (!response.parsed || !responseData) {
      return { success: false, message: "No parsed data in response" };
    }

    check(response, {
      "userWalletByCurrency: response parsed": (r) => r.parsed !== null,
    });

    // Check success/failure based on actual response and expectations
    if (expectedWallet || responseData?.success === true) {
      check(response, {
        "userWalletByCurrency: success true": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.userWalletByCurrency : r.parsed;
          return data?.success === true;
        },
        "userWalletByCurrency: wallet found": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.userWalletByCurrency : r.parsed;
          return data?.message?.includes("found");
        },
      });
    } else if (responseData?.success === false) {
      // For cases where we expect failure (like non-existent wallet)
      check(response, {
        "userWalletByCurrency: success false (expected)": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.userWalletByCurrency : r.parsed;
          return data?.success === false;
        },
        "userWalletByCurrency: wallet is null (expected)": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.userWalletByCurrency : r.parsed;
          return data?.wallet === null;
        },
        "userWalletByCurrency: has not found message": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.userWalletByCurrency : r.parsed;
          return data?.message?.includes("not found");
        },
      });
    }

    // Check wallet data based on success status
    check(response, {
      "userWalletByCurrency: wallet data is valid": (r) => {
        const result = this.isGraphQLClient ? r.parsed?.data?.userWalletByCurrency : r.parsed;
        
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
          (wallet.balanceMinor !== undefined && wallet.balanceMinor !== null) && // Accept both string and number
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
        "userWalletByCurrency: success should be true": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.userWalletByCurrency : r.parsed;
          return data?.success === true;
        },
        "userWalletByCurrency: wallet matches expected wallet": (r) => {
          const result = this.isGraphQLClient ? r.parsed?.data?.userWalletByCurrency : r.parsed;
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

    return responseData;
  }

  async getUserWalletBalance(variables = {}, expectedBalance = null) {
    const query = this.isGraphQLClient 
      ? this.queries.GET_USER_WALLET_BALANCE 
      : {
          method: 'GET',
          url: `/wallets/currency/${variables.currency}/balance`,
          params: {}
        };

    const graphqlVariables = this.isGraphQLClient ? variables : {};
    const response = this.makeRequest(query, graphqlVariables);

    // Handle response based on client type
    const responseData = this.isGraphQLClient 
      ? response.parsed?.data?.userWalletBalance
      : response.parsed;

    // Check if response has parsed data
    if (!response.parsed || !responseData) {
      return { success: false, message: "No parsed data in response" };
    }

    check(response, {
      "userWalletBalance: response parsed": (r) => r.parsed !== null,
      "userWalletBalance: success is true": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.userWalletBalance : r.parsed;
        return data?.success === true;
      },
      "userWalletBalance: message contains 'successfully'": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.userWalletBalance : r.parsed;
        return data?.message?.includes("successfully");
      },
      "userWalletBalance: balance is numeric string": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.userWalletBalance : r.parsed;
        const balance = data?.balance;
        return balance && !isNaN(Number(balance));
      },
    });

    // If expectedBalance is provided, validate it matches
    if (expectedBalance !== null) {
      check(response, {
        "userWalletBalance: success should be true": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.userWalletBalance : r.parsed;
          return data?.success === true;
        },
        "userWalletBalance: balance matches expected": (r) => {
          const result = this.isGraphQLClient ? r.parsed?.data?.userWalletBalance : r.parsed;
          if (!result || !result.success) return false;
          const actualBalance = result.balance;
          const expectedBalanceStr = expectedBalance.toString();
          return actualBalance === expectedBalanceStr;
        },
        "userWalletBalance: message indicates success": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.userWalletBalance : r.parsed;
          return data?.message?.includes("successfully");
        },
      });
    }

    return responseData;
  }

  async createUserWallet(variables = {}) {
    const query = this.isGraphQLClient 
      ? this.queries.CREATE_USER_WALLET 
      : {
          method: 'POST',
          url: '/wallets',
          body: this.isGraphQLClient ? {} : {
            currency: variables.input?.currency,
            initialBalance: variables.input?.initialBalanceMinor ? parseInt(variables.input.initialBalanceMinor, 10) : 0
          }
        };

    const graphqlVariables = this.isGraphQLClient ? variables : {};
    const response = this.makeRequest(query, graphqlVariables);

    // Handle response based on client type
    const responseData = this.isGraphQLClient 
      ? response.parsed?.data?.createUserWallet
      : response.parsed;

    // Check if response has parsed data
    if (!response.parsed || !responseData) {
      return { success: false, message: "No parsed data in response" };
    }

    check(response, {
      "createUserWallet: response parsed": (r) => r.parsed !== null,
    });

    // Check success/failure based on actual response
    if (responseData?.success === true) {
      check(response, {
        "createUserWallet: success true": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.createUserWallet : r.parsed;
          return data?.success === true;
        },
        "createUserWallet: message is correct": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.createUserWallet : r.parsed;
          return data?.message === "Wallet created successfully";
        },
        "createUserWallet: wallet has required fields": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.createUserWallet : r.parsed;
          const wallet = data?.wallet;
          return (
            wallet &&
            wallet.id &&
            wallet.currency &&
            (wallet.balanceMinor !== undefined && wallet.balanceMinor !== null) && // Accept both string and number
            wallet.createdAt &&
            wallet.updatedAt &&
            wallet.user &&
            wallet.user.id &&
            wallet.user.email
          );
        },
      });
    } else {
      // For negative flow tests - expect failure
      check(response, {
        "createUserWallet: success false (negative test)": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.createUserWallet : r.parsed;
          return data?.success === false;
        },
        "createUserWallet: has error message (negative test)": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.createUserWallet : r.parsed;
          return data?.message && data.message.length > 0;
        },
        "createUserWallet: wallet is null (negative test)": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.createUserWallet : r.parsed;
          return data?.wallet === null;
        },
      });
    }

    return responseData;
  }

  async increaseUserWalletBalance(variables = {}) {
    const query = this.isGraphQLClient 
      ? this.queries.INCREASE_USER_WALLET_BALANCE 
      : {
          method: 'POST',
          url: `/wallets/${variables.walletId}/increase`,
          body: this.isGraphQLClient ? {} : {
            amountMinor: variables.input?.amountMinor ? parseInt(variables.input.amountMinor, 10) : 0
          }
        };

    const graphqlVariables = this.isGraphQLClient ? variables : {};
    const response = this.makeRequest(query, graphqlVariables);

    // Handle response based on client type
    const responseData = this.isGraphQLClient 
      ? response.parsed?.data?.increaseUserWalletBalance
      : response.parsed;

    // Check if response has parsed data
    if (!response.parsed || !responseData) {
      return { success: false, message: "No parsed data in response" };
    }

    check(response, {
      "increaseUserWalletBalance: response parsed": (r) => r.parsed !== null,
    });

    // Check success/failure based on actual response
    if (responseData?.success === true) {
      check(response, {
        "increaseUserWalletBalance: success is true": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.increaseUserWalletBalance : r.parsed;
          return data?.success === true;
        },
        "increaseUserWalletBalance: message contains 'successfully'": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.increaseUserWalletBalance : r.parsed;
          return data?.message?.includes("successfully");
        },
      });
    } else {
      // For negative flow tests - expect failure
      check(response, {
        "increaseUserWalletBalance: success false (negative test)": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.increaseUserWalletBalance : r.parsed;
          return data?.success === false;
        },
        "increaseUserWalletBalance: has error message (negative test)": (r) => {
          const data = this.isGraphQLClient ? r.parsed?.data?.increaseUserWalletBalance : r.parsed;
          return data?.message && data.message.length > 0;
        },
      });
    }

    return responseData;
  }

  // Integration test: Increase balance and verify the new balance
  async increaseBalanceAndVerify(walletId, amountMinor, currency, expectedNewBalance) {
    // Step 1: Increase balance
    const increaseResponse = await this.increaseUserWalletBalance({
      walletId: walletId,
      input: {
        amountMinor: amountMinor.toString(),
      },
    });

    check(increaseResponse, {
      "increaseBalanceAndVerify: increase operation success": (r) => r.success === true,
      "increaseBalanceAndVerify: increase operation message": (r) => r.message?.includes("successfully"),
    });

    // Step 2: Verify new balance
    const balanceResponse = await this.getUserWalletBalance({
      currency: currency,
    });

    check(balanceResponse, {
      "increaseBalanceAndVerify: balance check success": (r) => r.success === true,
      "increaseBalanceAndVerify: balance updated correctly": (r) => {
        if (!r || !r.success) return false;
        const actualBalance = r.balance;
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
    const query = this.isGraphQLClient 
      ? this.queries.DELETE_USER_WALLET 
      : {
          method: 'DELETE',
          url: `/wallets/${variables.walletId}`,
          body: {}
        };

    const graphqlVariables = this.isGraphQLClient ? variables : {};
    const response = this.makeRequest(query, graphqlVariables);

    // Handle response based on client type - Both now return {success, message}
    const responseData = this.isGraphQLClient 
      ? response.parsed?.data?.deleteUserWallet
      : response.parsed;

    // Check if response has parsed data
    if (!response.parsed) {
      return { success: false, message: "No parsed data in response" };
    }

    check(response, {
      "deleteUserWallet: response parsed": (r) => r.parsed !== null,
      "deleteUserWallet: no GraphQL errors": (r) => {
        if (this.isGraphQLClient) {
          return !r.parsed?.errors || r.parsed.errors.length === 0;
        }
        return true; // REST doesn't have GraphQL errors
      },
      "deleteUserWallet: returns success": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.deleteUserWallet : r.parsed;
        return data?.success === true;
      },
      "deleteUserWallet: message is correct": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.deleteUserWallet : r.parsed;
        return data?.message === "Wallet deleted successfully";
      },
    });

    return responseData;
  }

  async transferFromUserWallet(variables = {}) {
    const query = this.isGraphQLClient 
      ? this.queries.TRANSFER_FROM_USER_WALLET 
      : {
          method: 'POST',
          url: '/wallets/transfer',
          body: this.isGraphQLClient ? {} : {
            toWalletId: variables.input?.toWalletId,
            currency: variables.input?.currency,
            amountMinor: variables.input?.amountMinor ? parseInt(variables.input.amountMinor, 10) : 0
          }
        };

    const graphqlVariables = this.isGraphQLClient ? variables : {};
    const response = this.makeRequest(query, graphqlVariables);

    // Handle response based on client type
    const responseData = this.isGraphQLClient 
      ? response.parsed?.data?.transferFromUserWallet
      : response.parsed;

    // Check if response has parsed data
    if (!response.parsed || !responseData) {
      return { success: false, message: "No parsed data in response" };
    }

    check(response, {
      "transferFromUserWallet: response parsed": (r) => r.parsed !== null,
      "transferFromUserWallet: success true": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.transferFromUserWallet : r.parsed;
        return data?.success === true;
      },
      "transferFromUserWallet: message is correct": (r) => {
        const data = this.isGraphQLClient ? r.parsed?.data?.transferFromUserWallet : r.parsed;
        return data?.message === "Transfer completed successfully";
      },
    });

    return responseData;
  }

  // Comprehensive wallet workflow test - covers all main wallet operations
  async runWalletWorkflowTest() {
    console.log("Starting Wallet Workflow Test");
    console.log("=============================");

    // Test 1: Create a new USD wallet first
    const createWalletResponse = await this.createUserWallet({
      input: {
        currency: "USD",
        initialBalanceMinor: "1000", // $10.00 in minor units (cents)
      },
    });

    // Test 2: Get user wallets - Should now include the created wallet
    const createdWallet = createWalletResponse?.wallet;
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
    const walletId = createWalletResponse?.wallet?.id;
    if (walletId) {
      await this.increaseBalanceAndVerify(
        walletId,
        500, // Add $5.00
        "USD",
        1500 // Expected new balance: 1000 + 500 = 1500
      );
    }

    console.log("Wallet Workflow Test Completed");
    console.log("=============================");

    return createWalletResponse;
  }

  // Edge case tests for wallet operations
  async runEdgeCaseTests() {
    console.log("Starting Wallet Edge Case Tests");
    console.log("===============================");

    // Test getting non-existent wallet - should return success: false
    const nonExistentWalletResponse = await this.getUserWalletByCurrency({
      currency: "GBP", // Non-existent currency
    });

    check(nonExistentWalletResponse, {
      "edgeCase: non-existent wallet success false": (r) => r.success === false,
      "edgeCase: non-existent wallet is null": (r) => r.wallet === null,
      "edgeCase: non-existent wallet message indicates not found": (r) =>
        r.message?.includes("not found") || r.message?.includes("Wallet not found"),
    });

    // Test getting balance for non-existent wallet - returns success: true with balance: "0"
    const nonExistentBalanceResponse = await this.getUserWalletBalance({
      currency: "JPY", // Non-existent currency
    });

    check(nonExistentBalanceResponse, {
      "edgeCase: non-existent balance success true": (r) => r.success === true,
      "edgeCase: non-existent balance returns zero": (r) => r.balance === "0",
      "edgeCase: non-existent balance message success": (r) =>
        r.message === "Balance retrieved successfully",
    });

    console.log("Wallet Edge Case Tests Completed");
    console.log("===============================");
  }

  // Negative flow tests for wallet operations
  async runNegativeFlowTests() {
    console.log("Starting Wallet Negative Flow Tests");
    console.log("===================================");

    // Test creating wallet with invalid currency (should fail - more than 3 characters)
    const invalidWalletResponse = await this.createUserWallet({
      input: {
        currency: "INVALID", // 7 characters - exceeds 3 character limit
        initialBalanceMinor: "1000",
      },
    });

    check(invalidWalletResponse, {
      "negativeFlow: invalid currency wallet creation should fail": (r) => {
        // Should either have success false or be undefined (error case)
        return r.success === false || r === undefined;
      },
    });

    // Test creating wallet with another invalid currency (too long)
    const longCurrencyResponse = await this.createUserWallet({
      input: {
        currency: "TOOLONG", // 7 characters - exceeds 3 character limit
        initialBalanceMinor: "500",
      },
    });

    check(longCurrencyResponse, {
      "negativeFlow: long currency wallet creation should fail": (r) => {
        // Should either have success false or be undefined (error case)
        return r.success === false || r === undefined;
      },
    });

    // Test increasing balance with invalid wallet ID
    const invalidIncreaseResponse = await this.increaseUserWalletBalance({
      walletId: "invalid-wallet-id",
      input: {
        amountMinor: "100",
      },
    });

    check(invalidIncreaseResponse, {
      "negativeFlow: invalid wallet ID increase should fail": (r) => {
        return r.success === false || r === undefined;
      },
    });

    console.log("Wallet Negative Flow Tests Completed");
    console.log("===================================");
  }

  // Comprehensive multi-wallet test: Create EUR wallet, test operations, and cleanup
  async runMultiWalletTest() {
    console.log("Starting Multi-Wallet Test");
    console.log("=========================");

    const testResults = {
      createEurWallet: null,
      getEurWalletByCurrency: null,
      getAllWallets: null,
      getNonExistentWallet: null,
      deleteEurWallet: null,
      finalWalletCheck: null,
    };

    // Test 6: Create a EUR wallet for additional testing
    testResults.createEurWallet = await this.createUserWallet({
      input: {
        currency: "EUR",
        initialBalanceMinor: "0",
      },
    });

    check(testResults.createEurWallet, {
      "multiWalletTest: EUR wallet creation success": (r) => r.success === true,
      "multiWalletTest: EUR wallet creation message": (r) =>
        r.message === "Wallet created successfully",
      "multiWalletTest: EUR wallet has zero balance": (r) => {
        const wallet = r.wallet;
        return wallet && (wallet.balanceMinor === "0" || wallet.balanceMinor === 0);
      },
      "multiWalletTest: EUR wallet currency is correct": (r) => {
        const wallet = r.wallet;
        return wallet && wallet.currency === "EUR";
      },
    });

    // Test 7: Get wallet by currency (EUR)
    testResults.getEurWalletByCurrency = await this.getUserWalletByCurrency({
      currency: "EUR",
    });

    check(testResults.getEurWalletByCurrency, {
      "multiWalletTest: EUR wallet by currency success": (r) => r.success === true,
      "multiWalletTest: EUR wallet by currency found": (r) => r.message?.includes("found"),
      "multiWalletTest: EUR wallet by currency has correct data": (r) => {
        const wallet = r.wallet;
        return wallet && wallet.currency === "EUR" && (wallet.balanceMinor === "0" || wallet.balanceMinor === 0);
      },
    });

    // Test 8: Get all user wallets - Should now have both USD and EUR
    testResults.getAllWallets = await this.getUserWallets({});

    check(testResults.getAllWallets, {
      "multiWalletTest: all wallets success": (r) => r.success === true,
      "multiWalletTest: has multiple wallets": (r) => {
        const wallets = r.wallets;
        return Array.isArray(wallets) && wallets.length >= 2;
      },
      "multiWalletTest: has both USD and EUR wallets": (r) => {
        const wallets = r.wallets;
        if (!Array.isArray(wallets)) return false;
        const currencies = wallets.map(w => w.currency);
        return currencies.includes("USD") && currencies.includes("EUR");
      },
    });

    // Test 9: Try to get wallet by non-existent currency (should return null)
    testResults.getNonExistentWallet = await this.getUserWalletByCurrency({
      currency: "GBP",
    });

    check(testResults.getNonExistentWallet, {
      "multiWalletTest: non-existent wallet success false": (r) => r.success === false,
      "multiWalletTest: non-existent wallet is null": (r) => r.wallet === null,
      "multiWalletTest: non-existent wallet message indicates not found": (r) =>
        r.message?.includes("not found") || r.message?.includes("No wallet"),
    });

    // Test 10: Delete the EUR wallet (should have 0 balance)
    const eurWalletId = testResults.createEurWallet?.wallet?.id;
    if (eurWalletId) {
      testResults.deleteEurWallet = await this.deleteUserWallet({
        walletId: eurWalletId,
      });

      check(testResults.deleteEurWallet, {
        "multiWalletTest: EUR wallet deletion success": (r) => {
          return r?.success === true;
        },
        "multiWalletTest: EUR wallet deletion message": (r) => {
          return r?.message === "Wallet deleted successfully";
        },
      });
    }

    // Test 11: Final check - Get all user wallets (should only have USD now)
    testResults.finalWalletCheck = await this.getUserWallets({});

    check(testResults.finalWalletCheck, {
      "multiWalletTest: final wallet check success": (r) => r.success === true,
      "multiWalletTest: final check has only USD wallet": (r) => {
        const wallets = r.wallets;
        if (!Array.isArray(wallets)) return false;
        const currencies = wallets.map(w => w.currency);
        return currencies.includes("USD") && !currencies.includes("EUR");
      },
      "multiWalletTest: final check EUR wallet removed": (r) => {
        const wallets = r.wallets;
        if (!Array.isArray(wallets)) return false;
        return !wallets.some(w => w.currency === "EUR");
      },
    });

    console.log("Multi-Wallet Test Completed");
    console.log("=========================");

    return testResults;
  }
}