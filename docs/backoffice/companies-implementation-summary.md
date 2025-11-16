# Backoffice Companies Module - Implementation Summary

**Linear Issue**: FAC-105
**Status**: ✅ Implementation Complete (Testing Pending)
**Last Updated**: November 2024

---

## Overview

Complete client management system for Valorize HQ Super Admins with cross-company access capabilities. This module enables centralized management of all client companies from a single administrative interface.

## What Was Implemented

### 1. Core Components

#### Validation Layer (FastifySchema)
**File**: `src/features/backoffice/companies/companies.schemas.ts` (640 lines)

- ✅ 15 complete FastifySchema definitions (JSON Schema format - NOT Zod)
- ✅ Comprehensive request/response validation
- ✅ Consistent error response schemas
- ✅ Full OpenAPI documentation (tags, descriptions, security)

**Key Schemas**:
- `listCompaniesSchema` - Pagination, filters, sorting
- `getCompanySchema` - Full details retrieval
- `createCompanySchema` - Complete wizard validation
- `updateCompanySchema` - Partial updates
- `simpleActionSchema` - Activate/deactivate/freeze/unfreeze
- `getWalletStatusSchema` - Wallet status with metrics
- `addWalletCreditsSchema` - Credit addition validation
- `removeWalletCreditsSchema` - Credit removal validation
- `updatePlanSchema` - Plan change validation
- `getBillingInfoSchema` - Billing data retrieval
- `getMetricsSchema` - Company analytics
- `addContactSchema` - Contact linking (existing users only)
- `updateContactSchema` - Contact updates
- `deleteContactSchema` - Contact removal
- `addAllowedDomainSchema` - SSO domain addition
- `deleteAllowedDomainSchema` - SSO domain removal

#### Route Layer (19 Endpoints)
**File**: `src/features/backoffice/companies/companies.routes.ts` (1154 lines)

**Core CRUD**:
- `GET /` - List companies (pagination, filters, sorting, aggregations)
- `GET /:id` - Get full company details
- `POST /` - Create new company (wizard)
- `PATCH /:id` - Update company information

**Lifecycle Management**:
- `POST /:id/activate` - Activate company
- `POST /:id/deactivate` - Deactivate company (blocks login + freezes wallet)

**Wallet Operations**:
- `GET /:id/wallet` - Get wallet status (balance, burn rate, coverage index)
- `POST /:id/wallet/credits` - Add wallet credits
- `DELETE /:id/wallet/credits` - Remove wallet credits
- `POST /:id/wallet/freeze` - Freeze wallet
- `POST /:id/wallet/unfreeze` - Unfreeze wallet

**Plan & Billing**:
- `PATCH /:id/plan` - Update company plan
- `GET /:id/billing` - Get billing information (MRR calculation)

**Metrics**:
- `GET /:id/metrics` - Get company metrics (users, compliments, engagement, redemptions, values)

**Contacts** (existing users only):
- `POST /:id/contacts` - Add contact (links existing user to company)
- `PATCH /:id/contacts/:contactId` - Update contact
- `DELETE /:id/contacts/:contactId` - Delete contact

**SSO Domains**:
- `POST /:id/domains` - Add allowed domain
- `DELETE /:id/domains/:domainId` - Delete allowed domain

#### Service Layer
**File**: `src/features/backoffice/companies/companies.service.ts`

Complete business logic implementation using:
- ✅ BackofficeCompany model (multi-tenancy bypass)
- ✅ Prisma transactions for data consistency
- ✅ AuditLogger integration on all mutations
- ✅ Comprehensive error handling
- ✅ MRR calculation (activeUsers × pricePerUser)
- ✅ Wallet metrics (burn rate, coverage index, projected depletion)

**18 Service Methods**:
1. `listCompanies()` - Paginated list with filters and aggregations
2. `getCompanyDetails()` - Full details with wallet, metrics, billing
3. `createCompany()` - Complete wizard (company, plan, values, wallet, settings)
4. `updateCompany()` - Partial updates with audit trail
5. `activateCompany()` - Restore access
6. `deactivateCompany()` - Block access + freeze wallet
7. `getWalletStatus()` - Balance, metrics, projections
8. `addWalletCredits()` - Add credits + create deposit record
9. `removeWalletCredits()` - Remove credits (adjustment only)
10. `freezeWallet()` - Block spending
11. `unfreezeWallet()` - Restore spending
12. `updatePlan()` - Change plan type or pricing
13. `getBillingInfo()` - Current MRR and next billing date
14. `getMetrics()` - Users, compliments, engagement, redemptions, values
15. `addContact()` - Link existing user to company
16. `updateContact()` - Update role or primary status
17. `deleteContact()` - Unlink user from company
18. `addAllowedDomain()` - Add SSO domain
19. `deleteAllowedDomain()` - Remove SSO domain

