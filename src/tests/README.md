# Testing Guide - Valorize API

Complete guide to running, writing, and maintaining tests in the Valorize API.

This project now uses Supabase Auth. For unit and route tests, prefer mocked
Supabase responses and locally signed JWTs instead of calling the live project.

---

## 🚀 Quick Start

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (ideal for development)
npm test -- --watch

# Run specific test file
npm test -- wallet

# Run with UI (interactive dashboard)
npm test -- --ui
```

### Test Output

Successful run:
```
✓ src/tests/setup.test.ts (3)
  ✓ Test Setup (3)
    ✓ should have test environment configured
    ✓ should have database URL configured
    ✓ should run basic assertions

Test Files  1 passed (1)
Tests  3 passed (3)
Duration  0.23s
```

### Coverage Report

After running `npm run test:coverage`, open `coverage/index.html` to see detailed coverage report.

---

## 📁 Project Structure

```
src/tests/
├── setup.ts                         # Global test setup (runs before all tests)
├── helpers/                         # Reusable test utilities
│   ├── app.helper.ts                # Build/close Fastify app for tests
│   ├── database.helper.ts           # DB setup/cleanup and safe isolation
│   ├── auth.helper.ts               # Supabase-compatible JWT helpers
│   └── supabase.helper.ts           # Supabase auth/admin client mocks
├── factories/                       # Data factories (create test data easily)
│   └── .gitkeep                     # Factory files added as needed
├── mocks/                           # Mock external APIs
│   └── .gitkeep                     # Mock files added as needed
└── README.md                        # This file

src/features/[feature]/__tests__/    # Test files co-located with features
├── [feature].model.test.ts
├── [feature].service.test.ts
└── [feature].routes.test.ts
```

---

## 🧪 Writing Tests

### AAA Pattern (Arrange-Act-Assert)

Every test should follow the **AAA pattern** for clarity:

```typescript
import { describe, it, expect } from 'vitest'

describe('WalletService', () => {
  describe('creditRedeemableBalance()', () => {
    it('should credit redeemable balance correctly', async () => {
      // 🔧 Arrange - Set up test data
      const user = await UserFactory.create()
      const wallet = await WalletFactory.create({
        userId: user.id,
        redeemableBalance: 100
      })

      // ⚡ Act - Execute the function being tested
      await walletService.creditRedeemableBalance(wallet.id, 50)

      // ✅ Assert - Verify the result
      const updatedWallet = await Wallet.findByUserId(user.id)
      expect(updatedWallet.redeemableBalance).toBe(150)
    })
  })
})
```

### Database Isolation

Use `withDatabaseIsolation()` for deterministic cleanup before and after each
database-backed test:

```typescript
import { withDatabaseIsolation } from '@tests/helpers/database.helper'

it('should update wallet balance', async () => {
  await withDatabaseIsolation(async () => {
    // All changes here are cleaned after the test
    const wallet = await WalletFactory.create()
    await walletService.creditRedeemableBalance(wallet.id, 100)
    expect(wallet.balance).toBe(100)
  })
})
```

`withTransaction()` still exists as a backward-compatible alias, but it uses the
same cleanup strategy because the app currently relies on a shared Prisma singleton.

Important: suites that use these helpers should run without file parallelism,
because truncating shared tables can interfere with other DB-backed test files.
Use `npm run test:serial`.

### Creating Test Data with Factories

```typescript
import { UserFactory } from '@tests/factories/user.factory'

it('should send compliment', async () => {
  await withTransaction(async () => {
    // Create user with defaults
    const user = await UserFactory.create()

    // Create user with custom data
    const admin = await UserFactory.create({
      email: 'admin@test.com',
      fullName: 'Admin User'
    })

    // Create multiple users
    const users = await Promise.all([
      UserFactory.create(),
      UserFactory.create(),
      UserFactory.create(),
    ])
  })
})
```

### Authentication in Tests

```typescript
import { createAuthHeader } from '@tests/helpers/auth.helper'

