# Quick Start Guide - Valorize API

This guide will help you get the Valorize API running locally in under 5 minutes.

## Step 1: Prerequisites

Make sure you have installed:
- ✅ Node.js 18+ ([Download](https://nodejs.org/))
- ✅ PostgreSQL ([Download](https://www.postgresql.org/download/))
- ✅ Git

Check versions:
```bash
node --version  # Should be v18.0.0 or higher
npm --version
psql --version
```

## Step 2: Clone & Install

```bash
# Clone the repository
git clone https://github.com/Gabriel-Fachini/valorize-api.git
cd valorize-api

# Install dependencies
npm install
```

## Step 3: Setup Database

### Option A: Create Database Manually
```bash
# Create a PostgreSQL database
createdb valorize_dev

# Or using psql
psql -U postgres
CREATE DATABASE valorize_dev;
\q
```

### Option B: Use Docker (Optional)
```bash
# Start PostgreSQL in Docker
docker run --name valorize-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=valorize_dev \
  -p 5432:5432 \
  -d postgres:15
```

## Step 4: Configure Environment

```bash
# Create .env file
cp .env.example .env
```

Edit `.env` with your settings:
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/valorize_dev"

# Auth0 (use test credentials or your own)
AUTH0_DOMAIN="your-tenant.auth0.com"
AUTH0_AUDIENCE="your-api-identifier"

# Server
NODE_ENV="development"
PORT=3000
```

## Step 5: Initialize Database

```bash
# This will:
# - Drop and recreate the database
# - Run all migrations
# - Seed with sample data (users, companies, transactions, etc.)
npm run db:reset
```

You should see output like:
```
🧹 Clearing existing data...
✅ Database cleared
🌱 Seeding companies...
✅ Created 2 companies
🌱 Seeding permissions...
✅ Created X permissions
...
🎉 Database seeding completed successfully!
```

## Step 6: Start Development Server

```bash
npm run dev
```

You should see:
```
Server listening at http://localhost:3000
```

## Step 7: Verify Installation

### Check API Health
Open your browser or use curl:
```bash
curl http://localhost:3000/health
```

### View Database with Prisma Studio
```bash
npm run db:studio
```

This opens a GUI at `http://localhost:5555` where you can browse all your data.

### Check Swagger Documentation
Open in browser:
```
http://localhost:3000/docs
```

## ✅ You're Ready!

Your API is now running with sample data including:

- 👥 **Users**: Sample users (Gabriel and team)
- 🏢 **Companies**: Valorize Corp and others
- 💰 **Wallets**: All users have wallets with balances
- 🎁 **Compliments**: Sample compliments with transaction history
- 🎯 **Transactions**: Complete audit trail of all wallet changes
- 🔐 **Roles & Permissions**: RBAC system configured

## Next Steps

### Explore the API
```bash
# Get all users (requires auth token)
GET http://localhost:3000/api/users

# Get wallet transactions
GET http://localhost:3000/api/wallets/transactions

# View all routes
GET http://localhost:3000/docs
```

### Test with Sample User
Check the seed data for sample user credentials:
- Look in `src/lib/seed/data/users.ts` for Auth0 IDs
- Use these to authenticate via Auth0

### Make Changes
```bash
# Edit Prisma schema
vim prisma/schema.prisma

# Create and apply migration
npm run db:migrate

# Edit seed data
vim src/lib/seed/data/users.ts

# Re-seed database
npm run db:seed
```

## Common Commands

| Task | Command |
|------|---------|
| Start dev server | `npm run dev` |
| Reset database | `npm run db:reset` |
| Seed data only | `npm run db:seed` |
| View database | `npm run db:studio` |
| Run tests | `npm test` |
| Build for prod | `npm run build` |

## Troubleshooting

### Port 3000 already in use
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill

# Or change PORT in .env
PORT=3001
```

### Database connection error
```bash
# Check PostgreSQL is running
pg_isready

# Verify DATABASE_URL in .env
# Make sure the database exists
psql -U postgres -l | grep valorize_dev
```

### Seed fails
```bash
# Drop everything and start fresh
npm run db:reset
```

### Auth0 errors
- Make sure `AUTH0_DOMAIN` and `AUTH0_AUDIENCE` are correct
- Check Auth0 dashboard for API settings
- For development, you can disable some auth checks temporarily

## Need Help?

- 📚 [Full Documentation](docs/)
- 🐛 [Report Issues](https://github.com/Gabriel-Fachini/valorize-api/issues)
- 💬 Contact: Gabriel Fachini

## What's Next?

- Read [API_ROUTES_DOCUMENTATION.md](API_ROUTES_DOCUMENTATION.md) for available endpoints
- Check [AUTHENTICATION_GUIDE.md](AUTHENTICATION_GUIDE.md) for Auth0 setup
- Explore [TRANSACTION_SEEDING.md](TRANSACTION_SEEDING.md) to understand the data

Happy coding! 🚀