#### Type Definitions
**File**: `src/features/backoffice/companies/companies.types.ts` (275 lines)

Complete TypeScript interfaces for all operations:
- `PaginationParams`, `SortingParams`, `CompanyFilters`
- `PaginatedResult<T>` (generic wrapper)
- `CompanyListItem` (minimal list data)
- `CompanyDetails` (full data with nested relations)
- `CompanyWalletStatus` (with burn rate & coverage metrics)
- `CompanyMetrics` (users, compliments, engagement, redemptions, values)
- `BillingInfo` (MRR calculation)
- `CreateCompanyInput` (wizard input)
- `UpdateCompanyInput` (partial updates)
- `AddWalletCreditsInput`, `RemoveWalletCreditsInput`
- `UpdateCompanyPlanInput`
- `AddCompanyContactInput` (requires userId - existing users only)
- `UpdateCompanyContactInput`
- `AddAllowedDomainInput`
- `MetricsQueryParams`

### 2. Database Layer

#### Models (Created in Previous Session)
**File**: `src/features/backoffice/companies/companies.model.ts`

Static methods pattern for cross-company queries:
- `BackofficeCompany.list()` - Multi-tenant list with filters
- `BackofficeCompany.getById()` - Full details
- `BackofficeCompany.getWalletStatus()` - Wallet with metrics
- `BackofficeCompany.getMetrics()` - Company analytics
- `BackofficeCompany.getBillingInfo()` - MRR calculation

#### Schema Additions
**File**: `prisma/schema.prisma`

Three new tables:
1. `CompanyPlan` - Plan history (supports plan changes over time)
2. `AuditLog` - Complete audit trail with changelog
3. `CompanyContactHistory` - Historical tracking of contact changes

### 3. Testing Suite

#### Postman Collection
**File**: `postman/Backoffice_Companies.postman_collection.json`

Complete testing collection:
- ✅ 19 endpoint definitions
- ✅ Organized folder structure (Core CRUD, Lifecycle, Wallet, Billing, Metrics, Contacts, Domains)
- ✅ Bearer token authentication (collection-level)
- ✅ Environment variables (baseUrl, authToken, companyId, contactId, domainId)
- ✅ Example request bodies with realistic data
- ✅ Query parameter documentation
- ✅ Detailed descriptions for each endpoint

**How to Use**:
1. Import into Postman
2. Set environment variables:
   - `baseUrl`: API base URL (e.g., `http://localhost:3000`)
   - `authToken`: Super Admin JWT token (from backoffice login)
   - `companyId`: Test company ID
   - `contactId`: Test contact ID
   - `domainId`: Test domain ID
3. Run requests in order (create company → manage resources)

### 4. Audit & Security

#### Audit Logger Integration
**File**: `src/lib/audit/audit-logger.ts`

All mutations logged with:
- ✅ User ID (who performed action)
- ✅ Action type (COMPANY_CREATE, COMPANY_UPDATE, etc.)
- ✅ Entity type and ID
- ✅ Before/after changelog
- ✅ Metadata (additional context)
- ✅ Timestamp

**Logged Actions**:
- Company: Create, Update, Activate, Deactivate
- Wallet: Credit Add, Credit Remove, Freeze, Unfreeze
- Plan: Update
- Contact: Add, Update, Delete
- Domain: Add, Delete

#### Authentication & Authorization
**Middleware**: `src/middleware/backoffice.ts`

- ✅ JWT validation (Auth0)
- ✅ Super Admin role check
- ✅ Company verification ("Valorize HQ" only)
- ✅ All endpoints protected with `requireSuperAdmin()` middleware

---

## Technical Decisions

### 1. Validation Strategy
**Decision**: FastifySchema (JSON Schema) instead of Zod
**Rationale**: Project standard, better Fastify integration, OpenAPI auto-generation
**Impact**: All schemas rewritten to JSON Schema format (640 lines)

### 2. Contact Management
**Decision**: Contacts must be existing users (cannot create standalone contacts)
**Rationale**: Simplified user management, single source of truth
**Implementation**: `AddCompanyContactInput` requires `userId` field

### 3. Company Creation Workflow
**Decision**: Contacts managed separately after company creation
**Rationale**: Cleaner wizard flow, contacts require existing users
**Flow**: Create company → Create users → Add contacts

### 4. Plan History
**Decision**: Track all plan changes with CompanyPlan model
**Rationale**: Audit trail, billing accuracy, plan change analysis
**Query**: Filter `isActive: true` to get current plan

