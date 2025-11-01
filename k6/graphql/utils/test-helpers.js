import { check } from 'k6';

export function generateTestUser() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  
  return {
    username: `testuser_${timestamp}_${random}`,
    email: `test_${timestamp}_${random}@example.com`,
    password: "TestPassword123!",
    firstName: "Test",
    lastName: "User",
  };
}

export function extractSessionCookie(response) {
  const cookies = response.headers['Set-Cookie'];
  if (!cookies) return null;
  
  // Extract connect.sid cookie
  const sessionCookie = cookies.split(';').find(cookie => 
    cookie.trim().startsWith('connect.sid=')
  );
  
  return sessionCookie ? cookies : null;
}

export function createSessionHeaders(sessionCookie) {
  return sessionCookie ? { Cookie: sessionCookie } : {};
}

export function logTestStep(stepName, response, data = null) {
  console.log(`\n=== ${stepName} ===`);
  console.log(`Status: ${response.status}`);
  if (response.status !== 200) {
    console.log(`❌ HTTP Error: ${response.status}`);
  }
  if (data && data.errors && data.errors.length > 0) {
    console.log(`❌ GraphQL Errors:`, JSON.stringify(data.errors, null, 2));
  }
  if (data && data.success) {
    console.log(`✅ Request successful`);
  }
}

// Enhanced test result tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  scenarios: {}
};

export function resetTestResults() {
  testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    scenarios: {}
  };
}

export function getTestResults() {
  return testResults;
}

export function printTestSummary() {
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`Total Scenarios: ${Object.keys(testResults.scenarios).length}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  console.log('\n📋 SCENARIO DETAILS:');
  Object.entries(testResults.scenarios).forEach(([scenario, result]) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${scenario}: ${result.message}`);
  });
}

export function checkTestScenario(scenarioName, response, validationFn, description = '') {
  const parsed = response.parsed;
  const isHttpOk = response.status === 200;
  const hasNoGraphQLErrors = parsed.success;
  const hasData = !!parsed.data;
  
  let validationResult = true;
  let validationMessage = '';
  
  try {
    if (typeof validationFn === 'function') {
      validationResult = validationFn(parsed.data);
      validationMessage = validationResult ? 'Data validation passed' : 'Data validation failed';
    }
  } catch (error) {
    validationResult = false;
    validationMessage = `Validation error: ${error.message}`;
  }

  const overallSuccess = isHttpOk && hasNoGraphQLErrors && hasData && validationResult;
  
  // Track results
  testResults.total++;
  if (overallSuccess) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
  
  // Store scenario result
  testResults.scenarios[scenarioName] = {
    success: overallSuccess,
    message: overallSuccess ? 'PASSED' : getFailureReason(isHttpOk, hasNoGraphQLErrors, hasData, validationResult, validationMessage),
    description: description
  };

  // K6 checks for metrics
  const checkResult = check(response, {
    [`✅ ${scenarioName} - HTTP 200`]: () => isHttpOk,
    [`✅ ${scenarioName} - No GraphQL Errors`]: () => hasNoGraphQLErrors,
    [`✅ ${scenarioName} - Has Data`]: () => hasData,
    [`✅ ${scenarioName} - Data Valid`]: () => validationResult,
  });

  // Console output
  const status = overallSuccess ? '✅ PASS' : '❌ FAIL';
  console.log(`\n${status} | ${scenarioName}`);
  if (description) {
    console.log(`   📝 ${description}`);
  }
  
  if (!overallSuccess) {
    console.log(`   ❌ Reason: ${testResults.scenarios[scenarioName].message}`);
    if (parsed.errors) {
      console.log(`   🔍 GraphQL Errors:`, JSON.stringify(parsed.errors, null, 2));
    }
  }

  return overallSuccess;
}

function getFailureReason(isHttpOk, hasNoGraphQLErrors, hasData, validationResult, validationMessage) {
  if (!isHttpOk) return 'HTTP request failed';
  if (!hasNoGraphQLErrors) return 'GraphQL errors present';
  if (!hasData) return 'No data returned';
  if (!validationResult) return validationMessage;
  return 'Unknown failure';
}

// Legacy functions for backward compatibility
export function checkGraphQLResponse(response, checks, stepName = 'GraphQL Request') {
  const result = check(response, {
    [`${stepName} - HTTP 200`]: (r) => r.status === 200,
    ...checks,
  });
  
  return result;
}

export function checkAuthenticatedResponse(response, expectedData, stepName) {
  const parsed = response.parsed;
  
  return checkGraphQLResponse(response, {
    [`${stepName} - No GraphQL errors`]: () => parsed.success,
    [`${stepName} - Has data`]: () => !!parsed.data,
    [`${stepName} - Data matches expectation`]: () => {
      if (typeof expectedData === 'function') {
        return expectedData(parsed.data);
      }
      return true;
    },
  }, stepName);
}