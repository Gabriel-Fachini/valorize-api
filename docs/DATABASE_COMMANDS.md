# Database Reset & Seed Commands

## Commands Available

### `npm run db:reset`
**⚠️ DANGER: Development Only - This will DELETE ALL DATA!**

This command will:
1. Drop the entire database
2. Recreate the database
3. Run all Prisma migrations
4. Execute the seed script to populate with sample data

```bash
npm run db:reset
```

**Use this when:**
- You want a completely fresh database
- You've made changes to migrations and want to start over
- You need to reset to default seed data for testing

### `npm run db:seed`
**Safe: Only adds data**

This command will:
1. Clear existing seed data (compliments, wallets, users, etc.)
2. Re-populate the database with fresh seed data
3. Keep your database schema intact

```bash
npm run db:seed
```

**Use this when:**
- You want to refresh seed data without touching the schema
- You've updated seed data and want to reload it
- You want to restore default test data

### Other Database Commands

```bash
# Generate Prisma Client after schema changes
npm run db:generate

# Push schema changes without migrations (dev only)
npm run db:push

# Create a new migration and apply it
npm run db:migrate

# Apply pending migrations (production)
npm run db:migrate:deploy

# Open Prisma Studio database GUI
npm run db:studio
```

## Safety Notes

### Development Environment Only
The `db:reset` command includes the `--force` flag which bypasses confirmation prompts. This is intentional for development workflows but should **NEVER** be used in production.

### Production Safety
For production databases, you should:
1. Never use `db:reset`
2. Use `db:migrate:deploy` for migrations
3. Never run seed scripts (or create production-safe seeds)
4. Always backup before any schema changes

### Environment Variables
Make sure your `.env` file points to your development database:

```env
# Development
DATABASE_URL="postgresql://user:password@localhost:5432/valorize_dev"

# NEVER point to production in development!
```

## Workflow Examples

### Starting Fresh
```bash
# Complete reset - use when you need everything clean
npm run db:reset
```

### Schema Changes
```bash
# After modifying schema.prisma
npm run db:migrate
# This creates a migration and applies it
```

### Seed Data Changes
```bash
# After modifying seed data files
npm run db:seed
# This refreshes just the data
```

### Before Running Tests
```bash
# Reset to known state
npm run db:reset

# Run tests
npm test
```

## What Gets Seeded

When you run `db:seed`, the following data is created:

1. **Companies** - Sample companies including Valorize Corp
2. **Permissions** - All system permissions
3. **Roles** - Admin, Manager, User roles with permissions
4. **Users** - Sample users including Gabriel
5. **Wallets** - Wallets for all users
6. **Company Values** - Company culture values
7. **Company Contacts** - Contact information
8. **Compliments** - Sample compliments between users
9. **Wallet Transactions** - Transaction history for all compliments and additional samples

See `docs/TRANSACTION_SEEDING.md` for more details on transaction data.

## Troubleshooting

### Command fails with "database doesn't exist"
```bash
# Manually create the database first
createdb valorize_dev

# Then run reset
npm run db:reset
```

### Seed fails midway
```bash
# The seed script clears data at start, so just run it again
npm run db:seed
```

### Migration conflicts
```bash
# If you have migration conflicts, reset and start fresh
npm run db:reset
```

### Port already in use (Prisma Studio)
```bash
# Kill the existing Prisma Studio process
# macOS/Linux:
lsof -ti:5555 | xargs kill

# Then open studio again
npm run db:studio
```

## CI/CD Integration

For automated testing in CI/CD:

```yaml
# Example GitHub Actions
- name: Setup Database
  run: |
    npm run db:reset
    
- name: Run Tests
  run: npm test
```

## Quick Reference

| Command | Safe? | Effect | When to Use |
|---------|-------|--------|-------------|
| `db:reset` | ❌ No | Drops & recreates DB | Fresh start needed |
| `db:seed` | ⚠️ Clears data | Clears & reseeds data | Refresh seed data |
| `db:migrate` | ✅ Yes | Creates & applies migration | Schema changes |
| `db:push` | ⚠️ Dev only | Pushes schema without migration | Quick prototyping |
| `db:generate` | ✅ Yes | Regenerates Prisma Client | After schema changes |
| `db:studio` | ✅ Yes | Opens database GUI | View/edit data |