### 5. Wallet Metrics
**Decision**: Calculate burn rate and coverage index on-demand
**Rationale**: Real-time accuracy, no stale data
**Metrics**:
- Burn rate: Average daily spending × 30
- Coverage index: Balance ÷ burn rate (months of coverage)
- Projected depletion: Current date + (balance ÷ daily burn rate)

### 6. Multi-Tenancy Bypass
**Decision**: BackofficeCompany model bypasses company-scoped queries
**Rationale**: Super Admins need cross-company access
**Security**: Protected by `requireSuperAdmin()` middleware

---

## Database Schema Changes

### New Tables

#### 1. CompanyPlan
```prisma
model CompanyPlan {
  id           String   @id @default(cuid())
  companyId    String
  planType     PlanType
  pricePerUser Decimal  @db.Decimal(10, 2)
  startDate    DateTime
  endDate      DateTime?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  company      Company  @relation(fields: [companyId], references: [id])

  @@map("company_plans")
}
```

#### 2. AuditLog
```prisma
model AuditLog {
  id          String          @id @default(cuid())
  userId      String
  action      AuditAction
  entityType  AuditEntityType
  entityId    String
  changes     Json?
  metadata    Json?
  createdAt   DateTime        @default(now())

  user        User            @relation(fields: [userId], references: [id])

  @@map("audit_logs")
}
```

#### 3. CompanyContactHistory
```prisma
model CompanyContactHistory {
  id          String   @id @default(cuid())
  companyId   String
  userId      String
  action      String   // added, updated, removed
  role        String?
  isPrimary   Boolean?
  performedBy String
  createdAt   DateTime @default(now())

  company     Company  @relation(fields: [companyId], references: [id])
  user        User     @relation(fields: [userId], references: [id])

  @@map("company_contact_history")
}
```

---

## Compilation Status

### Companies Module
✅ **Zero TypeScript errors**

All files compile successfully:
- `companies.schemas.ts` - 640 lines (FastifySchema)
- `companies.routes.ts` - 1154 lines (19 endpoints)
- `companies.service.ts` - Business logic
- `companies.types.ts` - 275 lines (interfaces)
- `companies.model.ts` - Static methods

### Known Issues (Unrelated to this Module)
⚠️ **7 pre-existing errors** in backoffice auth files:
- `backoffice-auth.service.ts` (4 errors)
- `middleware/backoffice.ts` (3 errors)

**Issue**: User model doesn't include `company` relation
**Impact**: Does not affect companies module

---

## Testing Strategy

### Manual Testing (Postman)
1. Import collection from `postman/Backoffice_Companies.postman_collection.json`
2. Configure environment variables
3. Test workflow:
   - Login as Super Admin (get JWT token)
   - List companies
   - Create new company
   - Update company details
   - Manage wallet credits
   - Update plan
   - Add/update/delete contacts
   - Add/delete SSO domains
   - Get metrics and billing info
   - Activate/deactivate company

### Automated Testing (Pending - ETAPA 12)
**Priority tests** to write:
1. Company creation wizard (full flow)
2. Wallet operations (add/remove credits, freeze/unfreeze)
3. Plan updates with MRR calculation
4. Contact management (add/update/delete)
5. Audit logging verification
6. Multi-tenancy bypass security
7. Permission validation (Super Admin only)

---

## Complete API Reference

### Authentication
All endpoints require Super Admin authentication:
```http
Authorization: Bearer <JWT_TOKEN>
```

Get token from:
```http
POST /backoffice/auth/login
Content-Type: application/json

{
  "email": "admin@valorize.com.br",
  "password": "your_password"
}
```

### All Routes & Methods

#### 1. Core CRUD Operations

**1.1. List Companies**
```
GET /backoffice/companies
```
- **Service Method**: `backofficeCompanyService.listCompanies(filters, pagination, sorting)`
- **Query Params**:
  - `page` (number, default: 1)
  - `limit` (number, default: 20, max: 100)
  - `sortBy` (enum: 'name', 'createdAt', 'updatedAt', 'mrr', default: 'updatedAt')
  - `sortOrder` (enum: 'asc', 'desc', default: 'desc')
  - `search` (string, optional) - Search in name, CNPJ, domain
  - `status` (enum: 'active', 'inactive', optional)
  - `planType` (enum: 'ESSENTIAL', 'PROFESSIONAL', optional)
  - `country` (string, 2 chars, optional)
  - `createdAfter` (ISO date-time, optional)
  - `createdBefore` (ISO date-time, optional)
