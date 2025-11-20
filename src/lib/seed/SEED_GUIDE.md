# 🌱 Complete Seed System Guide

## Overview

The Valorize seed system is a comprehensive data generation and validation pipeline designed to create realistic, large-scale test data for the B2B SaaS platform. The system includes:

- **16 integrated seeders** in dependency order
- **Progress tracking** with visual feedback
- **Comprehensive validation** with Pareto distribution analysis
- **Realistic data patterns** including temporal distribution and activity weighting
- **Transaction tracking** with full audit trail

## Quick Start

### Full Database Reset + Seed + Validate

```bash
npm run db:reset
```

This will:
1. Reset the database schema
2. Run all 16 seeders in dependency order
3. Run comprehensive validation
4. Print detailed metrics and recommendations

### Standalone Validation (After Seeding)

```bash
npx tsx utility-tests/validate-seed.ts
```

This validates existing seed data without re-seeding.

## System Architecture

### Seeding Pipeline

The seed system executes 16 seeders in strict dependency order:

```
1. Companies              → Master company data
2. Permissions           → RBAC permissions
3. Roles                 → RBAC roles
4. Departments           → Company departments
5. Job Titles            → Job title catalog
6. Users                 → Employee accounts (258 users)
7. Wallets               → User wallet records
8. Company Wallets       → Company-level wallets
9. Wallet Deposits       → Initial deposits
10. Company Values       → Custom company values
11. Contacts             → Employee contact info
12. Prizes               → Prize catalog
13. Compliments ⭐       → Main seeding operation (10,069 compliments)
14. Transactions         → Wallet transactions
15. Redemptions          → Prize redemptions
16. Balance Adjustments  → Post-seed balance fixes
```

### Key Seeders

#### 1. **User Seeder** (users.seeder.ts)
- Creates 258 test users across 3 companies:
  - Valorize Corp: 200 users
  - TechStart: 35 users
  - Global: 23 users
- Realistic Brazilian names and email addresses
- Supabase Auth ID integration (UUID format)

#### 2. **Wallet Seeder** (wallet.seeder.ts)
- Creates dual-balance wallets for each user
- Compliment Balance: 500 coins (weekly renewal)
- Redeemable Balance: 0 (earned through compliments)

#### 3. **Compliment Seeder** ⭐ (compliment.seeder.ts)
- **Largest seeding operation** - 10,069 compliments generated
- **Three batches**:
  - Weekly renewals (13 weeks × 258 users)
  - Gabriel-specific compliments (hand-crafted)
  - Factory-generated compliments (realistic distribution)
- **Pareto distribution**:
  - 20% power users → 4x activity multiplier
  - 60% normal users → 1x activity multiplier
  - 20% inactive users → 0.2x activity multiplier
- **Temporal patterns**:
  - 60% of activity in last 30 days
  - Day-of-week weighting (Friday: 1.3x)
- **Transaction tracking**: Full debit/credit audit trail

## Configuration

### Realistic Volumes

See [src/lib/seed/config/realistic-volumes.ts](./config/realistic-volumes.ts)

```typescript
users: {
  total: 200,
  valorize: 200,
  techstart: 35,
  global: 23,
},

compliments: {
  total: 10000,
  valorize: 8500,
  techstart: 1000,
  global: 500,
},

activityDistribution: {
  powerUsersPercentage: 0.2,
  powerUserComplimentMultiplier: 4,
  normalUsersPercentage: 0.6,
  normalUserComplimentMultiplier: 1,
  inactiveUsersPercentage: 0.2,
  inactiveUserComplimentMultiplier: 0.2,
},

weeklyRenewals: {
  weeks: 13,
  coinsPerWeek: 500,
}
```

## Progress Reporting

The seed system uses CLI progress bars for real-time feedback:

```
🌱 STARTING DATABASE SEEDING

Clearing existing data...
✅ Database cleared

Running 16 seeders in dependency order...

✅ Companies: 1 records in 245ms
✅ Permissions: 1 records in 189ms
✅ Roles: 1 records in 156ms
...
✅ Compliments: 1 records in 42352ms
✅ Transactions: 1 records in 8234ms
...

🔍 RUNNING COMPREHENSIVE VALIDATION
```

## Validation System

### Validation Metrics

The comprehensive validator (`seed-validator.ts`) checks:

1. **Data Completeness**
   - Expected user count (200)
   - Expected compliment count (10,000)
   - All users have wallets
   - All users assigned to companies

2. **Pareto Distribution** (80/20 Rule)
   - Power users (20%) should generate ~80% activity
   - Normal users (60%) should generate ~15% activity
   - Inactive users (20%) should generate ~5% activity
   - Precision levels: Accurate, Acceptable, Skewed

3. **Balance Consistency**
   - No negative balances
   - Wallet transactions exist
   - Transaction amounts valid

4. **Temporal Patterns**
   - 60% of compliments in last 30 days
   - Day-of-week distribution
   - Date ranges realistic

5. **Detailed Metrics Report**
   - Top 10 senders/receivers
   - Company-wise distribution
   - Balance statistics by activity group
   - Transaction type breakdown

### Validation Output

