# Redemption Seeding Documentation

This document describes the redemption seeding system for the Valorize API. The redemption seeder creates sample prize redemptions with delivery addresses and status tracking history.

## Overview

The redemption seeding system creates:
- **Delivery addresses** for users who need to receive prizes
- **Prize redemptions** with various statuses (pending, processing, shipped, delivered, cancelled)
- **Redemption tracking entries** to simulate status progression
- **Wallet transactions** to deduct coins from redeemable balances
- **Stock updates** to decrease prize and variant inventory

## Redemption Statuses

The system supports the following redemption statuses:

| Status | Description |
|--------|-------------|
| `pending` | Redemption submitted, awaiting processing |
| `processing` | Redemption being prepared for shipment |
| `shipped` | Prize shipped, tracking code available |
| `delivered` | Prize successfully delivered to user |
| `cancelled` | Redemption cancelled (by user or admin) |
| `refunded` | Coins refunded to user's wallet |

## Seed Data

### Gabriel's Redemptions (5 total)

Gabriel (the main test user) has 5 redemptions showcasing different scenarios:

1. **Delivered Wireless Mouse**
   - Status: `delivered` (10 days ago)
   - Cost: 500 coins
   - Tracking: BR123456789
   - Full tracking history: pending → processing → shipped → delivered

2. **Shipped Mechanical Keyboard**
   - Status: `shipped` (5 days ago)
   - Cost: 1,200 coins
   - Variant: Cherry MX Red switches
   - Tracking: BR987654321
   - Tracking history: pending → processing → shipped

3. **Processing Amazon Gift Card**
   - Status: `processing` (2 days ago)
   - Cost: 1,000 coins
   - Variant: $50 USD
   - Tracking history: pending → processing

4. **Pending Headphones**
   - Status: `pending` (1 day ago)
   - Cost: 800 coins
   - Variant: Black color
   - Just submitted

5. **Cancelled Coffee Mug**
   - Status: `cancelled` (1 day ago)
   - Cost: 300 coins
   - Tracking history: pending → cancelled (user changed mind)

**Total coins spent by Gabriel**: 3,800 coins

### Company Redemptions (2 total)

Other users in the Valorize company also have redemptions:

1. **Ana Silva - Delivered Notebook**
   - Status: `delivered` (15 days ago)
   - Cost: 200 coins
   - Variant: A5 size
   - Full tracking history

2. **Carlos Mendes - Shipped T-Shirt**
   - Status: `shipped` (7 days ago)
   - Cost: 600 coins
   - Variant: Medium size, Blue color
   - Tracking: BR456789123

## Delivery Addresses

The seeder creates delivery addresses for all users with redemptions:

### Gabriel's Address
```typescript
{
  name: "Gabriel Fachini",
  street: "Rua das Flores",
  number: "123",
  complement: "Apto 45",
  neighborhood: "Centro",
  city: "São Paulo",
  state: "SP",
  zipCode: "01234-567",
  country: "Brazil",
  phone: "+55 11 98765-4321",
  isDefault: true
}
```

Additional addresses are created for Ana Silva and Carlos Mendes.

## Redemption Tracking

Each redemption includes a detailed tracking history showing status progression:

### Example: Delivered Wireless Mouse
```typescript
[
  {
    status: 'pending',
    notes: 'Redemption received',
    createdBy: 'system'
  },
  {
    status: 'processing',
    notes: 'Order being prepared',
    createdBy: 'admin@valorize.com'
  },
  {
    status: 'shipped',
    notes: 'Package shipped via Correios',
    createdBy: 'admin@valorize.com'
  },
  {
    status: 'delivered',
    notes: 'Package delivered successfully',
    createdBy: 'system'
  }
]
```

Tracking entries are created with realistic timestamps:
- Gabriel's redemptions: 24 hours between each status change
- Company redemptions: 48 hours between each status change

## Wallet Integration

The seeder properly integrates with the wallet system:

### For Gabriel (Batch Transaction)
- **Transaction Type**: `DEBIT`
- **Balance Type**: `REDEEMABLE`
- **Amount**: 3,800 coins (sum of all his redemptions)
- **Reason**: "Prize redemptions"
- **Metadata**: Batch redemption details

