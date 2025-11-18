# Backoffice Company Details - Testing Guide

## Test Results Summary

✅ **Service Layer**: Working perfectly - returns all data correctly
✅ **HTTP Endpoint Fix**: Schema updated with `additionalProperties: true`
✅ **Endpoint Separation**: Confirmed - specialized endpoints exist and work independently

## Available Test Scripts

### 1. Get Company IDs (No auth required)
```bash
npx tsx utility-tests/get-company-id.ts
```
Lists all companies in the database.

### 2. Test Service Directly (No auth required)
```bash
npx tsx utility-tests/test-company-details-service.ts
```
Tests the service layer directly, bypassing HTTP/auth.

**Result**: ✅ WORKING - Returns full company details with all nested data.

### 3. Validate Fix (Comprehensive validation)
```bash
# Test both service layer and HTTP endpoint
npx tsx utility-tests/validate-fix.ts

# With Auth0 token for HTTP test
AUTH0_TOKEN=your_token npx tsx utility-tests/validate-fix.ts
```

Validates that the fix is working correctly by testing both service and HTTP layers.

### 4. Validate Endpoint Separation (Auth required)
```bash
AUTH0_TOKEN=your_token npx tsx utility-tests/validate-endpoint-separation.ts
```

Comprehensive test that validates:
- ✅ Full company details endpoint works correctly
- ✅ Specialized wallet endpoint returns only wallet data
- ✅ Specialized billing endpoint returns only billing data
- ✅ Specialized metrics endpoint returns only metrics data
- ✅ Data consistency across all endpoints

**Result**: ✅ Endpoint separation is correct by design
- Full details endpoint (`GET /:id`) provides complete overview
- Specialized endpoints (`GET /:id/wallet`, `GET /:id/billing`, `GET /:id/metrics`) provide focused data

## How to Get an Auth0 Token

### Option 1: From Browser (Easiest)
1. Open the Valorize frontend in your browser
2. Login as a Super Admin user
3. Open Developer Tools (F12)
4. Go to: Application → Local Storage → Find `auth0` or `token`
5. Copy the token value

### Option 2: From Auth0 Dashboard
1. Go to Auth0 Dashboard
2. Navigate to Applications → Test tab
3. Get a test token for your application

### Option 3: Postman/Insomnia
1. Set up OAuth 2.0 authentication
2. Configure with your Auth0 credentials
3. Get the token from the response

## Requirements for Testing HTTP Endpoint

The Auth0 token must be from a user that:
- ✅ Belongs to company with ID: `valorize-hq-000`
- ✅ Has role: `Super Administrador`

## Available Company IDs for Testing

```
1. Toro Investimentos: cmi2fe3q70000tpvhw57spuo1
2. Global Solutions Inc: demo-company-003
3. TechStart Brasil: demo-company-002
4. Valorize Corp: demo-company-001
5. Valorize HQ: valorize-hq-000
```

## Expected Response Structure

When the endpoint works correctly, it should return:

```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "domain": "string",
    "country": "string",
    "timezone": "string",
    "logoUrl": "string | null",
    "billingEmail": "string | null",
    "isActive": "boolean",
    "createdAt": "Date",
    "updatedAt": "Date",
    "companyBrazil": { ... },
    "contacts": [],
    "settings": { ... },
    "allowedDomains": [],
    "wallet": {
      "balance": number,
      "totalDeposited": number,
      "burnRate": number,
      // ... more fields
    },
    "plan": {
      "planType": "PROFESSIONAL",
      "pricePerUser": number,
      // ... more fields
    },
    "metrics": {
      "users": { ... },
      "compliments": { ... },
      "engagement": { ... },
      // ... more fields
    },
    "billing": {
      "currentMRR": number,
      "activeUsers": number,
      // ... more fields
    }
  }
}
```

## Troubleshooting

### If endpoint returns empty data
1. Check if server is running (`npm run dev`)
2. Verify token is valid and not expired
3. Verify user has correct permissions
4. Check server logs for errors

### If service test works but HTTP endpoint doesn't
- Issue is likely in authentication or HTTP layer
- Check middleware configuration
- Verify CORS settings if testing from browser

## Endpoint Architecture

The backoffice companies module has the following endpoint design:

### Full Details Endpoint
**GET /backoffice/companies/:id**
- Returns complete company overview
- Includes: basic info, wallet, plan, metrics, billing, contacts, domains
- Use case: Dashboard summary, complete company view

### Specialized Endpoints
These provide focused data for specific management tasks:

**GET /backoffice/companies/:id/wallet**
- Returns ONLY wallet status
- Use case: Wallet management operations

**GET /backoffice/companies/:id/billing**
- Returns ONLY billing information
- Use case: Financial reporting, MRR tracking

**GET /backoffice/companies/:id/metrics**
- Returns ONLY company metrics
- Use case: Analytics, engagement tracking

### Why This Design?
1. **Full details** for dashboard/overview screens
2. **Specialized endpoints** for focused operations (reduces payload size)
3. **Consistent data** - specialized endpoints return the same data as full details
4. **Better performance** - clients can request only what they need
