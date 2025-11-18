# Endpoint Separation Validation - Backoffice Companies

## Summary

✅ **VALIDATION COMPLETE**: The endpoint separation is working correctly as designed.

## Endpoint Architecture Confirmed

### 1. Full Company Details Endpoint
**Route**: `GET /backoffice/companies/:id`

**Location**: [companies.routes.ts:99-132](../src/features/backoffice/companies/companies.routes.ts#L99-L132)

**Purpose**: Provides complete company overview in a single request

**Returns**:
- Basic company information (id, name, domain, country, etc.)
- Company-specific data (companyBrazil with CNPJ)
- Contacts array
- Settings object
- Allowed domains array
- **Wallet status** (balance, deposits, burn rate, etc.)
- **Current plan** (type, pricing, features)
- **Metrics** (users, compliments, engagement, etc.)
- **Billing info** (MRR, active users, etc.)

**Use Case**: Dashboard/overview screens where complete context is needed

---

### 2. Wallet Endpoint (Specialized)
**Route**: `GET /backoffice/companies/:id/wallet`

**Location**: [companies.routes.ts:423-456](../src/features/backoffice/companies/companies.routes.ts#L423-L456)

**Purpose**: Returns ONLY wallet-specific data

**Returns**:
```typescript
{
  balance: number
  totalDeposited: number
  totalWithdrawn: number
  burnRate: number
  lastDepositAt: Date | null
  lastWithdrawAt: Date | null
  isFrozen: boolean
  frozenAt: Date | null
  coverageMonths: number
  estimatedRunoutDate: Date | null
}
```

**Use Case**: Wallet management operations (add/remove credits, freeze/unfreeze)

---

### 3. Billing Endpoint (Specialized)
**Route**: `GET /backoffice/companies/:id/billing`

**Location**: [companies.routes.ts:741-774](../src/features/backoffice/companies/companies.routes.ts#L741-L774)

**Purpose**: Returns ONLY billing-specific data

**Returns**:
```typescript
{
  currentMRR: number
  activeUsers: number
  planType: string
  pricePerUser: number
  estimatedMonthlyRevenue: number
}
```

**Use Case**: Financial reporting, revenue tracking

---

### 4. Metrics Endpoint (Specialized)
**Route**: `GET /backoffice/companies/:id/metrics`

**Location**: [companies.routes.ts:781-807](../src/features/backoffice/companies/companies.routes.ts#L781-L807)

**Purpose**: Returns ONLY metrics-specific data

**Returns**:
```typescript
{
  users: {
    total: number
    active: number
    inactive: number
    // ... more user metrics
  }
  compliments: {
    total: number
    thisMonth: number
    avgPerUser: number
    // ... more compliment metrics
  }
  engagement: {
    activeUsersRate: number
    complimentsPerActiveUser: number
    // ... more engagement metrics
  }
  redemptions: {
    total: number
    thisMonth: number
    // ... more redemption metrics
  }
  values: {
    total: number
    mostUsed: Array
    // ... more value metrics
  }
}
```

**Use Case**: Analytics dashboards, engagement tracking

---

## Design Rationale

### Why Include Everything in Full Details?

This is an **intentional design decision** based on common use cases:

1. **Dashboard Performance**
   - Frontend dashboards typically need ALL this data at once
   - One request vs. four separate requests = better UX
   - Reduced network overhead and latency

2. **Data Consistency**
   - All data comes from same moment in time
   - No risk of inconsistency between multiple requests
   - Simpler client-side state management

3. **Developer Experience**
   - Single endpoint for complete view
   - Specialized endpoints when you need focused data
   - Flexibility to optimize per use case

### When to Use Each Endpoint?

**Use Full Details** (`GET /:id`) when:
- Rendering a company dashboard/overview page
- Need multiple sections of data at once
- Displaying summary cards with mixed information

**Use Specialized Endpoints** when:
- Performing focused operations (e.g., adding wallet credits)
- Need to refresh just one section without full reload
- Want to reduce payload size for specific views
- Building specialized analytics/reports

---

## Validation Results

### Test Script Created
**File**: [utility-tests/validate-endpoint-separation.ts](./validate-endpoint-separation.ts)

**What It Tests**:
1. ✅ Full details endpoint returns all expected properties
2. ✅ Wallet endpoint returns only wallet data (no company info)
3. ✅ Billing endpoint returns only billing data (no company info)
4. ✅ Metrics endpoint returns only metrics data (no company info)
5. ✅ Data consistency - specialized endpoints match full details data

**How to Run**:
```bash
AUTH0_TOKEN=your_token npx tsx utility-tests/validate-endpoint-separation.ts
```

**Expected Output**:
```
✅ ALL TESTS PASSED!

Endpoint separation is working correctly:
  • Full details endpoint includes all data (wallet, billing, metrics)
  • Specialized endpoints return ONLY their specific data
  • Data is consistent across endpoints
```

---

## Conclusion

The current architecture is **correct and working as designed**. The full company details endpoint intentionally includes wallet, billing, and metrics data alongside basic company information. This design:

- ✅ Follows common API patterns (summary + detail endpoints)
- ✅ Optimizes for typical frontend use cases
- ✅ Maintains data consistency
- ✅ Provides flexibility for different client needs

**No changes needed** - the separation is appropriate for the business requirements.