- **Returns**: Paginated list with aggregations (totalMRR, company counts)
- **Example**: `GET /backoffice/companies?page=1&limit=20&status=active&sortBy=mrr&sortOrder=desc`

**1.2. Get Company Details**
```
GET /backoffice/companies/:id
```
- **Service Method**: `backofficeCompanyService.getCompanyDetails(companyId)`
- **Params**: `id` (company ID)
- **Returns**: Full company details including:
  - Basic info (name, domain, country, etc.)
  - CompanyBrazil data (if Brazil)
  - Contacts list
  - Settings
  - Wallet status (balance, burn rate, coverage)
  - Current plan
  - Allowed domains
  - Metrics (users, compliments, engagement, redemptions, values)
  - Billing info (MRR)
- **Example**: `GET /backoffice/companies/clx8h3k9f0000abc123def456`

**1.3. Create Company**
```
POST /backoffice/companies
```
- **Service Method**: `backofficeCompanyService.createCompany(input, createdBy)`
- **Body**:
  ```json
  {
    "name": "Acme Corporation",
    "domain": "acme.com.br",
    "country": "BR",
    "timezone": "America/Sao_Paulo",
    "logoUrl": "https://...",
    "billingEmail": "billing@acme.com.br",
    "companyBrazil": {
      "cnpj": "12345678901234",
      "razaoSocial": "Acme Corporation LTDA",
      "cnaePrincipal": "6201-5/00",
      "naturezaJuridica": "Sociedade Limitada",
      "porteEmpresa": "Média Empresa",
      "situacaoCadastral": "Ativa"
    },
    "plan": {
      "planType": "PROFESSIONAL",
      "pricePerUser": 14.00,
      "startDate": "2024-01-01T00:00:00Z"
    },
    "initialValues": [
      {
        "title": "Colaboração",
        "description": "Trabalhar em equipe",
        "iconName": "users",
        "iconColor": "#3B82F6"
      },
      {
        "title": "Inovação",
        "description": "Buscar novas soluções",
        "iconName": "lightbulb",
        "iconColor": "#FBBF24"
      }
    ],
    "initialWalletBudget": 10000
  }
  ```
- **Returns**: `{ id, name, message }`
- **Creates**:
  - Company record
  - CompanyBrazil record (if country = 'BR')
  - CompanyPlan record
  - CompanyValue records (2-10 values)
  - CompanyWallet record
  - WalletDeposit record (if initialWalletBudget > 0)
  - CompanySettings record
- **Audit**: Logs COMPANY_CREATE action

**1.4. Update Company**
```
PATCH /backoffice/companies/:id
```
- **Service Method**: `backofficeCompanyService.updateCompany(companyId, input, updatedBy)`
- **Params**: `id` (company ID)
- **Body** (all fields optional):
  ```json
  {
    "name": "Acme Corp",
    "domain": "acmecorp.com.br",
    "logoUrl": "https://...",
    "country": "BR",
    "timezone": "America/Sao_Paulo",
    "billingEmail": "billing@acmecorp.com.br",
    "companyBrazil": {
      "cnpj": "12345678901234",
      "razaoSocial": "Acme Corp LTDA",
      "inscricaoEstadual": "123456789",
      "cnaePrincipal": "6201-5/00",
      "naturezaJuridica": "Sociedade Limitada",
      "porteEmpresa": "Grande Empresa",
      "situacaoCadastral": "Ativa"
    }
  }
  ```
- **Returns**: `{ success, message }`
- **Audit**: Logs COMPANY_UPDATE action with before/after changelog

#### 2. Lifecycle Management

**2.1. Activate Company**
```
POST /backoffice/companies/:id/activate
```
- **Service Method**: `backofficeCompanyService.activateCompany(companyId, activatedBy)`
- **Params**: `id` (company ID)
- **Action**: Sets `isActive = true`
- **Effect**: Restores user login access
- **Returns**: `{ success, message }`
- **Audit**: Logs COMPANY_ACTIVATE action

**2.2. Deactivate Company**
```
POST /backoffice/companies/:id/deactivate
```
- **Service Method**: `backofficeCompanyService.deactivateCompany(companyId, deactivatedBy)`
- **Params**: `id` (company ID)
- **Action**: Sets `isActive = false` AND freezes wallet
- **Effect**: Blocks user login + prevents wallet spending
- **Returns**: `{ success, message }`
- **Audit**: Logs COMPANY_DEACTIVATE action

#### 3. Wallet Management

