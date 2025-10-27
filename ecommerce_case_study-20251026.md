# Case Study: Building a Simple E-commerce Platform (monolith-api + web-client)

## Executive Summary
This case study describes the design and implementation plan for a simple, production-ready e-commerce application with the following stack and constraints:

- **Backend:** Node.js monolith (`monolith-api`) exposing **both GraphQL and REST** APIs, OAuth2 auth, Redis caching, PostgreSQL persistence, code-driven DB migrations, containerized.
- **Frontend:** Next.js app (`web-client`) communicating with the backend via **GraphQL** (and can call REST when needed), OAuth2/OIDC login, Playwright E2E coverage.
- **Data Stores:** PostgreSQL (primary), Redis (cache + sessions + rate limiting).
- **Local Dev & Orchestration:** Docker Compose for all services (DBs + API + web + auth).
- **Testing:** k6 integration tests (GraphQL & REST) in JavaScript; Playwright E2E flows on Chrome.
- **CI/CD:** GitHub Actions workflows per repo; **semantic versioning** with release tags.

---

## 1) Business & Functional Requirements

### Core user flows
1. User signs up/signs in via OAuth2 Authorization Code (PKCE).
2. Browses product categories & products.
3. Adds items to cart, selects wallet (multi-currency) or card, places an order.
4. Views order history & wallet balances, performs wallet top-ups/transfers (internal).
5. Admin (future scope): CRUD for categories/products, pricing, inventory.

### Non-functional requirements
- Single deployable monolith for simplicity (internal modular boundaries).
- Clear API parity: anything possible in the web client is possible via REST.
- Safe caching with deterministic invalidation paths.
- Testable with headless + headed browsers, and load-testable via k6.
- Reproducible environments with Docker, consistent CI workflows.

---

## 2) High-Level Architecture
```
┌───────────────────────────┐      GraphQL over HTTPS      ┌───────────────────────────┐
│         web-client        │ ───────────────────────────▶ │       monolith-api        │
│       (Next.js, SSR)      │      REST over HTTPS         │  (Node.js, Express+Apollo)│
└────────────┬──────────────┘                              └───────────┬───────────────┘
             │  OAuth2/OIDC (Auth Code + PKCE)                          │
             │──────────────────────────────────────────────────────────│
             │                                                          │
       ┌─────▼─────┐                                           ┌───────▼────────┐
       │ Auth.     │◀───────────(users, clients, tokens)──────▶│ Redis (cache)  │
       │ (OAuth2)  │                                           │ + sessions     │
       └─────┬─────┘                                           └───────┬────────┘
             │                                                          │
             │                                      SQL (TypeORM)      │
             │                                                          │
                                           ┌──────────────▼─────────────┐
                                           │         PostgreSQL         │
                                           │   (products, orders,       │
                                           │    wallets, etc.)          │
                                           └─────────────────────────────┘
```

---

## 3) Domain Model & Data Design

### Entities (simplified)
- **User**: `id, email, name, created_at`
- **Wallet**: `id, user_id, currency (ISO 4217), balance_minor (BIGINT), created_at`
- **Category**: `id, slug, name`
- **Product**: `id, category_id, name, slug, price_minor, currency, stock_qty`
- **Order**: `id, user_id, total_minor, currency, status, created_at`
- **OrderItem**: `id, order_id, product_id, qty, unit_price_minor, currency`
- **Cart**: `id, user_id`
- **CartItem**: `id, cart_id, product_id, qty`

> **Currency strategy:** store amounts in **minor units** (e.g., cents) as `BIGINT` to avoid floating-point errors. Wallets are **per currency**.

---

## 4) Authentication & Authorization (OAuth2/OIDC)

- **Flow:** Authorization Code with PKCE.
- **Clients:**
  - `web-client` (public) with PKCE.
  - `monolith-api` (confidential) for server-to-server or token introspection if needed.
- **Tokens:** Access + Refresh; roles via realm/client roles.
- **Scopes/claims:** `profile`, `email`, `wallet:read`, `wallet:write`, `orders:write` etc.
- **Session management:** HttpOnly cookies in SSR flows; store session IDs in Redis.

---

## 5) APIs

