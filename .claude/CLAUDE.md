# Valorize API - Claude AI Instructions

## Project Overview

**Valorize** is a B2B SaaS platform focused on corporate culture and employee engagement through structured recognition based on company values. We offer a practical solution that connects peer-to-peer recognition to company values, creating a strong and measurable organizational culture.

**Status**: MVP in active development | Preparing for pilot client validation
**Developer**: Gabriel Fachini (Solo developer)
**Client Pilot**: Toro Investimentos (650 employees, investment brokerage/fintech)

## Core Business Model

### The Problem We Solve
- Low employee engagement and disconnection from company values
- Lack of structured recognition systems
- Fragmented organizational culture
- Ineffective or complex reward systems
- HR lacks concrete data on culture and engagement

### Our Solution
1. **Value-Based Recognition**: Every compliment is tied to a company value
2. **Dual Wallet System**: Separate balances for giving compliments (renewable) and redeeming prizes (cumulative)
3. **Scalable Rewards**: Hybrid catalog of vouchers and product prizes (Tremendous API for vouchers - FREE)
4. **Analytics Dashboard**: Executive metrics showing culture in practice
5. **Economy Dashboard**: Budget tracking, burn rate prediction, coverage index

### Pricing Model
- **Essential Plan**: R$14/user/month (50-200 employees)
- **Professional Plan**: R$18/user/month (200-1000 employees) ⭐ FOCUS
- No commission on vouchers (Tremendous is free)

## Technical Stack

### Core Technologies
- **Backend**: Fastify v5.5.0 (TypeScript-first, high performance)
- **Database**: PostgreSQL (Supabase) + Prisma v6.15.0
- **Authentication**: Supabase Auth + JWT (HS256, SSO ready)
- **Language**: TypeScript v5.9.2 (strict mode)
- **File Storage**: Supabase Storage (multipart upload)

### Deployment
- **Frontend**: Vercel
- **API**: Google Cloud (needs specific service info)
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Bucket

### Development Environment
- **Local**: macOS, local API, local PostgreSQL
- **Hot Reload**: tsx watch
- **Testing**: Vitest (focus on critical features only)

## Architecture

### Feature-First Structure
```
src/
├── features/           # Domain-organized features
│   ├── auth/          # Authentication (Supabase Auth + JWT)
│   ├── users/         # User management
│   ├── companies/     # Company system (multi-country ready)
│   ├── rbac/          # Role-Based Access Control
│   ├── compliments/   # Compliment/praise system (CORE)
│   ├── wallets/       # Dual wallet system
│   ├── prizes/        # Prize store + Tremendous integration
│   └── company-settings/ # Company values & settings
├── lib/               # Shared utilities
├── middleware/        # Fastify middlewares
├── types/            # Shared TypeScript types
└── config/           # App configuration
```

### Standard Feature Pattern
Each feature follows this structure:
```
feature/
├── feature.model.ts     # Entity + Repository (static methods)
├── feature.service.ts   # Business logic (object literal)
├── feature.routes.ts    # HTTP endpoints (Fastify plugin)
├── feature.schemas.ts  
└── feature.types.ts     # TypeScript types (optional)
```

## Key Business Rules

### Dual Wallet System
**Compliment Balance** (Renewable):
- 100 coins renewed weekly
- Used ONLY to send compliments
- Does NOT convert to real money
- Expires if not used

**Redeemable Balance** (Cumulative):
- Received when others compliment you
- Used to redeem prizes
- CONVERTS to real rewards
- Expires in 18 months (encourages usage)

### Compliments System
- Must be linked to a company value (mandatory)
- Multiples of 5 coins, max 100 per compliment
- Published in transparent feed
- Integration with company values (min 2 active values required)

### Prize System
**Hybrid Catalog**:
1. **Vouchers** (API-Driven via Tremendous):
   - Digital gift cards from partners
   - Provider: Tremendous API (FREE - no commission)
   - Examples: iFood, Uber, Amazon, Spotify, Netflix
   - Status: Integrated and operational