**3.1. Get Wallet Status**
```
GET /backoffice/companies/:id/wallet
```
- **Service Method**: `backofficeCompanyService.getWalletStatus(companyId)`
- **Params**: `id` (company ID)
- **Returns**:
  ```json
  {
    "id": "wallet_id",
    "balance": 10000,
    "totalDeposited": 50000,
    "totalSpent": 40000,
    "overdraftLimit": 0,
    "isFrozen": false,
    "burnRate": 1500,
    "coverageIndex": 6.67,
    "totalRedemptions": {
      "vouchers": 150,
      "products": 50
    },
    "projectedDepletion": "2025-06-15T00:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-11-16T00:00:00Z"
  }
  ```

**3.2. Add Wallet Credits**
```
POST /backoffice/companies/:id/wallet/credits
```
- **Service Method**: `backofficeCompanyService.addWalletCredits(companyId, input, addedBy)`
- **Params**: `id` (company ID)
- **Body**:
  ```json
  {
    "amount": 5000,
    "reason": "Monthly top-up for Q1 2025"
  }
  ```
- **Action**:
  - Increments wallet balance
  - Increments totalDeposited
  - Creates WalletDeposit record
- **Returns**: `{ success, message, newBalance }`
- **Audit**: Logs WALLET_CREDIT action

**3.3. Remove Wallet Credits**
```
DELETE /backoffice/companies/:id/wallet/credits
```
- **Service Method**: `backofficeCompanyService.removeWalletCredits(companyId, input, removedBy)`
- **Params**: `id` (company ID)
- **Body**:
  ```json
  {
    "amount": 1000,
    "reason": "Billing adjustment - duplicate charge"
  }
  ```
- **Action**: Decrements wallet balance (adjustment only, not refund)
- **Returns**: `{ success, message, newBalance }`
- **Audit**: Logs WALLET_DEBIT action

**3.4. Freeze Wallet**
```
POST /backoffice/companies/:id/wallet/freeze
```
- **Service Method**: `backofficeCompanyService.freezeWallet(companyId, frozenBy)`
- **Params**: `id` (company ID)
- **Action**: Sets `isFrozen = true`
- **Effect**: Blocks all prize redemptions
- **Returns**: `{ success, message }`
- **Audit**: Logs WALLET_FREEZE action

**3.5. Unfreeze Wallet**
```
POST /backoffice/companies/:id/wallet/unfreeze
```
- **Service Method**: `backofficeCompanyService.unfreezeWallet(companyId, unfrozenBy)`
- **Params**: `id` (company ID)
- **Action**: Sets `isFrozen = false`
- **Effect**: Restores prize redemption capability
- **Returns**: `{ success, message }`
- **Audit**: Logs WALLET_UNFREEZE action

#### 4. Plan & Billing

**4.1. Update Plan**
```
PATCH /backoffice/companies/:id/plan
```
- **Service Method**: `backofficeCompanyService.updatePlan(companyId, input, updatedBy)`
- **Params**: `id` (company ID)
- **Body**:
  ```json
  {
    "planType": "PROFESSIONAL",
    "pricePerUser": 14.00,
    "startDate": "2025-01-01T00:00:00Z"
  }
  ```
- **Action**:
  - Sets current plan `isActive = false`
  - Creates new CompanyPlan with `isActive = true`
- **Returns**: `{ success, message }`
- **Audit**: Logs PLAN_UPDATE action with before/after values

**4.2. Get Billing Info**
```
GET /backoffice/companies/:id/billing
```
- **Service Method**: `backofficeCompanyService.getBillingInfo(companyId)`
- **Params**: `id` (company ID)
- **Returns**:
  ```json
  {
    "currentMRR": 7280.00,
    "activeUsers": 520,
    "planType": "PROFESSIONAL",
    "pricePerUser": 14.00,
    "estimatedMonthlyAmount": 7280.00,
    "nextBillingDate": "2025-01-01T00:00:00Z",
    "billingEmail": "billing@company.com"
  }
  ```
- **MRR Calculation**: `activeUsers × pricePerUser`

#### 5. Metrics & Analytics

**5.1. Get Company Metrics**
```
GET /backoffice/companies/:id/metrics
```
- **Service Method**: `backofficeCompanyService.getMetrics(companyId, params)`
- **Params**: `id` (company ID)
- **Query Params** (optional):
  - `startDate` (ISO date-time)
  - `endDate` (ISO date-time)
- **Returns**:
  ```json
  {
    "users": {
      "total": 650,
      "active": 520,
      "inactive": 130
    },
    "compliments": {
      "sent": 15420,
      "received": 15420,
      "period": {
        "startDate": "2024-11-01T00:00:00Z",
        "endDate": "2024-11-16T00:00:00Z",
        "sent": 850,
        "received": 850
      }
    },
    "engagement": {
      "WAU": 385,
      "complimentUsageRate": 74.04
    },
    "redemptions": {
      "total": 200,
      "vouchers": 150,
      "products": 50,
      "averageTicket": 125.50
    },
    "values": {
      "total": 5,
      "active": 5
    }
  }
  ```