```
================================================================================
📊 SEED DATA VALIDATION REPORT
================================================================================

Status: ✅ VALID

📋 VALIDATION SUMMARY
✅ User count: 258/200
✅ Compliments count: 10069/10000
✅ Temporal Distribution: 57.0% in last 30 days
✅ Balance Consistency: All wallets match transaction sums
⚠️  Pareto Distribution: Acceptable (Power: 55.3%)

📈 DETAILED METRICS
👥 USERS: Total: 258, By Company: {...}, By Activity Group: {...}
💬 COMPLIMENTS: Total: 10069, Distribution: {...}
💰 BALANCES: Compliment: {...}, Redeemable: {...}
📊 PARETO: Power: 55.3%, Normal: 42.0%, Inactive: 2.7%
📝 TRANSACTIONS: Total: 23501, Renewals: 3354, Credits: 10069, Debits: 10069
```

## Data Files

### Data Definitions

- `data/users.ts` - Test user credentials and metadata
- `data/compliments.ts` - Gabriel's hand-crafted compliments
- `data/redemptions.ts` - Redemption test data
- `data/companies.ts` - Company configuration
- `data/roles-and-permissions.ts` - RBAC configuration

### Utilities

- `utils/progress-reporter.ts` - CLI progress bars and messaging
- `utils/batch-wallet-updater.ts` - Efficient multi-user wallet updates
- `utils/clear-database.ts` - Database cleanup
- `utils/verify-seed.ts` - Legacy verification

### Factories

- `factories/user.factory.ts` - Realistic user generation
- `factories/compliment.factory.ts` - Bulk compliment generation
- `factories/compliment-message.ts` - Realistic message templates

## Performance Characteristics

### Typical Seeding Times

```
Database clearing:           ~2-3 seconds
Companies + RBAC:            ~1-2 seconds
Users + Wallets:             ~5-8 seconds
Compliments (10K):           ~35-45 seconds
Transactions (23K):          ~8-12 seconds
Validation:                  ~2-3 seconds
────────────────────────────────────────
Total end-to-end:            ~60-80 seconds
```

### Data Volume

- **Users**: 258
- **Compliments**: 10,069
- **Transactions**: 23,501 (13 weekly renewals per user + debit/credit pairs)
- **Total coins issued**: 1.86M compliments + 313K redeemable

## Common Operations

### Reset Everything

```bash
npm run db:reset
```

### Validate Current Data

```bash
npx tsx utility-tests/validate-seed.ts
```

### Programmatic Usage

```typescript
import { seed } from '@/lib/seed'

// With validation (default)
await seed()

// Skip validation for faster seeding
await seed(false)
```

## Troubleshooting

### "Validation failed - data has errors"

Check the validation output for specific errors:

1. **Missing users/compliments** → Data generation failed, check seeder logs
2. **Balance inconsistencies** → Transaction calculation issue
3. **Pareto skewed** → Activity distribution needs tuning in `realistic-volumes.ts`

### "Compliment balance is 0"

This is expected for inactive users (0.2x multiplier). Check power users have 4,000+ compliments sent.

### Seed Process Hangs

- Check database connection (PostgreSQL must be running)
- Verify `.env` DATABASE_URL is correct
- Check available disk space

## Advanced: Adjusting Pareto Distribution

To achieve stricter 80/20 distribution, modify `realistic-volumes.ts`:

```typescript
activityDistribution: {
  powerUserComplimentMultiplier: 5,  // Increase from 4
  normalUserComplimentMultiplier: 0.8, // Decrease from 1
  inactiveUserComplimentMultiplier: 0.1, // Decrease from 0.2
}
```

Then re-seed:

```bash
npm run db:reset
npx tsx utility-tests/validate-seed.ts
```

## File Structure

```
src/lib/seed/
├── index.ts                          ← Main orchestrator (START HERE)
├── SEED_GUIDE.md                     ← This file
├── config/
│   └── realistic-volumes.ts          ← Configuration constants
├── data/
│   ├── users.ts
│   ├── compliments.ts
│   ├── redemptions.ts
│   ├── companies.ts
│   └── roles-and-permissions.ts
├── factories/
│   ├── user.factory.ts
│   ├── compliment.factory.ts
│   └── compliment-message.ts
├── seeders/
│   ├── base.seeder.ts
│   ├── compliment.seeder.ts          ← Main seeding
│   ├── user.seeder.ts
│   ├── wallet.seeder.ts
│   └── ... (13 more seeders)
├── utils/
│   ├── progress-reporter.ts          ← Visual feedback
│   ├── batch-wallet-updater.ts       ← Efficient updates
│   ├── clear-database.ts
│   └── verify-seed.ts
└── validators/
    └── seed-validator.ts             ← Comprehensive validation
```

## Next Steps

1. Run `npm run db:reset` to seed your local database
2. Verify with `npx tsx utility-tests/validate-seed.ts`
3. Explore metrics for data distribution insights
4. Adjust `realistic-volumes.ts` if needed for different distributions
5. Use Gabriel's test account to verify wallet transactions

---

**Last Updated**: November 2025
**System Version**: Phase 4 - Complete Seed Pipeline
**Status**: Production Ready ✅
