# K6 GraphQL Test Suite

Professional GraphQL testing framework using K6 for load testing and API validation.

## 📁 Project Structure

```
k6/graphql/
├── config/
│   └── test-config.js          # Global test configuration
├── queries/
│   └── auth-queries.js         # GraphQL queries for authentication
├── services/
│   └── auth-service.js         # Authentication service layer
├── templates/
│   └── entity-test-template.js # Template for new entity tests
├── utils/
│   ├── graphql-client.js       # GraphQL client wrapper
│   └── test-helpers.js         # Common test utilities
├── auth.test.js                # Authentication tests
└── README.md                   # This file
```

## 🚀 Getting Started

### Prerequisites

- K6 installed on your system
- GraphQL API running (default: http://localhost:4000/graphql)

### Running Tests

```bash
# Run authentication tests
k6 run k6/graphql/auth.test.js

# Run with custom base URL
k6 run -e BASE_URL=https://api.example.com/graphql k6/graphql/auth.test.js

# Run with different test options
k6 run --vus 10 --duration 30s k6/graphql/auth.test.js
```

## 🏗️ Creating New Entity Tests

1. **Copy the template:**

   ```bash
   cp k6/graphql/templates/entity-test-template.js k6/graphql/products.test.js
   ```

2. **Create queries file:**

   ```javascript
   // queries/product-queries.js
   export const PRODUCT_QUERIES = {
     CREATE_PRODUCT: `mutation CreateProduct($input: ProductInput!) { ... }`,
     GET_PRODUCTS: `query GetProducts { ... }`,
     // ... more queries
   };
   ```

3. **Create service file:**

   ```javascript
   // services/product-service.js
   import { GraphQLClient } from "../utils/graphql-client.js";
   import { PRODUCT_QUERIES } from "../queries/product-queries.js";

   export class ProductService {
     // ... implement CRUD operations
   }
   ```

4. **Update the test file:**
   - Replace `ENTITY_NAME` with `Product`
   - Import and use your ProductService
   - Implement test scenarios

## 🧪 Test Types

### Smoke Tests (Default)

- Single user, single iteration
- Basic functionality validation
- Quick feedback loop

### Load Tests

```javascript
export const options = TEST_CONFIG.LOAD_TEST_OPTIONS;
```

### Stress Tests

```javascript
export const options = TEST_CONFIG.STRESS_TEST_OPTIONS;
```

## 🔧 Configuration

Environment variables:

- `BASE_URL`: GraphQL endpoint (default: http://localhost:4000/graphql)
- `ADMIN_USERNAME`: Admin username for privileged tests
- `ADMIN_PASSWORD`: Admin password for privileged tests

## 📊 Test Patterns

### Authentication Flow

```javascript
const authService = new AuthService();
const { user } = authService.register();
authService.login();
// ... authenticated operations
authService.logout();
```

### Entity CRUD Operations

```javascript
const entityService = new EntityService(authService.getSessionHeaders());
const entity = entityService.create(testData);
entityService.read(entity.id);
entityService.update(entity.id, updateData);
entityService.delete(entity.id);
```

## 🎯 Best Practices

1. **Use Services**: Encapsulate business logic in service classes
2. **Reuse Authentication**: Use AuthService for session management
3. **Proper Error Handling**: Always check for GraphQL errors
4. **Meaningful Assertions**: Use descriptive check names
5. **Clean Test Data**: Generate unique test data to avoid conflicts
6. **Proper Cleanup**: Logout and clean up resources after tests

## 📈 Monitoring

K6 provides built-in metrics:

- `http_req_duration`: Request response time
- `http_req_failed`: Failed request rate
- `iterations`: Test iterations completed
- `vus`: Virtual users active

Custom metrics can be added using K6's metrics API.

## 🐛 Debugging

Enable detailed logging by checking the console output in your test functions. Each service method includes comprehensive logging for debugging purposes.

## 🔄 CI/CD Integration

Example GitHub Actions workflow:

```yaml
- name: Run GraphQL Tests
  run: k6 run k6/graphql/auth.test.js
```