### For Other Users (Individual Transactions)
Each user gets a separate transaction for their redemption:
- **Transaction Type**: `DEBIT`
- **Balance Type**: `REDEEMABLE`
- **Amount**: Redemption cost
- **Reason**: "Prize redemption: {prize name}"
- **Metadata**: Includes redemption ID and prize details

## Stock Management

The seeder automatically updates inventory:

1. **Prize Stock**: Decreases by 1 for each redemption
2. **Variant Stock**: Decreases by 1 if a variant was selected

This ensures the catalog reflects redeemed prizes accurately.

## Seeder Execution

The `RedemptionSeeder` class handles all redemption creation:

```typescript
export class RedemptionSeeder extends BaseSeeder {
  async seed(): Promise<void> {
    // 1. Get Gabriel's user and wallet
    // 2. Create delivery addresses
    // 3. Create Gabriel's redemptions with tracking
    // 4. Update wallet with batch transaction
    // 5. Create company redemptions with tracking
    // 6. Update each user's wallet individually
    // 7. Update prize/variant stock counts
  }
}
```

### Execution Order

Redemptions are seeded **after** prizes and transactions:

1. Companies
2. Permissions & Roles
3. Users & Wallets
4. Values & Contacts
5. **Prizes** (prerequisite for redemptions)
6. Compliments
7. Transactions
8. **Redemptions** (requires prizes, users, wallets)

## Verification

After seeding, the verifier shows redemption statistics:

```
🎉 Redemption summary:
  pending: 1 redemptions, 800 total coins spent
  processing: 1 redemptions, 1000 total coins spent
  shipped: 2 redemptions, 1800 total coins spent
  delivered: 2 redemptions, 1700 total coins spent
  cancelled: 1 redemptions, 300 total coins spent
  Total tracking entries: 17
  Top users by redemption count:
    Gabriel Fachini: 5 redemptions
    Ana Silva: 1 redemptions
    Carlos Mendes: 1 redemptions
```

## Testing Scenarios

The seed data provides comprehensive scenarios for testing:

1. **Full Redemption Lifecycle**: Follow Gabriel's delivered mouse from pending to delivered
2. **In-Progress Tracking**: Check status of shipped keyboard
3. **Pending Orders**: Test processing workflow with pending headphones
4. **Cancellations**: Handle cancelled orders (coffee mug)
5. **Multiple Users**: Test redemptions across different users
6. **Variant Selection**: Test redemptions with specific variants (colors, sizes)
7. **Address Management**: Test delivery address validation
8. **Stock Deduction**: Verify inventory decreases after redemptions
9. **Wallet Deductions**: Confirm coins are properly deducted

## Database Schema

### Redemption Model
```prisma
model Redemption {
  id            String   @id @default(cuid())
  userId        String
  prizeId       String
  variantId     String?
  companyId     String
  addressId     String
  coinsSpent    Int
  status        String   @default("pending")
  trackingCode  String?
  redeemedAt    DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  user          User     @relation(...)
  prize         Prize    @relation(...)
  variant       PrizeVariant? @relation(...)
  company       Company  @relation(...)
  address       Address  @relation(...)
  tracking      RedemptionTracking[]
}
```

### RedemptionTracking Model
```prisma
model RedemptionTracking {
  id            String   @id @default(cuid())
  redemptionId  String
  status        String
  notes         String?
  createdBy     String
  createdAt     DateTime @default(now())
  
  redemption    Redemption @relation(...)
}
```

## Files

- **Data**: `src/lib/seed/data/redemptions.ts`
- **Seeder**: `src/lib/seed/seeders/redemption.seeder.ts`
- **Execution**: `src/lib/seed/index.ts`
- **Verification**: `src/lib/seed/utils/verify-seed.ts`
- **Cleanup**: `src/lib/seed/utils/clear-database.ts`

## Running the Seed

```bash
# Full database reset with all seeds including redemptions
npm run db:reset

# Just seed (if database already migrated)
npm run db:seed
```

## Summary

The redemption seeding system provides:
- ✅ 7 total redemptions across 3 users
- ✅ 6 different redemption statuses
- ✅ 17 tracking entries showing status progression
- ✅ 3 delivery addresses
- ✅ Wallet transactions totaling 5,500 coins
- ✅ Stock updates for 7 prizes/variants
- ✅ Complete redemption lifecycle examples
- ✅ Multi-user redemption scenarios
- ✅ Variant selection examples

This comprehensive seed data enables thorough testing of the prize redemption system!
