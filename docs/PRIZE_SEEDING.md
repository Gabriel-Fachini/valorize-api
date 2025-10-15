# Prize Seeding Documentation

## Overview

The prize seeding system creates a comprehensive catalog of rewards that users can redeem with their coins. It includes both global prizes (available to all companies) and company-specific prizes (exclusive to certain companies).

## Prize Categories

The system includes the following categories:

1. **Electronics** - Tech gadgets and devices
2. **Gift Cards** - Digital and physical gift cards
3. **Experiences** - Classes, events, and activities
4. **Books & Media** - Books, audiobooks, and media content
5. **Health & Wellness** - Fitness and wellness products
6. **Food & Beverages** - Restaurant vouchers and food items
7. **Branded Merchandise** - Company-branded items
8. **Charity Donations** - Charitable contribution options

## Prize Types

### Global Prizes (Available to All Companies)

Global prizes have `companyId: null` and are available to users from any company:

- **Amazon Gift Cards** ($25, $50)
- **Spotify Premium** (3 months subscription)
- **Wireless Bluetooth Headphones**
- **Starbucks Gift Card** ($25)
- **Online Cooking Class** (Multiple cuisines)
- **Kindle Paperwhite E-Reader**
- **Premium Yoga Mat**
- **Bestseller Book Bundle**
- **Charity Donations** (Education programs)

**Total Global Prizes**: 10 prizes with multiple variants

### Company-Specific Prizes (Valorize Corp Only)

Company-specific prizes have a `companyId` and are only available to users from that company:

- **Valorize Branded Hoodie** (Multiple sizes)
- **Team Lunch Voucher** ($100 for up to 5 people)
- **Extra Day Off** (Paid time off)
- **Valorize Water Bottle** (Insulated, multiple colors)

**Total Company Prizes**: 4 prizes with multiple variants

## Prize Structure

Each prize includes:

```typescript
{
  id: string              // Unique identifier
  companyId: string?      // null for global, company ID for specific
  name: string            // Prize name
  description: string     // Detailed description
  category: string        // One of the prize categories
  images: string[]        // Array of image URLs
  coinPrice: number       // Cost in coins
  brand: string?          // Brand name (optional)
  specifications: JSON    // Detailed specs/features
  stock: number           // Available quantity
  isActive: boolean       // Availability status
  createdAt: DateTime
  updatedAt: DateTime
}
```

## Prize Variants

Most prizes have variants (size, color, format, etc.):

```typescript
{
  id: string              // Unique identifier
  prizeId: string         // Parent prize ID
  name: string            // Variant type (Size, Color, Format)
  value: string           // Variant value (M, Black, Digital)
  stock: number           // Available quantity for this variant
  isActive: boolean       // Availability status
}
```

### Example Variants

**Headphones**:
- Color: Black (stock: 10)
- Color: Silver (stock: 10)

**Hoodie**:
- Size: S (stock: 5)
- Size: M (stock: 15)
- Size: L (stock: 20)
- Size: XL (stock: 10)

**Cooking Class**:
- Cuisine: Italian (stock: 10)
- Cuisine: Japanese (stock: 10)
- Cuisine: French (stock: 10)

## Specifications

Each prize includes detailed specifications as JSON:

### Gift Card Example
```json
{
  "value": "$25 USD",
  "format": "Digital Code",
  "expiration": "No expiration",
  "delivery": "Instant email delivery"
}
```

### Electronics Example
```json
{
  "battery": "30 hours",
  "connectivity": "Bluetooth 5.0",
  "features": "Active Noise Cancellation, Foldable Design",
  "warranty": "1 year"
}
```

### Experience Example
```json
{
  "duration": "2 hours",
  "format": "Live online session",
  "includes": "Recipe guide and ingredient list",
  "scheduling": "Multiple dates available"
}
```

## Coin Pricing

Prizes are priced based on their real-world value and desirability:

| Price Range | Examples |
|-------------|----------|
| 200-300 coins | Charity donations, water bottles |
| 250-500 coins | Gift cards ($25), yoga mats, book bundles |
| 600-800 coins | Branded hoodies, electronics accessories |
| 1000-1200 coins | Team lunches, Kindle e-readers |
| 1500+ coins | Extra days off, premium experiences |

## Seeding Process

When you run `npm run db:seed`, the prize seeder:

1. Creates all global prizes (available to all companies)
2. Creates variants for each prize
3. Creates company-specific prizes for Valorize Corp
4. Creates variants for company-specific prizes

### Execution Order

```
1. Companies
2. Permissions
3. Roles
4. Users
5. Wallets
6. Company Values
7. Company Contacts
8. Prizes ← Prize seeder runs here
9. Compliments
10. Transactions
```

## Verification Output

After seeding, you'll see statistics like:

