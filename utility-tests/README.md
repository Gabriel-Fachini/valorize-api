# Utility Tests & Debug Scripts

This folder contains debug and test scripts for troubleshooting various features of the Valorize API.

## Scripts

### sync-catalog-debug.ts

Debug script for the voucher catalog synchronization flow.

**What it does:**
1. Logs in to the API with provided credentials
2. Calls the `/admin/voucher-products/sync` endpoint
3. Displays detailed error information if something fails

**Prerequisites:**
- API server running on `http://localhost:4000`
- Valid user credentials

**Usage:**

Option 1: Provide credentials as arguments:
```bash
npx tsx utility-tests/sync-catalog-debug.ts user@example.com password
```

Option 2: Set environment variables:
```bash
DEBUG_EMAIL=user@example.com DEBUG_PASSWORD=password npx tsx utility-tests/sync-catalog-debug.ts
```

Option 3: Interactive prompt (no arguments):
```bash
npx tsx utility-tests/sync-catalog-debug.ts
```

## Common Issues & Solutions

### Error: "type is missing"

This error indicates that the `Prize` model requires a `type` field, but the code creating the Prize didn't provide it.

**Solution:** Ensure all places where `Prize.create()` or `Prize.update()` is called include the `type` field with one of these values:
- `"voucher"` - Digital gift cards
- `"experience"` - Intangible rewards
- `"product"` - Physical products (future)

**Relevant Files:**
- `src/features/prizes/vouchers/voucher-prize.repository.ts:81` - Where the error occurs
- `prisma/schema.prisma:321` - Prize model definition

## Notes

- Scripts are ignored in git (see `.gitignore`)
- Use these for development and debugging only
- Never commit sensitive information like credentials