#### 6. Contact Management

**6.1. Add Contact**
```
POST /backoffice/companies/:id/contacts
```
- **Service Method**: `backofficeCompanyService.addContact(companyId, input, addedBy)`
- **Params**: `id` (company ID)
- **Body**:
  ```json
  {
    "userId": "clx8h3k9f0000user123",
    "role": "CFO"
  }
  ```
- **Requirement**: User must already exist (cannot create standalone contacts)
- **Action**: Creates CompanyContact linking user to company
- **Returns**: `{ id, message }`
- **Audit**: Logs CONTACT_ADD action

**6.2. Update Contact**
```
PATCH /backoffice/companies/:id/contacts/:contactId
```
- **Service Method**: `backofficeCompanyService.updateContact(contactId, input, updatedBy)`
- **Params**:
  - `id` (company ID)
  - `contactId` (contact ID)
- **Body** (all fields optional):
  ```json
  {
    "role": "Chief Financial Officer",
    "isPrimary": true
  }
  ```
- **Returns**: `{ success, message }`
- **Audit**: Logs CONTACT_UPDATE action with changelog

**6.3. Delete Contact**
```
DELETE /backoffice/companies/:id/contacts/:contactId
```
- **Service Method**: `backofficeCompanyService.deleteContact(contactId, deletedBy)`
- **Params**:
  - `id` (company ID)
  - `contactId` (contact ID)
- **Action**: Removes CompanyContact record (user remains in system)
- **Returns**: `{ success, message }`
- **Audit**: Logs CONTACT_DELETE action

#### 7. SSO Domain Management

**7.1. Add Allowed Domain**
```
POST /backoffice/companies/:id/domains
```
- **Service Method**: `backofficeCompanyService.addAllowedDomain(companyId, input, addedBy)`
- **Params**: `id` (company ID)
- **Body**:
  ```json
  {
    "domain": "subsidiary.com"
  }
  ```
- **Action**: Creates AllowedDomain record
- **Effect**: Users with @subsidiary.com can login to company
- **Returns**: `{ id, message }`
- **Audit**: Logs DOMAIN_ADD action

**7.2. Delete Allowed Domain**
```
DELETE /backoffice/companies/:id/domains/:domainId
```
- **Service Method**: `backofficeCompanyService.deleteAllowedDomain(domainId, deletedBy)`
- **Params**:
  - `id` (company ID)
  - `domainId` (domain ID)
- **Action**: Removes AllowedDomain record
- **Effect**: Users with that domain can no longer login
- **Returns**: `{ success, message }`
- **Audit**: Logs DOMAIN_DELETE action

### Service Methods Summary

All service methods in `backofficeCompanyService`:

```typescript
// Query Methods (No Audit)
async listCompanies(filters, pagination, sorting): Promise<PaginatedResult<CompanyListItem>>
async getCompanyDetails(companyId: string): Promise<CompanyDetails | null>
async getWalletStatus(companyId: string): Promise<CompanyWalletStatus | null>
async getBillingInfo(companyId: string): Promise<BillingInfo | null>
async getMetrics(companyId: string, params?: MetricsQueryParams): Promise<CompanyMetrics>

// Mutation Methods (With Audit)
async createCompany(input: CreateCompanyInput, createdBy: string): Promise<{ id: string }>
async updateCompany(companyId: string, input: UpdateCompanyInput, updatedBy: string): Promise<void>
async activateCompany(companyId: string, activatedBy: string): Promise<void>
async deactivateCompany(companyId: string, deactivatedBy: string): Promise<void>
async addWalletCredits(companyId: string, input: AddWalletCreditsInput, addedBy: string): Promise<void>
async removeWalletCredits(companyId: string, input: RemoveWalletCreditsInput, removedBy: string): Promise<void>
async freezeWallet(companyId: string, frozenBy: string): Promise<void>
async unfreezeWallet(companyId: string, unfrozenBy: string): Promise<void>
async updatePlan(companyId: string, input: UpdateCompanyPlanInput, updatedBy: string): Promise<void>
async addContact(companyId: string, input: AddCompanyContactInput, addedBy: string): Promise<{ id: string }>
async updateContact(contactId: string, input: UpdateCompanyContactInput, updatedBy: string): Promise<void>
async deleteContact(contactId: string, deletedBy: string): Promise<void>
async addAllowedDomain(companyId: string, input: AddAllowedDomainInput, addedBy: string): Promise<{ id: string }>
async deleteAllowedDomain(domainId: string, deletedBy: string): Promise<void>
```