```
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

## Customization

### Adding New Global Prizes

Edit `src/lib/seed/data/prizes.ts`:

```typescript
export const GLOBAL_PRIZES = [
  // ... existing prizes
  {
    name: 'Your New Prize',
    description: 'Description of the prize',
    category: PRIZE_CATEGORIES.ELECTRONICS,
    images: ['https://example.com/image.jpg'],
    coinPrice: 500,
    brand: 'Brand Name',
    stock: 50,
    specifications: {
      feature1: 'Value 1',
      feature2: 'Value 2',
    },
    variants: [
      { name: 'Color', value: 'Red', stock: 25 },
      { name: 'Color', value: 'Blue', stock: 25 },
    ],
  },
]
```

### Adding New Company-Specific Prizes

Edit `src/lib/seed/data/prizes.ts`:

```typescript
export const VALORIZE_COMPANY_PRIZES = [
  // ... existing prizes
  {
    name: 'Your Company Prize',
    description: 'Exclusive for company employees',
    category: PRIZE_CATEGORIES.MERCHANDISE,
    images: ['https://example.com/image.jpg'],
    coinPrice: 400,
    brand: 'Your Company',
    stock: 30,
    specifications: {
      exclusive: true,
      quality: 'Premium',
    },
    variants: [
      { name: 'Type', value: 'Standard', stock: 30 },
    ],
  },
]
```

### Adding New Prize Category

1. Add to categories:
```typescript
export const PRIZE_CATEGORIES = {
  // ... existing categories
  YOUR_NEW_CATEGORY: 'Your Category Name',
}
```

2. Use in prize data:
```typescript
{
  name: 'Prize Name',
  category: PRIZE_CATEGORIES.YOUR_NEW_CATEGORY,
  // ... other fields
}
```

## Testing Prizes

After seeding, you can test via API:

```bash
# List all prizes
GET /api/prizes

# Filter by category
GET /api/prizes?category=Electronics

# Get specific prize details (with variants)
GET /api/prizes/{prizeId}

# Company-specific prizes
GET /api/prizes?companyId={companyId}
```

## Database Queries

### Get all prizes with variants
```sql
SELECT p.*, json_agg(pv.*) as variants
FROM prizes p
LEFT JOIN prize_variants pv ON pv.prize_id = p.id
GROUP BY p.id;
```

### Get prizes by category with stock
```sql
SELECT category, COUNT(*) as prize_count, SUM(stock) as total_stock
FROM prizes
WHERE is_active = true
GROUP BY category;
```

### Get global vs company-specific count
```sql
SELECT 
  COUNT(CASE WHEN company_id IS NULL THEN 1 END) as global_prizes,
  COUNT(CASE WHEN company_id IS NOT NULL THEN 1 END) as company_prizes
FROM prizes;
```

## Prize Redemption Flow

When a user redeems a prize:

1. **Check balance**: User must have enough redeemable coins
2. **Check stock**: Prize and variant must be in stock
3. **Create redemption**: Record in `redemptions` table
4. **Deduct coins**: Debit from user's redeemable balance
5. **Create transaction**: Record wallet transaction
6. **Update stock**: Decrement prize/variant stock
7. **Track status**: Create redemption tracking record

## Business Rules

### Stock Management
- Stock is tracked at both prize and variant level
- When stock reaches 0, prize should be hidden or marked unavailable
- Admins can adjust stock levels

### Pricing Strategy
- Prices should reflect real-world value
- Consider inflation and market rates
- Balance desirability with coin economy

### Global vs Company Prizes
- Global prizes: broad appeal, easy fulfillment
- Company prizes: unique experiences, brand loyalty
- Mix ensures variety and exclusivity

### Variant Strategy
- Use variants for: size, color, format, flavor, etc.
- Track stock per variant for accuracy
- Allow users to choose during redemption

## Future Enhancements

Potential improvements to the prize system:

1. **Dynamic Pricing**: Adjust prices based on demand
2. **Seasonal Prizes**: Limited-time offers
3. **Prize Bundles**: Combine multiple prizes
4. **User Wishlists**: Save favorite prizes
5. **Prize Reviews**: User ratings and reviews
6. **Inventory Alerts**: Notify admins of low stock
7. **Prize Analytics**: Track redemption patterns
8. **Personalized Recommendations**: Based on user preferences

## Related Documentation

- **[TRANSACTION_SEEDING.md](TRANSACTION_SEEDING.md)** - How transactions are created for redemptions
- **[prizes-api.md](prizes-api.md)** - Complete API documentation for prizes
- **[DATABASE_COMMANDS.md](DATABASE_COMMANDS.md)** - How to reset and seed the database

## Files Structure

```
src/lib/seed/
├── data/
│   └── prizes.ts              # Prize seed data
├── seeders/
│   └── prize.seeder.ts        # Prize seeder logic
└── utils/
    ├── verify-seed.ts         # Includes prize verification
    └── clear-database.ts      # Clears prizes before seeding
```

## Summary

The prize seeding system provides:
- ✅ **10 global prizes** with broad appeal
- ✅ **4 company-specific prizes** for brand loyalty
- ✅ **35+ variants** for user choice
- ✅ **8 categories** covering diverse interests
- ✅ **Detailed specifications** for informed decisions
- ✅ **Stock management** at prize and variant level
- ✅ **Flexible pricing** from 200 to 1500+ coins

Run `npm run db:reset` to seed all prizes and start exploring! 🎁
