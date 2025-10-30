# Valorize API - Complete Project Context for LLM

## 📋 Executive Summary

**Valorize** is a B2B SaaS platform focused on corporate culture, engagement, education, and social initiatives. It provides practical tools for employee recognition, rewards, and professional development within companies.

**Current Status**: Active development | MVP features complete | Ready for user testing  
**Developer**: Gabriel Fachini (Solo developer)  
**Architecture**: Feature-First, optimized for rapid iteration  
**Stack**: TypeScript + Fastify + PostgreSQL + Prisma + Auth0

---

## 🎯 Business Context

### The Problem
- **Low Engagement**: Employees disconnected from company activities and values
- **Lack of Recognition**: No structured systems to value contributions
- **Fragmented Culture**: Difficulty building and maintaining consistent company values
- **Ineffective Rewards**: Distant, rare, or irrelevant prizes for employees

### The Solution
Valorize provides:
1. **Relevant Engagement**: Tools connecting daily actions to company values
2. **Strengthened Culture**: Peer-to-peer recognition based on real company values
3. **Tangible & Frequent Rewards**: Real prizes employees actually want
4. **Professional Development**: Library focused on continuous learning

### Target Audience
- **B2B Companies** seeking to improve culture and engagement
- **HR & Leadership** needing practical people management tools
- **Employees** wanting recognition and continuous development

---

## 🏗️ Technical Architecture

### Stack
- **Backend**: Fastify v5.5.0 (TypeScript-first, high performance)
- **Database**: PostgreSQL + Prisma v6.15.0 (type-safe ORM)
- **Authentication**: Auth0 + JWT (stateless, secure)
- **Language**: TypeScript v5.9.2 (strict mode, 100% type-safe)
- **Testing**: Vitest v3.2.4 (15% coverage, growing)
- **Documentation**: Swagger/OpenAPI (auto-generated)

### Feature-First Architecture
```
src/
├── features/           # Domain-organized features
│   ├── auth/          # Authentication
│   ├── users/         # User management
│   ├── companies/     # Company system with Brazil-specific data
│   ├── rbac/          # Role-Based Access Control
│   ├── compliments/   # Compliment/praise system
│   ├── wallets/       # Virtual coins wallet
│   ├── prizes/        # Prize store
│   └── company-settings/ # Company values & settings
├── lib/               # Shared utilities
├── middleware/        # Fastify middlewares
├── types/            # Shared TypeScript types
└── config/           # App configuration
```

### Standard Feature Pattern
Each feature follows consistent structure:
```
feature/
├── feature.model.ts     # Entity + Repository (static methods)
├── feature.service.ts   # Business logic (object literal)
├── feature.routes.ts    # HTTP endpoints (Fastify plugin)
├── feature.schemas.ts   # Zod validations
└── feature.types.ts     # TypeScript types (optional)
```

### Why Feature-First?
**Migration from Clean Architecture**:
- 83% reduction in file count
- 5x faster navigation
- Optimized for solo development
- Pragmatic: architecture serves the product

---

## ✅ Implemented Features (9 Complete)

### 1. Base Infrastructure (100%)
- Fastify configured with essential plugins
- PostgreSQL + Prisma with migrations
- Structured logging system
- Consistent error handling
- Swagger UI documentation
- Security: CORS, Helmet, Rate Limiting

### 2. Authentication (100%)
- Auth0 integration (login/logout)
- JWT validation middleware
- Token management (refresh, expiration)
- JWKS signature verification

### 3. User Management (100%)
- User model with validations
- Complete CRUD service
- REST endpoints
- Profile management
- Auth0 synchronization

### 4. Company System (100%)
- Generic Company entity (multi-country ready)
- CompanyBrazil with specific data (CNPJ validation)
- CompanyContact for business contacts
- 10 REST endpoints with Zod validation
- Integration with User and Role via companyId

### 5. RBAC System (100%)
- Role & Permission models
- Granular permission checking
- `requirePermission` middleware for route protection
- Permission pattern: `feature:objective` (e.g., `users:read`)
- Admin endpoints for role management
- Unit tests implemented

### 6. Compliments System (100%) ✅ CORE FEATURE
**How it works**:
- User selects a company value
- Adds coins to recognize (multiples of 5, max 100)
- Sends recognition message to colleague
- System registers and notifies

**Features**:
- Compliment model with business validations
- Company values (CompanyValue & CompanySettings)
- Feed, sent, and received history
- RBAC integration

### 7. Dual Wallet System (100%)
**Two balance types**:
- **ComplimentBalance**: 100 coins renewed weekly (exclusive for sending compliments)
- **RedeemableBalance**: Cumulative from received compliments (for prizes)

**Features**:
- Complete audit system (WalletTransaction)
- Transaction history with metadata
- Admin manual reset (no cron jobs)
- Balance tracking endpoints

### 8. Wallet Audit System (100%)
- WalletTransaction model for complete tracking
- Transaction types: DEBIT, CREDIT, RESET
- Detailed metadata for each transaction
- Personal and admin history endpoints
- Documentary proof system

