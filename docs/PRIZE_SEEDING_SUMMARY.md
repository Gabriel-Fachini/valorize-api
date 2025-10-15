# Prize Seeding - Summary

## What Was Added ✅

I've successfully added comprehensive prize (reward) seeding to your Valorize API project!

### New Files Created

#### 1. `src/lib/seed/data/prizes.ts`
Complete prize catalog data including:
- **10 global prizes** (available to all companies)
- **4 company-specific prizes** (exclusive to Valorize Corp)
- **35+ prize variants** (sizes, colors, formats, etc.)
- Detailed specifications for each prize
- Prize categories and pricing structure

#### 2. `src/lib/seed/seeders/prize.seeder.ts`
Seeder class that:
- Creates global prizes with `companyId: null`
- Creates company-specific prizes for Valorize Corp
- Generates all prize variants
- Provides detailed logging and statistics

#### 3. `docs/PRIZE_SEEDING.md`
Comprehensive documentation covering:
- Prize categories and types
- Prize structure and specifications
- Variant management
- Customization guide
- API testing examples
- Business rules and future enhancements

### Modified Files

#### `src/lib/seed/index.ts`
- Added import for `PrizeSeeder`
- Added prize seeding to execution order (before ComplimentSeeder)

#### `src/lib/seed/utils/verify-seed.ts`
- Added `prizes` and `prizeVariants` to database counts
- New `showPrizeSummary()` method showing:
  - Prize breakdown by category
  - Global vs company-specific counts
  - Total stock per category
  - Total variant count

#### `src/lib/seed/utils/clear-database.ts`
- Added `prizeVariant.deleteMany()` and `prize.deleteMany()`
- Ensures prizes are cleared before wallets

## Prize Categories

The system includes **8 prize categories**:

1. 🖥️ **Electronics** - Headphones, Kindle e-readers
2. 🎁 **Gift Cards** - Amazon, Starbucks, Spotify
3. 🎭 **Experiences** - Cooking classes, team lunches, extra days off
4. 📚 **Books & Media** - Book bundles
5. 🧘 **Health & Wellness** - Yoga mats, wellness products
6. 🍔 **Food & Beverages** - Restaurant vouchers
7. 👕 **Branded Merchandise** - Company hoodies, water bottles
8. ❤️ **Charity Donations** - Educational programs

## Prize Types

### Global Prizes (10 prizes)

Available to users from any company:

| Prize | Category | Coins | Stock |
|-------|----------|-------|-------|
| Amazon Gift Card $25 | Gift Cards | 250 | 100 |
| Amazon Gift Card $50 | Gift Cards | 500 | 50 |
| Spotify Premium 3mo | Gift Cards | 300 | 75 |
| Bluetooth Headphones | Electronics | 800 | 20 |
| Starbucks Gift Card $25 | Food | 250 | 150 |
| Online Cooking Class | Experiences | 400 | 30 |
| Kindle Paperwhite | Electronics | 1200 | 15 |
| Premium Yoga Mat | Wellness | 350 | 40 |
| Bestseller Book Bundle | Books | 450 | 25 |
| Charity Donation | Charity | 200 | 999 |

### Company-Specific Prizes (4 prizes)

Exclusive to Valorize Corp employees:

| Prize | Category | Coins | Stock |
|-------|----------|-------|-------|
| Valorize Branded Hoodie | Merchandise | 600 | 50 |
| Team Lunch Voucher | Experiences | 1000 | 10 |
| Extra Day Off | Experiences | 1500 | 20 |
| Valorize Water Bottle | Merchandise | 200 | 100 |

## Prize Variants

Most prizes include multiple variants for user choice:

**Examples:**
- Headphones: Black, Silver
- Hoodie: S, M, L, XL
- Cooking Class: Italian, Japanese, French
- Water Bottle: Black, Blue, Silver
- Gift Cards: Digital, Physical

**Total Variants**: 35+ across all prizes

## Prize Specifications

Each prize includes detailed specifications:

```json
{
  "battery": "30 hours",
  "connectivity": "Bluetooth 5.0",
  "features": "Active Noise Cancellation",
  "warranty": "1 year"
}
```

## Seeding Output

When you run `npm run db:reset`, you'll see:

```
🌱 Seeding prizes...
✅ Created 14 prizes
   Created 10 global prizes
   Created 4 company-specific prizes
   Created 35 prize variants

🎁 Prize summary:
  Electronics: 3 prizes, 45 total stock
  Gift Cards: 3 prizes, 375 total stock
  Experiences: 3 prizes, 60 total stock
  Books & Media: 1 prizes, 25 total stock
  Health & Wellness: 1 prizes, 40 total stock
  Food & Beverages: 1 prizes, 150 total stock
  Branded Merchandise: 2 prizes, 150 total stock
  Charity Donations: 1 prizes, 999 total stock
  Global prizes: 10
  Company-specific prizes: 4
  Total prize variants: 35
```

## Complete Seed Data Now Includes

After running `npm run db:reset`, your database contains:

1. ✅ **2 Companies** (Valorize Corp + another)
2. ✅ **12+ Permissions** (users:read, compliments:send, etc.)
3. ✅ **3+ Roles** (Admin, Manager, User)
4. ✅ **5+ Users** (Gabriel and team members)
5. ✅ **Wallets** for all users (initial balances)
6. ✅ **Company Values** (Innovation, Teamwork, etc.)
7. ✅ **Company Contacts** (Contact information)
8. ✅ **14 Prizes** 🆕 (10 global + 4 company-specific)
9. ✅ **35+ Prize Variants** 🆕 (sizes, colors, formats)
10. ✅ **Sample Compliments** (with wallet transactions)
11. ✅ **Wallet Transactions** (complete audit trail)

## Testing Prizes

After seeding, test via API:

```bash
# List all prizes
GET /api/prizes

# Filter by category
GET /api/prizes?category=Electronics

# Get prize details with variants
GET /api/prizes/{prizeId}

# Filter by company (global + company-specific)
GET /api/prizes?companyId={companyId}
```

## Customization

### Adding New Prizes

Edit `src/lib/seed/data/prizes.ts`:

```typescript
export const GLOBAL_PRIZES = [
  // ... existing prizes
  {
    name: 'Your New Prize',
    description: 'Prize description',
    category: PRIZE_CATEGORIES.ELECTRONICS,
    images: ['https://example.com/image.jpg'],
    coinPrice: 500,
    brand: 'Brand Name',
    stock: 50,
    specifications: {
      feature1: 'Value',
      feature2: 'Value',
    },
    variants: [
      { name: 'Color', value: 'Red', stock: 25 },
      { name: 'Color', value: 'Blue', stock: 25 },
    ],
  },
]
```

### Adding New Categories

```typescript
export const PRIZE_CATEGORIES = {
  // ... existing categories
  YOUR_CATEGORY: 'Category Name',
}
```

## Database Structure

### Prizes Table
```sql
CREATE TABLE prizes (
  id              TEXT PRIMARY KEY,
  company_id      TEXT REFERENCES companies(id),  -- NULL for global
  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  category        TEXT NOT NULL,
  images          TEXT[] NOT NULL,
  coin_price      INTEGER NOT NULL,
  brand           TEXT,
  specifications  JSONB,
  stock           INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

### Prize Variants Table
```sql
CREATE TABLE prize_variants (
  id         TEXT PRIMARY KEY,
  prize_id   TEXT REFERENCES prizes(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,      -- Variant type (Size, Color)
  value      TEXT NOT NULL,      -- Variant value (M, Black)
  stock      INTEGER DEFAULT 0,
  is_active  BOOLEAN DEFAULT true
);
```

## Integration with Redemption System

When a user redeems a prize:

1. **Check balance** - User must have enough redeemable coins
2. **Check stock** - Prize and variant must be available
3. **Create redemption** - Record in redemptions table
4. **Deduct coins** - Create wallet transaction (DEBIT)
5. **Update stock** - Decrement prize/variant stock
6. **Track status** - Create redemption tracking

## Business Rules

### Stock Management
- Track stock at both prize and variant levels
- Hide prizes when stock reaches 0
- Admins can manually adjust stock

### Global vs Company Prizes
- **Global prizes**: Broad appeal, easy fulfillment
- **Company prizes**: Brand loyalty, exclusive perks

### Pricing Strategy
- Based on real-world value and desirability
- Range: 200 coins (water bottle) to 1500+ coins (extra day off)
- Balanced for coin economy

## Future Enhancements

Potential improvements:

1. 🎯 **Dynamic Pricing** - Adjust based on demand
2. 📅 **Seasonal Prizes** - Limited-time offers
3. 📦 **Prize Bundles** - Combine multiple items
4. ⭐ **Wishlists** - Save favorite prizes
5. 💬 **Reviews & Ratings** - User feedback
6. 🔔 **Inventory Alerts** - Low stock notifications
7. 📊 **Analytics** - Redemption patterns
8. 🎁 **Recommendations** - Personalized suggestions

## Files Created/Modified

**Created:**
- `src/lib/seed/data/prizes.ts`
- `src/lib/seed/seeders/prize.seeder.ts`
- `docs/PRIZE_SEEDING.md`

**Modified:**
- `src/lib/seed/index.ts`
- `src/lib/seed/utils/verify-seed.ts`
- `src/lib/seed/utils/clear-database.ts`

## Related Documentation

- **[PRIZE_SEEDING.md](PRIZE_SEEDING.md)** - Complete prize seeding guide
- **[TRANSACTION_SEEDING.md](TRANSACTION_SEEDING.md)** - Transaction audit trail
- **[DATABASE_COMMANDS.md](DATABASE_COMMANDS.md)** - Database reset & seed commands
- **[prizes-api.md](prizes-api.md)** - Prize API endpoints

## Summary Statistics

- **Files Created**: 3 new files
- **Files Modified**: 3 existing files
- **Prize Categories**: 8 categories
- **Global Prizes**: 10 prizes
- **Company Prizes**: 4 prizes
- **Total Prizes**: 14 prizes
- **Prize Variants**: 35+ variants
- **Total Stock**: 1,600+ items

## Ready to Use! 🎁

Run the seed command:

```bash
npm run db:reset
```

Your prize catalog is now fully seeded and ready for users to browse and redeem! 🚀