### Common Response Format

**Success (200)**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error (4xx/5xx)**:
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Human-readable error message",
  "statusCode": 400
}
```

### Example: List Companies

**Request**:
```http
GET /backoffice/companies?page=1&limit=20&sortBy=mrr&sortOrder=desc&status=active
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "name": "Toro Investimentos",
      "domain": "toroinvestimentos.com.br",
      "country": "BR",
      "logoUrl": "https://...",
      "planType": "PROFESSIONAL",
      "isActive": true,
      "totalUsers": 650,
      "activeUsers": 520,
      "currentMRR": 7280.00,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-11-16T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  },
  "aggregations": {
    "totalMRR": 7280.00,
    "activeCompanies": 1,
    "inactiveCompanies": 0
  }
}
```

### Example: Create Company

**Request**:
```http
POST /backoffice/companies
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Acme Corporation",
  "domain": "acme.com.br",
  "country": "BR",
  "timezone": "America/Sao_Paulo",
  "companyBrazil": {
    "cnpj": "12345678901234",
    "razaoSocial": "Acme Corporation LTDA",
    "cnaePrincipal": "6201-5/00",
    "naturezaJuridica": "Sociedade Limitada",
    "porteEmpresa": "Média Empresa",
    "situacaoCadastral": "Ativa"
  },
  "plan": {
    "planType": "PROFESSIONAL",
    "pricePerUser": 14.00,
    "startDate": "2024-01-01T00:00:00Z"
  },
  "initialValues": [
    {
      "title": "Colaboração",
      "description": "Trabalhar em equipe",
      "iconName": "users",
      "iconColor": "#3B82F6"
    },
    {
      "title": "Inovação",
      "description": "Buscar novas soluções",
      "iconName": "lightbulb",
      "iconColor": "#FBBF24"
    }
  ],
  "initialWalletBudget": 10000
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "xyz789",
    "name": "Acme Corporation",
    "message": "Company created successfully"
  }
}
```

---

## Business Rules Implemented

### 1. Company Creation
- ✅ Requires: name, domain, country, timezone, plan, minimum 2 values
- ✅ Brazil-specific: CNPJ validation, razão social, CNAE
- ✅ Creates: Company, CompanyBrazil (if BR), Plan, Values (2-10), Wallet, Settings
- ✅ Contacts managed separately (requires existing users)
- ✅ Transaction-wrapped for data consistency
- ✅ Audit logged

### 2. Plan Management
- ✅ Essential: R$18/user/month (50-200 employees)
- ✅ Professional: R$14/user/month (200-1000 employees)
- ✅ Custom pricing: Optional pricePerUser override
- ✅ Plan history: All changes tracked in CompanyPlan
- ✅ Current plan: Filter by isActive = true

### 3. Wallet Management
- ✅ Balance tracking (current, deposited, spent)
- ✅ Overdraft limit (configurable, default 0)
- ✅ Freeze capability (block spending)
- ✅ Burn rate calculation (avg daily × 30)
- ✅ Coverage index (months of runway)
- ✅ Projected depletion date
- ✅ Deposit records with audit trail

### 4. Contact Management
- ✅ Must be existing users (no standalone contacts)
- ✅ Link users to companies with roles
- ✅ Primary contact flag
- ✅ Historical tracking of changes
- ✅ Cannot duplicate (one user = one contact per company)

### 5. SSO Domains
- ✅ Multi-domain support (main domain + allowed domains)
- ✅ All domains can login to same company
- ✅ Domain validation
- ✅ No duplicate domains

### 6. MRR Calculation
```
MRR = activeUsers × pricePerUser
```
- Active users: isActive = true
- Price per user: From current CompanyPlan (isActive = true)

### 7. Metrics
- **Users**: Total, active, inactive counts
- **Compliments**: Sent/received totals + period breakdown
- **Engagement**: WAU, compliment usage rate
- **Redemptions**: Total, vouchers, products, average ticket
- **Values**: Total count, active count

---

## File Structure

```
src/features/backoffice/companies/
├── companies.model.ts       # BackofficeCompany static methods (cross-company queries)
├── companies.service.ts     # Business logic (18 methods)
├── companies.routes.ts      # HTTP endpoints (19 routes)
├── companies.schemas.ts     # FastifySchema validation (15 schemas)
└── companies.types.ts       # TypeScript interfaces

postman/
└── Backoffice_Companies.postman_collection.json  # Testing suite (19 requests)