### 9. Prize Store MVP (100%) ✅ NEW
**Features**:
- Prize & PrizeVariant models (stock management)
- Redemption & RedemptionTracking (history)
- Race condition protection (atomic PostgreSQL transactions)
- 8 REST endpoints (catalog, admin, redemptions)
- Smart cancellation: 3 days + automatic refund (stock + coins)
- Wallet integration: automatic redeemableBalance debit
- Global or company-specific prizes
- Dynamic categories (SQL DISTINCT)

**Complete Gamification Cycle**: ✅
```
Compliments → Coins → Prizes
(all audited and traceable)
```

---

## 📊 Current Metrics

### Code
- **Files**: ~55 main files
- **Lines of Code**: ~5,500 lines
- **Endpoints**: 40+ documented REST endpoints
- **Test Coverage**: 15% (RBAC tests implemented)

### Performance
- **Build Time**: <5 seconds
- **Hot Reload**: <1 second
- **API Response**: <100ms average
- **Database Queries**: Optimized with Prisma

---

## 🎨 Development Patterns

### Code Style
- **No semicolons** at line ends
- **Clean Architecture concepts** (but feature-first implementation)
- **Simple code** preferred
- **English** code and comments
- **TypeScript strict mode** (100% type-safe)

### Naming Conventions
```typescript
// Files
feature.model.ts      // PascalCase for classes
feature.service.ts    // camelCase for services
feature.routes.ts     // default export for routes

// Exports
export class Feature { }           // PascalCase
export const featureService = { } // camelCase
export default featureRoutes       // default
```

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

### Database Schema Pattern
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
Format: `feature:objective`
Examples:
- `users:read` - Read users
- `users:manage_roles` - Manage user roles
- `companies:create` - Create companies
- `admin:access_panel` - Access admin panel

---

## 🗺️ Key Database Models

### Core Entities
```prisma
Company (generic) → CompanyBrazil (country-specific)
User → Role → Permission (RBAC)
User → Wallet (ComplimentBalance + RedeemableBalance)
Compliment → CompanyValue
WalletTransaction (audit trail)
Prize → PrizeVariant → Redemption → RedemptionTracking
```

### Business Rules
- **Compliments**: Multiples of 5 coins, max 100 per compliment
- **Company Values**: Min 2 active values required
- **Weekly Reset**: Manual admin trigger (no cron jobs)
- **Redemption Cancellation**: 3 days window with full refund
- **Race Conditions**: Protected with PostgreSQL atomic transactions

---

## 📋 API Endpoint Summary (40+)

### Authentication & Users
- `POST /auth/login` - Auth0 login
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update profile

### Companies
- `GET /companies/get-all-companies` - List companies
- `POST /companies/create-company` - Create company
- `POST /companies/validate-cnpj` - Validate Brazilian CNPJ

### RBAC
- `POST /admin/create-role` - Create role with permissions
- `PUT /admin/users/:id/assign-role` - Assign role to user
- `GET /admin/me/permissions` - Get current user permissions

### Compliments
- `POST /compliments/send` - Send compliment
- `GET /compliments/feed` - Company feed
- `GET /compliments/received` - Received history
- `GET /compliments/sent` - Sent history

### Wallets
- `GET /wallets/balance` - Current balance
- `GET /wallets/transactions` - Personal history
- `GET /wallets/admin/transactions/:userId` - Admin history
- `POST /wallets/reset-weekly-balance` - Admin reset

### Prizes
- `GET /prizes/catalog` - Browse prizes
- `POST /prizes/redeem/:id` - Redeem prize
- `POST /prizes/cancel/:redemptionId` - Cancel redemption
- `GET /prizes/my-redemptions` - User redemption history
- `POST /admin/prizes` - Create prize (admin)
- `PUT /admin/prizes/:id` - Update prize (admin)

### Company Settings
- `GET /companies/:id/settings` - Get settings
- `PUT /companies/:id/settings` - Update settings
- `GET /companies/:id/values` - List company values
- `POST /companies/:id/values` - Create value

---

## 🚀 Development Context

### Team & Workflow
- **Solo Developer**: Gabriel Fachini
- **Time**: Part-time (college + work)
- **Strategy**: MVP-first, rapid iteration
- **Branches**: Feature branches per functionality
- **Commits**: Small, frequent commits
- **Testing**: Critical features only (growing coverage)

### Development Environment
```bash
# Start development
npm run dev

# Database management
npm run db:migrate
npm run db:studio
npm run db:generate

# Code quality
npm run lint
npm test

# Build for production
npm run build
npm start
```

### Environment Variables
```env
DATABASE_URL=postgresql://...
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=your-api-identifier
PORT=3000
NODE_ENV=development
JWT_SECRET=your-jwt-secret
```

---

## 📈 Roadmap

### ✅ Completed
1. Infrastructure & Auth
2. User Management
3. Company System (Brazil-ready)
4. RBAC with granular permissions
5. Compliments System (core feature)
6. Dual Wallet System with audit
7. Prize Store MVP