it('should require authentication', async () => {
  const app = createTestApp()

  // Request without auth - should fail
  const res1 = await app.inject({
    url: '/api/v1/compliments',
    method: 'GET'
  })
  expect(res1.statusCode).toBe(401)

  // Request with auth - should succeed
  const headers = createAuthHeader({
    userId: 'user-123',
    companyId: 'company-456',
    email: 'user@test.com'
  })

  const res2 = await app.inject({
    url: '/api/v1/compliments',
    method: 'GET',
    headers
  })
  expect(res2.statusCode).toBe(200)
})
```

---

## 📊 Testing Tiers

### Tier 1: Critical (Monetário)
- Redemptions (vouchers, balances)
- Compliments (atomic transactions)
- Wallets (dual balance system)

**Coverage Target**: 90%
**Checklist**: See [`docs/testing-roadmap.md`](/docs/testing-roadmap.md#-tier-1-testes-críticos-monetários)

### Tier 2: Important (Lógica de Negócio)
- Models (database operations)
- RBAC (permissions)
- Auth (Supabase JWT verification)

**Coverage Target**: 75-80%

### Tier 3: Useful (Edge Cases)
- Routes (integration)
- Error handling
- Utilities

**Coverage Target**: 60-70%

---

## 🎯 Common Testing Patterns

### Testing Errors

```typescript
it('should throw InsufficientBalanceError', async () => {
  await withTransaction(async () => {
    const wallet = await WalletFactory.create({
      redeemableBalance: 10 // Not enough!
    })

    await expect(
      walletService.debit(wallet.id, 100)
    ).rejects.toThrow(InsufficientBalanceError)
  })
})
```

### Testing Multi-Tenancy

```typescript
it('should not allow cross-company compliment', async () => {
  await withTransaction(async () => {
    const company1 = await CompanyFactory.create()
    const company2 = await CompanyFactory.create()

    const user1 = await UserFactory.create({ companyId: company1.id })
    const user2 = await UserFactory.create({ companyId: company2.id })

    // Should fail because different companies
    await expect(
      complimentService.sendCompliment(user1.id, user2.id, 10, valueId)
    ).rejects.toThrow()
  })
})
```

### Testing Atomic Transactions

```typescript
it('should rollback all changes if any step fails', async () => {
  await withTransaction(async () => {
    const sender = await UserFactory.create()
    const initialBalance = sender.wallet.complimentBalance

    // Mock a failure during transaction
    vi.spyOn(walletService, 'credit').mockRejectedValueOnce(
      new Error('DB Error')
    )

    // Should throw
    await expect(
      complimentService.sendCompliment(sender.id, receiver.id, 10, valueId)
    ).rejects.toThrow()

    // Verify sender's balance was NOT deducted (rollback happened)
    const senderAfter = await User.findById(sender.id)
    expect(senderAfter.wallet.complimentBalance).toBe(initialBalance)
  })
})
```

### Testing Routes with Fastify

```typescript
import { createTestApp } from '@tests/helpers/app.helper'

it('should return 200 for valid request', async () => {
  const app = createTestApp()

  const response = await app.inject({
    url: '/api/v1/wallets',
    method: 'GET',
    headers: createAuthHeader({ userId: 'user-1', ... })
  })

  expect(response.statusCode).toBe(200)
  expect(response.json()).toEqual({
    complimentBalance: 100,
    redeemableBalance: 500
  })
})
```

---

## 🔍 Debugging Tests

### Enable Logging

By default, logs are suppressed in tests. To debug, use `console.error`:

```typescript
it('should debug something', async () => {
  console.error('DEBUG:', someValue) // Will show
  console.log('Not visible') // Hidden
})
```

Or temporarily change `setup.ts` to allow logs:

```typescript
// In setup.ts, comment out:
// globalThis.console = { ... }
```

### Run Single Test

```bash
# Run only one test file
npm test -- wallet.service.test

