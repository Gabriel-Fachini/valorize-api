# Valorize API

B2B culture and engagement platform API built with Fastify, TypeScript, Prisma, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma Client
npm run db:generate

# Reset database and seed with sample data
npm run db:reset
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Open Prisma Studio (database GUI)
npm run db:studio
```

The API will be available at `http://localhost:3000` (or your configured port).

## 📦 Database Commands

### Quick Reference

```bash
# Reset database and seed (⚠️ DELETES ALL DATA - Dev only!)
npm run db:reset

# Seed database with sample data
npm run db:seed

# Create and run a new migration
npm run db:migrate

# Generate Prisma Client
npm run db:generate

# Open database GUI
npm run db:studio
```

See [docs/DATABASE_COMMANDS.md](docs/DATABASE_COMMANDS.md) for detailed documentation.

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test:coverage
```

## 🏗️ Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start

# Deploy migrations (production)
npm run db:migrate:deploy
```

### Deploy to Google Cloud Run

For detailed instructions on deploying to Google Cloud Platform using Cloud Run:
- 📖 [GCP Cloud Run Deployment Guide](docs/GCP_CLOUD_RUN_DEPLOYMENT.md) - Complete step-by-step guide
- ⚡ [Quick Reference](docs/DEPLOY_QUICK_REFERENCE.md) - Essential commands
- ✅ [Deploy Checklist](docs/DEPLOY_CHECKLIST.md) - Pre/post-deploy verification
- 🔧 [Troubleshooting](docs/TROUBLESHOOTING_CLOUD_RUN.md) - Common issues and solutions
- 🐛 [Deploy Errors & Lessons Learned](docs/DEPLOY_ERRORS_LESSONS_LEARNED.md) - Real errors faced and how they were solved

## 📚 Documentation

### API & Features
- [API Routes](docs/API_ROUTES_DOCUMENTATION.md)
- [Authentication Guide](docs/AUTHENTICATION_GUIDE.md)
- [Prize System](docs/prizes-api.md)

### Database
- [Database Commands](docs/DATABASE_COMMANDS.md)
- [Transaction Seeding](docs/TRANSACTION_SEEDING.md)
- [Prize Seeding](docs/PRIZE_SEEDING.md)

### Deployment (GCP Cloud Run)
- [📖 Deployment Guide](docs/GCP_CLOUD_RUN_DEPLOYMENT.md) - Complete step-by-step guide
- [⚡ Quick Reference](docs/DEPLOY_QUICK_REFERENCE.md) - Essential commands
- [✅ Deploy Checklist](docs/DEPLOY_CHECKLIST.md) - Pre/post-deploy verification
- [🔧 Troubleshooting](docs/TROUBLESHOOTING_CLOUD_RUN.md) - Common issues and solutions
- [🐛 Deploy Errors & Lessons Learned](docs/DEPLOY_ERRORS_LESSONS_LEARNED.md) - Real errors faced and how they were solved

## 🔧 Tech Stack

- **Runtime**: Node.js
- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Auth0
- **Testing**: Vitest

## 📁 Project Structure

```
src/
├── app.ts              # Application entry point
├── config/             # Configuration files
├── features/           # Feature-based modules
│   ├── auth/          # Authentication
│   ├── users/         # User management
│   ├── companies/     # Company management
│   ├── wallets/       # Wallet & transactions
│   ├── compliments/   # Compliment system
│   ├── prizes/        # Prize/reward system
│   └── rbac/          # Role-based access control
├── lib/                # Shared utilities
│   ├── database.ts    # Prisma client
│   ├── logger.ts      # Logging utility
│   └── seed/          # Database seeding
├── middleware/         # Request middleware
└── types/             # TypeScript type definitions
```

## 🔐 Environment Variables

Required environment variables (see `.env.example`):

```env
DATABASE_URL=postgresql://user:password@localhost:5432/valorize_dev
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=your-api-identifier
NODE_ENV=development
PORT=3000
```

## 🌱 Seeding

The seed script populates the database with sample data including:

- Companies and company settings
- Permissions and roles (RBAC)
- Sample users with various roles
- Wallets with initial balances
- Company values
- **Prizes** with variants and detailed specifications
- Sample compliments
- **Wallet transactions** with complete audit trail
- **Prize redemptions** with addresses and tracking

Run `npm run db:reset` to get a fresh database with all sample data.

See [docs/TRANSACTION_SEEDING.md](docs/TRANSACTION_SEEDING.md) for details on transaction data.  
See [docs/PRIZE_SEEDING.md](docs/PRIZE_SEEDING.md) for details on prize catalog.  
See [docs/REDEMPTION_SEEDING.md](docs/REDEMPTION_SEEDING.md) for details on redemptions.

## 📝 License

MIT

## 👤 Author

Gabriel Fachini
