# Transaction Seeding Documentation

## Overview
The transaction seeding system creates sample wallet transaction data for testing and demonstration purposes. Transactions are automatically created when compliments are sent/received, and additional sample transactions can be added for various scenarios.

## What Gets Seeded

### 1. Compliment Transactions (Automatic)
When compliments are seeded via `ComplimentSeeder`, the following transactions are automatically created:

- **DEBIT transactions** for senders (COMPLIMENT balance)
  - Records the coins deducted from sender's compliment balance
  - Includes metadata: receiver info, company value, message excerpt
  
- **CREDIT transactions** for receivers (REDEEMABLE balance)
  - Records the coins added to receiver's redeemable balance
  - Includes metadata: sender info, company value, message excerpt

### 2. Additional Sample Transactions
The `TransactionSeeder` adds extra transaction types for demonstration:

- **Monthly Allowance** (CREDIT to COMPLIMENT balance)
  - Simulates periodic compliment coin allocations
  - Metadata includes period information

- **Admin Bonus** (CREDIT to REDEEMABLE balance)
  - Simulates administrator-granted rewards
  - Metadata includes achievement description

- **Admin Adjustments** (CREDIT/DEBIT)
  - Simulates manual balance corrections
  - Metadata includes admin ID and reason

## Transaction Model

Each transaction record includes:

```typescript
{
  id: string              // Unique identifier
  walletId: string        // Associated wallet
  userId: string          // Transaction owner
  transactionType: string // DEBIT, CREDIT, RESET
  balanceType: string     // COMPLIMENT, REDEEMABLE
  amount: number          // Transaction amount
  previousBalance: number // Balance before transaction
  newBalance: number      // Balance after transaction
  reason: string          // Human-readable reason
  metadata: JsonObject    // Additional context data
  createdAt: DateTime     // Timestamp
}
```

## Transaction Metadata Examples

### Compliment Transaction
```json
{
  "receiverId": "user_abc123",
  "receiverName": "John Doe",
  "valueId": 1,
  "message": "Great work on the project!"
}
```

### Monthly Allowance
```json
{
  "type": "monthly_allowance",
  "automatic": true,
  "period": "2025-10"
}
```

### Admin Bonus
```json
{
  "achievement": "Completed onboarding",
  "type": "bonus",
  "automatic": true
}
```

### Admin Action
```json
{
  "adminId": "admin_xyz789",
  "reason": "Balance adjustment",
  "type": "admin_action",
  "automatic": false
}
```

## Seeding Order

The seed script executes in this order:

1. `CompanySeeder` - Creates companies
2. `PermissionSeeder` - Creates permissions
3. `RoleSeeder` - Creates roles with permissions
4. `UserSeeder` - Creates users
5. `WalletSeeder` - Creates wallets for all users
6. `ValueSeeder` - Creates company values
7. `ContactSeeder` - Creates company contacts
8. `ComplimentSeeder` - Creates compliments **and their transactions**
9. `TransactionSeeder` - Creates additional sample transactions

## Running the Seed

To seed the database with transaction data:

```bash
# Run via npm script
npm run seed

# Or via tsx directly
tsx src/lib/seed.ts
```

## Verification

After seeding, the verification utility will show:

- Total count of wallet transactions
- Transaction breakdown by type and balance
- Top users by transaction count
- Summary of total coins moved

Example output:
```
💰 Transaction summary:
  DEBIT - COMPLIMENT: 5 transactions, 125 total coins
  CREDIT - REDEEMABLE: 5 transactions, 125 total coins
  CREDIT - COMPLIMENT: 2 transactions, 60 total coins
  Top users by transaction count:
    Gabriel Fachini: 12 transactions
    John Doe: 4 transactions
```

## Files Structure

```
src/lib/seed/
├── data/
│   ├── transactions.ts      # Transaction seed data
│   ├── compliments.ts        # Compliment data (generates transactions)
│   └── ...
├── seeders/
│   ├── transaction.seeder.ts # Additional transaction seeder
│   ├── compliment.seeder.ts  # Compliment seeder (creates transactions)
│   └── ...
├── utils/
│   ├── verify-seed.ts        # Includes transaction verification
│   └── clear-database.ts     # Clears transactions before seeding
└── index.ts                  # Main orchestrator
```

## Customization

### Adding New Transaction Types

1. Add transaction reason to `data/transactions.ts`:
```typescript
export const TRANSACTION_DATA = {
  REASONS: {
    YOUR_NEW_TYPE: 'Description of transaction',
    // ...
  }
}
```

2. Add metadata generator if needed:
```typescript
METADATA_EXAMPLES: {
  yourNewType: (param: string) => ({
    param,
    type: 'your_new_type',
    automatic: true,
  }),
}
```

3. Add to sample transactions array:
```typescript
export const SAMPLE_ADDITIONAL_TRANSACTIONS = [
  {
    transactionType: 'CREDIT',
    balanceType: 'COMPLIMENT',
    amount: 50,
    reason: TRANSACTION_DATA.REASONS.YOUR_NEW_TYPE,
    metadataType: 'yourNewType',
    metadataValue: 'Some value',
  },
  // ...
]
```

## Balance Integrity

The seeding system ensures balance integrity by:

1. Tracking current balances through the seeding process
2. Recording `previousBalance` and `newBalance` for each transaction
3. Updating wallet balances after each transaction
4. Maintaining proper debit/credit relationships

This ensures that:
- All transactions have accurate balance snapshots
- Final wallet balances match the sum of all transactions
- Transaction history is complete and auditable

## Testing Transactions

After seeding, you can test the transaction system via the API:

```bash
# Get user's transaction history
GET /api/wallets/transactions?limit=10&offset=0

# Filter by transaction type
GET /api/wallets/transactions?transactionType=CREDIT

# Filter by balance type
GET /api/wallets/transactions?balanceType=REDEEMABLE

# Filter by date range
GET /api/wallets/transactions?fromDate=2025-10-01&toDate=2025-10-31
```

## Notes

- Transactions are automatically created during the normal compliment flow in the application
- The seed data is for development/testing purposes only
- Transaction IDs use CUID format for uniqueness
- All transactions are immutable once created
- The seed script clears all existing data before running
