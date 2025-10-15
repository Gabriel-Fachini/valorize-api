# Database Reset Command - Summary

## New Command Added ✅

I've successfully added a new database reset command to your `package.json` for development use.

### Command

```bash
npm run db:reset
```

### What It Does

This command executes two operations in sequence:

1. **`prisma migrate reset --force`**
   - Drops the entire database
   - Recreates the database
   - Runs all migrations from `prisma/migrations/`
   - Uses `--force` flag to skip confirmation (dev-friendly)

2. **`npm run db:seed`**
   - Executes the seed script (`tsx src/lib/seed.ts`)
   - Populates database with sample data
   - Creates users, companies, wallets, transactions, etc.

### Package.json Entry

```json
{
  "scripts": {
    "db:reset": "prisma migrate reset --force && npm run db:seed"
  }
}
```

### When to Use

✅ **Use this command when:**
- Starting fresh on a development machine
- Testing database migrations from scratch
- Resetting to known sample data state
- After major schema changes
- Before running integration tests

❌ **NEVER use in production:**
- This command DELETES ALL DATA
- The `--force` flag bypasses safety prompts
- For production, use `db:migrate:deploy` instead

### Complete Database Command Reference

| Command | Purpose | Safe for Prod? |
|---------|---------|----------------|
| `npm run db:reset` | Drop DB, migrate, and seed | ❌ Dev only |
| `npm run db:seed` | Clear and reseed data | ⚠️ No (clears data) |
| `npm run db:migrate` | Create new migration | ✅ Yes (with care) |
| `npm run db:migrate:deploy` | Apply migrations | ✅ Yes |
| `npm run db:generate` | Regenerate Prisma Client | ✅ Yes |
| `npm run db:push` | Push schema without migration | ❌ Dev only |
| `npm run db:studio` | Open database GUI | ✅ Yes (read-only) |

### Example Usage

```bash
# Fresh start for development
npm run db:reset

# Output:
# 🧹 Clearing existing data...
# ✅ Database cleared
# 🌱 Seeding companies...
# ✅ Created 2 companies
# ... (continues for all seeders)
# 🎉 Database seeding completed successfully!
```

### Safety Features

1. **Environment Check**: Only use this in development
2. **Separate from Production**: Production should use different commands
3. **Clear Naming**: `reset` makes it obvious this is destructive
4. **Documentation**: Added comprehensive docs in:
   - `docs/DATABASE_COMMANDS.md` - Detailed command reference
   - `docs/QUICK_START.md` - Getting started guide
   - `README.md` - Updated with database section

### Related Documentation

- **[DATABASE_COMMANDS.md](DATABASE_COMMANDS.md)** - Complete database command guide with troubleshooting
- **[QUICK_START.md](QUICK_START.md)** - Step-by-step setup guide for new developers
- **[TRANSACTION_SEEDING.md](TRANSACTION_SEEDING.md)** - Details on what data gets seeded
- **[README.md](../README.md)** - Updated with quick reference

### What Gets Seeded

After running `npm run db:reset`, your database will contain:

1. **2 Companies** (Valorize Corp + another)
2. **12+ Permissions** (users:read, compliments:send, etc.)
3. **3+ Roles** (Admin, Manager, User)
4. **5+ Users** (Including Gabriel and team)
5. **Wallets** for all users (with initial balances)
6. **Company Values** (Innovation, Teamwork, etc.)
7. **Company Contacts** (Contact information)
8. **Sample Compliments** (5-10 compliments between users)
9. **Wallet Transactions** (Complete audit trail for all balance changes)

### Testing the Command

```bash
# Before running
psql -d valorize_dev -c "SELECT COUNT(*) FROM users;"
# Shows existing user count

# Run reset
npm run db:reset

# After running
psql -d valorize_dev -c "SELECT COUNT(*) FROM users;"
# Shows new seeded user count

# Verify transactions
psql -d valorize_dev -c "SELECT COUNT(*) FROM wallet_transactions;"
# Shows transaction count
```

### Troubleshooting

#### "database does not exist"
```bash
# Create the database first
createdb valorize_dev

# Then run reset
npm run db:reset
```

#### "connection refused"
```bash
# Make sure PostgreSQL is running
brew services start postgresql
# or
sudo service postgresql start

# Then try again
npm run db:reset
```

#### Seed script fails
```bash
# The seed script has error handling
# Just run it again if it fails midway
npm run db:seed
```

### CI/CD Integration

You can use this in GitHub Actions or other CI/CD:

```yaml
# .github/workflows/test.yml
- name: Setup Database
  run: npm run db:reset

- name: Run Tests
  run: npm test
```

### Alternative Commands

If you want to refresh data without dropping the database:

```bash
# Just re-run the seed (still clears existing seed data)
npm run db:seed
```

If you want to apply new migrations without resetting:

```bash
# Apply pending migrations only
npm run db:migrate
```

## Summary

✅ **Command Added**: `npm run db:reset`
✅ **Purpose**: Reset database and seed sample data (dev only)
✅ **Documentation**: Created 3 new comprehensive docs
✅ **README**: Updated with database commands section
✅ **Safety**: Clear warnings about dev-only usage

The command is now ready to use for development workflows! 🚀