### GraphQL (primary for web-client)
```graphql
type Query {
  me: User
  categories: [Category!]!
  products(categorySlug: String, search: String, page: Int, pageSize: Int): ProductPage!
  product(slug: String!): Product
  walletBalances: [Wallet!]!
  orders(page: Int, pageSize: Int): OrderPage!
}

type Mutation {
  addToCart(productId: ID!, qty: Int!): Cart!
  checkout(walletCurrency: String!): Order!
  topUpWallet(currency: String!, amountMinor: Int!): Wallet!
}
```

### REST (parity for external integrations)
- Base: `/api`
- Auth: Bearer access token (JWT) or session cookie.
- Examples:
  - `GET /api/me`
  - `GET /api/categories`
  - `GET /api/products?category=games&search=...`
  - `POST /api/cart/items { productId, qty }`
  - `POST /api/orders/checkout { walletCurrency }`
  - `GET /api/wallets`
  - `POST /api/wallets/top-up { currency, amountMinor }`

---

## 6) Caching Strategy (Redis)

### What we cache
1. **Catalog**: categories, product pages.
2. **Auth/session**: user sessions, PKCE verifiers.
3. **Rate limits**: per IP/user.
4. **Cart** (optional): cached for speed, persisted to DB.

### Patterns & TTLs
- **Read-through / cache-aside** for catalog data.
- **Write-invalidation** on product/category updates.
- **Key examples:**
  - `categories:v1`
  - `product:v1:{slug}`
  - `products:v1:{categorySlug}:{page}:{pageSize}`
- **TTL:** 120–300s depending on type.
- **Eviction policy:** `allkeys-lru`.

---

## 7) Technology Choices
- Node.js 20+, Express, Apollo Server
- TypeORM for migrations & DB access
- Redis for cache/session
- PostgreSQL for data
- Jest, Playwright, k6 for tests
- GitHub Actions for CI/CD
- Semantic Versioning via conventional commits

---

## 8) Repository Layout

### monolith-api
```
monolith-api/
  src/
    auth/
    graphql/
    rest/
    services/
    repositories/
    entities/
    cache/
  migrations/
  test/
  k6/
  Dockerfile
  docker-compose.yml
```

### web-client
```
web-client/
  src/
    pages/
    components/
    lib/
    e2e/
  Dockerfile
```

---

## 9) Docker & Local Development

### docker-compose.yml (excerpt)
```yaml
version: "3.9"
services:
  postgres:
    image: postgres:18
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: shop
    ports: ["5432:5432"]

  redis:
    image: redis:8
    ports: ["6379:6379"]

  monolith-api:
    build: ./monolith-api
    depends_on: [postgres, redis]
    ports: ["4000:4000"]

  web-client:
    build: ./web-client
    depends_on: [monolith-api]
    ports: ["3000:3000"]
```

---

## 10) Database Migrations

- TypeORM migrations generated and run via CLI.
- Example: `npm run typeorm migration:generate src/migrations/AddWallets`

---

## 11) Frontend Integration

- Next.js SSR with Apollo Client.
- OAuth2 PKCE.
- React Query or Apollo Cache for state.

---

## 12) Testing Strategy

### k6 Integration Tests
JavaScript-based tests for both REST and GraphQL endpoints.

### Playwright E2E Tests
Simulate Chrome-based user flow:
1. Login
2. Browse category
3. Add to cart
4. Checkout with wallet

---

## 13) CI/CD (GitHub Actions)

- **Build, Lint, Test** on push/PR.
- Run migrations on ephemeral DB.
- Docker build & push on release.
- Semantic versioning with changelog generation.

---

## 14) Semantic Versioning

- Conventional Commits (`feat:`, `fix:` etc.)
- Automated release tags (`vMAJOR.MINOR.PATCH`)

---

## 15) Delivery Plan

| Days | Milestone |
|------|------------|
| 1-2 | Project scaffold, OAuth setup, initial GraphQL + REST endpoints |
| 3-4 | Cart, Wallets, Redis cache |
| 5-6 | k6 + Playwright tests, CI workflows |
| 7-8 | Hardening, SemVer setup, v1.0.0 release |

---

## 16) Example Cache Invalidation
```ts
await redis.del(`product:v1:${p.slug}`);
await redis.delPattern(`products:v1:${p.category.slug}:*`);
```

---

**Outcome:**
A fully functional, tested, Dockerized e-commerce monolith supporting both REST and GraphQL APIs, OAuth2 authentication, Redis caching, multi-currency wallets, automated testing (k6, Playwright), and CI/CD with semantic versioning.