docs/backoffice/
└── companies-implementation-summary.md  # This file
```

---

## Next Steps (TODO)

### ETAPA 12: Write Critical Tests (In Progress)
**Priority**:
1. Company creation wizard (full transaction flow)
2. Wallet operations (add/remove, freeze/unfreeze)
3. Plan updates with MRR recalculation
4. Contact management (existing users only)
5. Audit logging verification
6. Multi-tenancy bypass security
7. Super Admin permission validation

**Tools**: Vitest (existing setup)

### ETAPA 13: Update Backoffice Documentation (Pending)
**Tasks**:
1. Update main backoffice README
2. Add API reference documentation
3. Document deployment process
4. Create admin user guide
5. Add troubleshooting guide

---

## Key Learnings

### 1. FastifySchema vs Zod
- FastifySchema is the project standard
- Better integration with Fastify's validation pipeline
- Automatic OpenAPI generation
- JSON Schema is more verbose but explicit

### 2. Contact Management Pattern
- Separating user creation from contact linking simplifies flow
- Single source of truth for user data
- Cleaner company creation wizard

### 3. Audit Trail Importance
- Complete before/after changelog on all mutations
- Critical for compliance and debugging
- Metadata flexibility for context

### 4. Multi-Tenancy Bypass
- BackofficeCompany model provides clean abstraction
- Security enforced at middleware level
- Clear separation of concerns

### 5. Transaction Safety
- Prisma transactions critical for data consistency
- Rollback on any error prevents partial states
- Worth the complexity for reliability

---

## Performance Considerations

### 1. List Companies Query
- Uses indexes: companyId, isActive, createdAt
- Pagination prevents large result sets
- Aggregations calculated in single query
- MRR calculation uses active users only

### 2. Company Details Query
- Includes: company, wallet, metrics, billing, contacts, domains
- Multiple queries but necessary for full picture
- Could optimize with caching layer (future)

### 3. Metrics Calculation
- On-demand calculation ensures accuracy
- Complex queries (compliments, redemptions)
- Consider caching for high-frequency access

### 4. Audit Logging
- Asynchronous (doesn't block request)
- Indexed on userId, entityType, entityId
- Separate table prevents bloat

---

## Security Checklist

- ✅ JWT validation on all endpoints
- ✅ Super Admin role verification
- ✅ Company verification ("Valorize HQ" only)
- ✅ Input validation via FastifySchema
- ✅ SQL injection prevention (Prisma)
- ✅ Audit logging on all mutations
- ✅ Transaction safety for data integrity
- ✅ Multi-tenancy bypass properly secured
- ✅ No hardcoded secrets
- ✅ Error messages don't leak sensitive data

---

## Deployment Checklist

- [ ] Run database migrations (CompanyPlan, AuditLog, CompanyContactHistory)
- [ ] Seed Valorize HQ company and Super Admin user
- [ ] Verify Auth0 configuration (Super Admin role)
- [ ] Test Postman collection end-to-end
- [ ] Verify audit logging in production
- [ ] Set up monitoring for backoffice endpoints
- [ ] Configure rate limiting (backoffice routes)
- [ ] Document emergency procedures (deactivate company, freeze wallet)
- [ ] Create runbook for common admin tasks
- [ ] Train support team on admin interface

---

## Support & Troubleshooting

### Common Issues

**1. "Unauthorized - User not found"**
- Cause: JWT token invalid or user deleted
- Fix: Re-authenticate, verify user exists

**2. "Forbidden - Not a Super Admin"**
- Cause: User lacks Super Admin role or not from Valorize HQ
- Fix: Verify role assignment in Auth0, check company

**3. "Company not found"**
- Cause: Invalid company ID or multi-tenancy issue
- Fix: Verify ID, check BackofficeCompany queries

**4. "This user is already a contact"**
- Cause: Duplicate contact creation attempt
- Fix: Use update endpoint instead of create

**5. TypeScript errors in auth files**
- Cause: User model missing `company` relation
- Fix: Unrelated to companies module, use `user.companyId` instead

---

## Metrics to Monitor

### Business Metrics
- Total companies (active/inactive)
- Total MRR across all clients
- Average MRR per company
- Company churn rate
- Plan distribution (Essential vs Professional)

### Technical Metrics
- API response times (p50, p95, p99)
- Error rates by endpoint
- Audit log volume
- Database query performance
- Super Admin login frequency

### User Engagement (per company)
- Weekly Active Users (WAU)
- Compliment usage rate
- Redemption rate
- Average wallet balance
- Burn rate trends

---

## Contact

**Developer**: Gabriel Fachini
**Linear Issue**: FAC-105
**Last Updated**: November 2024
**Status**: ✅ Implementation Complete | ⏳ Testing Pending

---

**End of Implementation Summary**