### 📋 Planned
1. **Library System** (next priority)
   - Book catalog with covers and 3D models
   - Company-only reviews and comments
   - Reading clubs
   - Personalized recommendations

2. **Analytics Dashboard**
   - Engagement metrics
   - Compliment distribution by values
   - Active users tracking

3. **Gamification**
   - Badges and achievements
   - Leaderboards
   - Challenges

4. **Production Readiness**
   - Expand test coverage (>80%)
   - Setup monitoring (APM)
   - CI/CD pipeline
   - Deploy infrastructure

---

## 💡 Important Context for AI Assistants

### When Contributing to This Project

1. **Follow Feature-First**: Keep related files together in feature folders
2. **No Semicolons**: Code style rule, always omit semicolons
3. **Simple & Clean**: Prefer straightforward solutions over clever ones
4. **Type Safety**: Never use `any`, always proper TypeScript types
5. **Consistent Patterns**: Follow existing model/service/route pattern
6. **English Only**: All code, comments, and commit messages in English
7. **Clean Architecture Concepts**: Think in terms of entities, services, routes (but not over-engineered)

### Testing Priority
- Unit tests for business logic (services)
- Integration tests for API endpoints
- Focus on critical features (auth, RBAC, payments)

### Performance Targets
- API response: <200ms for 95% requests
- Database queries: Optimized with Prisma select/include
- Concurrent users: 1000+ simultaneous

### Security Focus
- JWT tokens with expiration
- RBAC granular permissions
- Input sanitization (Zod schemas)
- Rate limiting enabled
- SQL injection protection (Prisma)

---

## 🎯 Success Metrics

### Business Goals
- Companies implement effective recognition culture
- Employees feel more engaged and valued
- Improved satisfaction and retention metrics
- Financially scalable and sustainable

### Technical Goals
- <100ms API response time
- >95% uptime
- Zero critical security vulnerabilities
- >80% test coverage for critical paths

---

## 📚 Documentation

### Available Docs
- `API_ROUTES_DOCUMENTATION.md` - Complete API reference
- `AUTHENTICATION_GUIDE.md` - Auth0 setup guide
- `prizes-api.md` - Prize system documentation
- `prizes-quick-reference.md` - Prize API quick reference
- `DATABASE_DETAILED_REPORT.md` - Database schema details
- Swagger UI at `/documentation` when running

### Memory Bank Files
- `activeContext.md` - Current development focus
- `productContext.md` - Business context and UX
- `progress.md` - Development progress tracking
- `projectbrief.md` - Project vision and goals
- `systemPatterns.md` - Architecture patterns
- `techContext.md` - Technical stack details
- `context.md` - This consolidated file

---

## 🔧 Quick Start for New AI Sessions

When starting a new conversation about this project:

1. **I'm working on**: Valorize API - B2B employee engagement platform
2. **Current phase**: MVP complete, ready for user testing
3. **My role**: Solo full-stack developer (TypeScript/Node.js)
4. **Architecture**: Feature-first, Fastify + Prisma + PostgreSQL
5. **Core feature**: Compliment system with dual wallet and prize store
6. **Next priority**: Library system or production readiness
7. **Code style**: No semicolons, clean & simple, TypeScript strict

**Ask me**:
- What feature are you working on?
- Do you need help with backend, database, or architecture?
- Should we follow existing patterns or create new ones?

---

## 🏗️ Architecture Decisions

### Why Fastify?
1. **Performance**: 2-3x faster than Express
2. **TypeScript**: Native support, not afterthought
3. **Schema Validation**: Built-in, no extra libs needed
4. **Plugins**: Modular and testable architecture

### Why Prisma?
1. **Type Safety**: Generated types, fewer bugs
2. **Developer Experience**: Perfect autocomplete
3. **Migrations**: Schema version control
4. **Query Optimization**: Automatic efficient queries

### Why Feature-First?
1. **Solo Development**: Optimized for one developer
2. **Velocity**: Less navigation, more productivity
3. **Simplicity**: Fewer abstractions, more focus on product
4. **Pragmatism**: Architecture serves business

---

## 🔄 Development Evolution

### Recent Achievements
1. **RBAC System**: Complete role-based access control
   - Middleware requirePermission
   - Pattern feature:objective for permissions
   - 3 admin endpoints
   - Unit tests implemented
   - Custom error handling

2. **Companies System**: Complete company management
   - Brazilian CNPJ validation
   - Country-specific data
   - Business contact system
   - 10 REST endpoints with Zod validation

3. **Compliments System**: Core gamification feature
   - Company values integration
   - Dual wallet system
   - Complete audit trail
   - Business rule validations

4. **Prize Store MVP**: Complete reward system
   - Stock management with race condition protection
   - Smart cancellation with refunds
   - 8 REST endpoints
   - Integration with wallet system

### Next Steps
- Library system implementation
- Analytics dashboard
- Production deployment preparation
- Test coverage expansion

---

**Last Updated**: October 6, 2025  
**Version**: MVP Complete - Prize Store Implementation  
**Status**: 🟢 Active Development | Ready for User Testing