2. **Product Prizes**:
   - Physical items with shipping addresses
   - Can be global or company-specific
   - Managed by inventory system

### Wallet Budget Control
- Companies define internal budget (no longer custody model with fintech)
- Block redemptions when: Balance < prize cost (no overdraft allowed)
- Conversion index: R$ 0.06/coin (FIXED)

### Redemption Flow (Critical)
- User selects prize → System validates redeemable balance
- Calls Tremendous API to issue voucher
- Debits coins automatically
- ⚠️ **IMPORTANT**: Asynchronous queue system was DISCONTINUED after evaluating Tremendous API
- 3-day cancellation window with full refund (coins + stock)

## Integrations

### Tremendous API
- **Status**: Integrated and operational
- **Provider**: Tremendous (chosen as single provider for MVP)
- **Cost**: FREE (no commission/markup)
- **Note**: No sandbox testing done yet, no account created yet

### Supabase Auth

- JWT-based authentication (HS256 algorithm)
- Admin API for user management (createUser, updatePassword, etc.)
- Password reset magic links via email
- User metadata support (name, avatar, etc.)
- Multi-domain support per company (AllowedDomain model)
- SSO-ready infrastructure

### Supabase Infrastructure

- PostgreSQL database
- File storage bucket (multipart upload for prize images)
- Auth service for authentication and user management

## Development Workflow

### Git & Branching
- **Pattern**: `{LINEAR_ISSUE_CODE}-{branch-name}` (e.g., `FAC-101-tremendous-integration`)
- **Linear prefix**: FAC-XXX
- Use PRs even as solo developer
- Commit messages in English (conventional commits appreciated but not required)

### Code Style
- **No semicolons** at line ends
- **TypeScript strict mode** (100% type-safe, never use `any`)
- **English** for code, comments, and commits
- **Simple code** preferred over clever solutions
- **Clean Architecture concepts** but feature-first implementation

### Database Patterns
```prisma
model EntityName {
  id        String   @id @default(cuid())
  // specific fields
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("table_name")
}
```

### RBAC Permission Pattern
- Format: `feature:objective`
- Examples: `users:read`, `users:manage_roles`, `companies:create`, `admin:access_panel`

### Error Handling Pattern
```typescript
try {
  const result = await operation()
  logger.info('Operation successful', { context })
  return result
} catch (error) {
  logger.error('Operation failed', { error, context })
  throw new CustomError('User friendly message', error)
}
```

## Current Priority

### 🎯 FOCUS: Voucher and Prize Redemption Critical Flow
The current #1 priority is developing the main and critical flow for voucher and prize redemptions with Tremendous integration.

### Features Complete ✅

- Base infrastructure (Fastify + Prisma + Supabase Auth)
- User management
- Company system (Brazil-specific data with CNPJ validation)
- RBAC system with granular permissions
- Compliments system (CORE FEATURE)
- Dual wallet system with full audit
- Prize store MVP with redemption tracking
- Tremendous API integration (operational)
- Supabase Auth migration (completed)

### Features Planned 📋
- Notification system (Resend - not configured yet)
- Economy Dashboard (4 essential metrics)
- Gamification system (3 basic badges)
- Coin expiration system (18 months - decision pending on cron vs manual)
- Analytics Dashboard for HR

### Blocked/Pending Decisions
- Tremendous sandbox testing (no account created yet)
- MSA/DPA legal contracts (starting contact with Toro now)
- Accountant validation for budget/custody model
- Coin expiration automation (cron job decision)
- Notification system setup (Resend)

## AI Assistant Preferences

### When Helping Me Code
- ✅ **Show the plan first** before implementing
- ✅ **Edit existing files** when possible (avoid creating new files unnecessarily)
- ✅ **Focus on implementation only** (no tests for now)
- ✅ **Do NOT create commits** (I handle git workflow)
- ✅ Use English for commit messages