# Run tests matching pattern
npm test -- --grep "should credit redeemable"
```

### Watch Mode Development

```bash
npm test -- --watch

# Then press 'w' to show menu options
# 'p' to filter by filename
# 't' to filter by test name
```

---

## 📋 Test Environment

### Database Connection

Tests use separate database: `valorize_test`

**Setup**:
1. Create test database (see `.env.test` comments)
2. Migrations run automatically
3. Each test gets fresh transaction

### Environment Variables

Loaded from `.env.test`:
- `DATABASE_URL` - Test database connection
- `NODE_ENV=test` - Set to test mode
- `AUTH0_*` - Mock values (not used, just for config loading)
- `TREMENDOUS_*` - Mock values (APIs are mocked)
- `LOG_LEVEL=error` - Only errors and warnings shown

### Mocks

External services are mocked in tests:
- ✅ **Tremendous API** - Mocked responses
- ✅ **Auth0** - JWT generation in-process
- ✅ **Supabase Storage** - In-memory mock

No real API calls are made during tests.

---

## ✅ Quality Standards

Before considering tests "complete":

- [ ] Coverage > 70% in critical files
- [ ] All Tier 1 tests implemented
- [ ] 0 test failures
- [ ] Tests complete in < 5s total
- [ ] Transaction rollback verified
- [ ] Mocks working (no real API calls)
- [ ] No flaky tests (consistent results)

---

## 📚 Full Test Roadmap

See [`docs/testing-roadmap.md`](/docs/testing-roadmap.md) for:
- Complete list of tests to implement
- Tier 1, 2, 3 prioritization
- Detailed test cases for each feature
- Coverage targets
- Implementation timeline

---

## 🤔 FAQ

### Why are tests using transactions instead of cleanup?

**Transactions are faster and cleaner**:
- Automatic rollback (no manual cleanup code)
- Parallel test execution possible
- DB consistency guaranteed
- ~50-100x faster than table truncation

### How do I create a factory?

See `/src/tests/factories/README.md` (to be created) or example:

```typescript
// user.factory.ts
import { faker } from '@faker-js/faker'
import { prisma } from '@lib/database'

export const UserFactory = {
  build(overrides?: Partial<User>) {
    return {
      id: faker.string.cuid(),
      email: faker.internet.email(),
      fullName: faker.person.fullName(),
      ...overrides,
    }
  },

  async create(overrides?: Partial<User>) {
    return prisma.user.create({
      data: UserFactory.build(overrides)
    })
  }
}
```

### Should I test every edge case?

**Focus on critical paths**:
- ✅ Happy path (success case)
- ✅ Error cases (validation failures)
- ✅ Boundary conditions (limits, maximums)
- ❌ Not every possible input combination

### Can I run tests in CI/CD?

Yes! Add to your pipeline:

```yaml
- name: Run tests
  run: npm test

- name: Check coverage
  run: npm run test:coverage
```

---

## 🔗 Related Files

- **Configuration**: `vitest.config.ts`
- **Environment**: `.env.test`
- **Setup**: `src/tests/setup.ts`
- **Helpers**: `src/tests/helpers/`
- **Factories**: `src/tests/factories/` (create as needed)
- **Mocks**: `src/tests/mocks/` (create as needed)
- **Roadmap**: `docs/testing-roadmap.md` (complete checklist)

---

## 🎓 Learning Resources

- [Vitest Documentation](https://vitest.dev)
- [Testing Library Best Practices](https://testing-library.com/docs)
- [Fastify Testing](https://www.fastify.io/docs/latest/Guides/Testing)
- [Prisma Testing](https://www.prisma.io/docs/orm/guides/testing/unit-testing)

---

**Last Updated**: November 2025
**Framework**: Vitest 3.2.4
**Database**: PostgreSQL with Prisma
