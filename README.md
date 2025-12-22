# Valorize API

B2B SaaS platform for corporate culture and employee engagement through structured peer-to-peer recognition and rewards.

**Status**: Production-ready MVP

---

## 📋 Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Development](#development)
- [License](#license)

---

## ✨ Features

- **Peer-to-Peer Recognition**: Enable employees to recognize and compliment each other aligned with company values
- **Value-Based Recognition**: Tie compliments to specific company values with analytics
- **Reward System**: Manage voucher-based rewards and prize redemptions
- **Multi-Tenant Architecture**: Support multiple companies with isolated data
- **Role-Based Access Control (RBAC)**: Fine-grained permissions for admin, managers, and employees
- **Wallet Management**: Track employee credits, balances, and transaction history
- **Audit Logging**: Complete audit trail for compliance and transparency
- **RESTful API**: Comprehensive API for integration and custom implementations

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 12.0
- **npm** or **pnpm** package manager
- **(Optional)** Docker for PostgreSQL container

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Gabriel-Fachini/valorize-api.git
   cd valorize-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration (database URL, Auth0 credentials, etc.)

4. **Initialize database**
   ```bash
   npm run db:generate      # Generate Prisma Client
   npm run db:migrate       # Run migrations
   npm run db:seed          # Seed with sample data (optional)
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:4000` (default port)

### Verify Installation

- **Health check**: `curl http://localhost:4000/health`
- **Prisma Studio**: `npm run db:studio` (open database GUI)

---

## 📚 Documentation

### API & Integration
- **[API Routes Documentation](docs/API_ROUTES_DOCUMENTATION.md)** - Complete endpoint reference
- **[Authentication Guide](docs/AUTHENTICATION_GUIDE.md)** - Auth0 setup and JWT verification
- **[User Permissions Guide](docs/USER_PERMISSIONS_GUIDE.md)** - RBAC system and permission management

### Setup & Deployment
- **[CI/CD Setup Guide](docs/ci-cd-setup.md)** - GitHub Actions, SonarCloud, and automated testing
- **[.env Configuration](/.env.example)** - All required environment variables

### Database
- **[Database Schema](prisma/schema.prisma)** - Data model and relationships
- **[Seed Data](src/lib/seed/)** - Sample data for development

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage report
npm test:coverage

# Run tests in watch mode
npm test:watch
```

---

## 🏗️ Build & Production

```bash
# Build for production
npm run build

# Start production server
npm start

# Run database migrations in production
npm run db:migrate:deploy
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js 18+ |
| **Framework** | Fastify |
| **Language** | TypeScript |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Authentication** | Supabase Auth |
| **Testing** | Vitest |
| **Code Quality** | ESLint, SonarCloud |
| **Deployment** | Google Cloud Run |

---

## 📁 Project Structure

```
src/
├── app.ts                    # Application entry point
├── config/                   # Global configuration
├── features/                 # Feature-based modules (organized by domain)
│   ├── auth/                # Authentication routes & logic
│   ├── admin/               # Admin & backoffice features
│   ├── app/                 # Core app features (users, companies, etc.)
│   ├── users/               # User management
│   ├── companies/           # Company management
│   ├── wallets/             # Wallet & transactions
│   ├── compliments/         # Peer recognition system
│   ├── prizes/              # Prize & reward management
│   └── rbac/                # Role-based access control
├── lib/                      # Shared utilities
│   ├── database.ts          # Prisma client instance
│   ├── logger.ts            # Structured logging
│   ├── seed/                # Database seeding scripts
│   └── voucher-providers/   # Integration with voucher services
├── middleware/               # Request preprocessing (auth, validation, etc.)
└── types/                    # TypeScript type definitions & interfaces

prisma/
├── schema.prisma            # Data model definition
└── migrations/              # Database migration history

docs/
├── API_ROUTES_DOCUMENTATION.md
├── AUTHENTICATION_GUIDE.md
├── USER_PERMISSIONS_GUIDE.md
└── ci-cd-setup.md
```

---

## 🔐 Environment Setup

All required environment variables are documented in [`.env.example`](.env.example):

**Core Variables**:
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Environment (development, test, production)
- `PORT` - Server port (default: 4000)

**Authentication**:
- `AUTH0_DOMAIN` - Auth0 tenant domain
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` - Supabase Auth configuration

**Third-party Services**:
- `TREMENDOUS_API_KEY` - Voucher redemption service
- `GITHUB_API_KEY` - GitHub integration

See [`.env.example`](.env.example) for complete reference with descriptions.

---

## 📝 Database

### Quick Commands

```bash
# Reset database and reseed (⚠️ DELETES ALL DATA - Development only!)
npm run db:reset

# Create a new migration after schema changes
npm run db:migrate

# Apply pending migrations
npm run db:migrate:deploy

# Open Prisma Studio (database GUI)
npm run db:studio

# Format Prisma schema
npm run db:format
```

### Seed Data

Development database comes with:
- Pre-configured companies and company settings
- Role definitions and permissions (RBAC)
- Sample users with different roles
- Wallet balances and transaction history
- Company values and recognition categories
- Prize definitions with variants
- Example compliments and redemptions

---

## 🚀 Deployment

### Google Cloud Run

To deploy to Google Cloud Run:

1. Configure GCP credentials (see [CI/CD Setup Guide](docs/ci-cd-setup.md))
2. Push to `main` branch (automated deployment via GitHub Actions)
3. Monitor deployment in Cloud Run console

**Manual deployment**:
```bash
./scripts/deploy-gcp.sh [version]
```
---

## 📄 License

This project is licensed under the **Source Available License**.

**Permissions:**
- ✓ View and evaluate the code
- ✓ Use for portfolio and learning purposes

**Restrictions:**
- ✗ Use in your own projects
- ✗ Copy, modify, or distribute
- ✗ Commercial or non-commercial use
- ✗ Create derivative works
- ✗ Redistribute or relicense

See the [LICENSE](LICENSE) file for complete details.

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Gabriel-Fachini/valorize-api/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Gabriel-Fachini/valorize-api/discussions)
- **Documentation**: Check the [docs/](docs/) folder