### Communication Style
- Be **concise and direct**
- Prioritize **practical solutions** over perfect architecture
- **Identify potential issues** if you spot them, but stay focused on the task
- When showing code, use **clear comments** to explain critical parts

### Context Awareness
- Remember this is **MVP stage** - prioritize working features over perfect code
- I'm a **solo developer** balancing college + work - optimize for velocity
- **No production deadline** - focus on quality over speed
- Client pilot (Toro) is **high-profile fintech** - security and reliability matter

## Important Files to Reference

### Documentation
- `/docs/Product Overview 5.2.md` - Complete business rules and strategic vision
- `/memory-bank/context.md` - Consolidated project context
- `/memory-bank/techContext.md` - Technical stack details
- `/memory-bank/productContext.md` - Business context and UX
- `/memory-bank/systemPatterns.md` - Architecture patterns
- `/memory-bank/projectbrief.md` - Project vision

### Database
- `/prisma/schema.prisma` - Database schema (source of truth)
- Seed script available and robust

## Multi-Tenancy & Security

### Critical Constraints
- Every entity must have `companyId` for proper multi-tenant isolation
- RBAC validation on all protected routes
- JWT token validation via Auth0
- Rate limiting enabled
- SQL injection protection via Prisma

### SSO Multi-Domain Pattern
```typescript
// Companies can have multiple allowed email domains
// Main domain: @company.com.br
// Allowed domains: @company.com, @subsidiary.com.br
// All emails can login to the same company
```

## Success Metrics

### Product (North Star)
- **North Star Metric**: Active Compliments per Week
- Weekly Active Users (WAU)
- Compliment usage rate (>70%)
- Redemption rate (25-40%)

### Business
- MRR (Monthly Recurring Revenue)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV) - Target: LTV/CAC > 3x
- Gross Profit Margin

## Development Commands

```bash
# Development
npm run dev              # Hot reload with tsx watch
npm run build            # TypeScript build
npm start                # Run production build

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Create migration
npm run db:studio        # Visual DB interface
npm run db:seed          # Run seed script

# Code Quality
npm run lint             # ESLint
npm test                 # Vitest tests
```

## Recent Major Changes

### Auth0 → Supabase Auth Migration (November 2025)

**Status**: ✅ Completed

Successfully migrated from Auth0 to Supabase Auth. Key changes:

**Authentication**:
- Replaced Auth0 OAuth with Supabase Auth JWT (HS256)
- Updated JWT verification from RS256 (JWKS) to HS256 (secret-based)
- Migrated user management to Supabase Admin API

**Database**:
- Renamed `auth0Id` → `authUserId` across all tables and code
- Updated Prisma schema with `@map("auth_user_id")` for backward compatibility
- Maintained existing user records (authUserId now stores Supabase Auth user ID)

**Code Changes**:
- Updated all services, models, and routes to use `authUserId`
- Removed `jwks-rsa` dependency
- Updated middleware to verify Supabase JWT tokens
- Added helper methods: `createAdminUser`, `generateTemporaryPassword`, `resetUserPassword`

**Benefits**:
- Unified stack: All services now on Supabase (Auth + Database + Storage)
- Simplified infrastructure: No external Auth0 dependency
- Cost reduction: Supabase Auth included in existing plan
- Better integration: Native connection between auth and database

**Migration Notes**:
- All existing users can continue using their accounts seamlessly
- Password reset flow now uses Supabase magic links
- Admin user creation integrated with Supabase Admin API
- SSO support ready for future implementation

## Remember

1. **Feature-First**: Keep related files together in feature folders
2. **Simplicity Over Cleverness**: Straightforward solutions win
3. **TypeScript Strict**: Never use `any`, always proper types
4. **Consistent Patterns**: Follow existing model/service/route pattern
5. **MVP Mindset**: Ship working features, iterate based on feedback
6. **Solo Dev Optimized**: Architecture serves velocity, not vice versa

---

**Last Updated**: November 2025
**Version**: MVP - Supabase Auth Migration Complete
**Status**: 🟢 Active Development | Preparing for Toro Investimentos Pilot
