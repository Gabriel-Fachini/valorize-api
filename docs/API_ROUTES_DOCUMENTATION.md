# API Routes Documentation

This document provides a comprehensive overview of all available API endpoints in the Valorize API.

## Base URL

```
http://localhost:3000
```

## Authentication

Most endpoints require authentication using a Bearer token from Auth0. Include the token in the Authorization header:

```
Authorization: Bearer <your_token>
```

---

## Table of Contents

- [Health Check](#health-check)
- [Authentication](#authentication-routes)
- [Users](#users-routes)
- [Addresses](#addresses-routes)
- [Companies](#companies-routes)
- [Company Settings](#company-settings-routes)
- [Company Values](#company-values-routes)
- [Compliments](#compliments-routes)
- [Wallets](#wallets-routes)
- [Prizes](#prizes-routes)
- [Redemptions](#redemptions-routes)
- [RBAC (Admin)](#rbac-routes)

---

## Health Check

### Get API Health Status

**Path:** `GET /health`

**Description:** Check if the API is running and healthy

**Authentication:** Not required

**Input:** None

**Output:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-07T12:00:00.000Z",
  "uptime": 12345.678
}
```

---

## Authentication Routes

Base path: `/auth`

### 1. Login

**Path:** `POST /auth/login`

**Description:** Authenticate user with email and password

**Authentication:** Not required

**Input:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Output:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "v1.MRr...",
    "expires_in": 86400,
    "token_type": "Bearer"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing email or password
- `401 Unauthorized`: Invalid credentials
- `500 Internal Server Error`: Authentication service unavailable

---

### 2. Refresh Token

**Path:** `POST /auth/refresh`

**Description:** Get a new access token using a refresh token

**Authentication:** Not required

**Input:**
```json
{
  "refresh_token": "v1.MRr..."
}
```

**Output:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400,
    "token_type": "Bearer"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing or malformed refresh token
- `401 Unauthorized`: Invalid or expired refresh token

---

### 3. Verify Session

**Path:** `GET /auth/verify`

**Description:** Verify token validity and get session information

**Authentication:** Required

**Query Parameters:**
- `minimal` (boolean, optional): If true, returns only token validity info without user details

**Input:** None (token in Authorization header)

**Output (full mode):**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "expiresAt": "2025-10-08T12:00:00.000Z",
    "timeRemaining": 86400,
    "timeRemainingFormatted": "1 day",
    "needsRefresh": false,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": "https://...",
      "companyId": "uuid",
      "isActive": true
    },
    "message": "Token is valid for 1 day"
  }
}
```

**Output (minimal mode):**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "timeRemaining": 86400,
    "message": "Token is valid"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Token not found, invalid, or expired

---

### 4. Get Refresh Instructions

**Path:** `GET /auth/refresh-instructions`

**Description:** Get instructions for refreshing tokens

**Authentication:** Not required

**Input:** None

**Output:**
```json
{
  "success": true,
  "data": {
    "endpoint": "/auth/refresh",
    "instructions": "Use your refresh_token to get a new access_token",
    "requiredFields": ["refresh_token"]
  }
}
```

---

### 5. Auth Health Check

**Path:** `GET /auth/health`

**Description:** Check authentication module health

**Authentication:** Not required

**Input:** None

**Output:**
```json
{
  "status": "ok",
  "module": "auth",
  "timestamp": "2025-10-07T12:00:00.000Z"
}
```

---

## Users Routes

Base path: `/users`

### 1. Get Current User Profile

**Path:** `GET /users/profile`

**Description:** Get the authenticated user's profile information

**Authentication:** Required

**Input:** None

**Output:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "auth0Id": "auth0|123456",
    "email": "user@example.com",
    "name": "John Doe",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-10-07T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: User not found or deactivated

---

### 2. Update User Profile

**Path:** `PUT /users/profile`

**Description:** Update the authenticated user's profile

**Authentication:** Required

**Input:**
```json
{
  "name": "John Updated Doe"
}
```

**Output:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "auth0Id": "auth0|123456",
    "email": "user@example.com",
    "name": "John Updated Doe",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-10-07T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data
- `404 Not Found`: User not found

---

### 3. Deactivate User Account

**Path:** `DELETE /users/profile`

**Description:** Deactivate the authenticated user's account

**Authentication:** Required

**Input:** None

**Output:**
```json
{
  "success": true,
  "message": "User account deactivated successfully"
}
```

**Error Responses:**
- `404 Not Found`: User not found

---

### 4. Get User Balance

**Path:** `GET /users/me/get-my-balance`

**Description:** Get the authenticated user's coin balance

**Authentication:** Required

**Input:** None

**Output:**
```json
{
  "complimentBalance": 100,
  "redeemableBalance": 50
}
```

**Error Responses:**
- `404 Not Found`: User not found

---

### 5. Users Health Check

**Path:** `GET /users/health`

**Description:** Check users module health

**Authentication:** Not required

**Input:** None

**Output:**
```json
{
  "status": "ok",
  "module": "users",
  "timestamp": "2025-10-07T12:00:00.000Z"
}
```

---

## Addresses Routes

Base path: `/addresses`

### 1. Create Address

**Path:** `POST /addresses`

**Description:** Create a new delivery address for the authenticated user

**Authentication:** Required

**Input:**
```json
{
  "name": "Home",
  "street": "Rua Exemplo",
  "number": "123",
  "complement": "Apto 45",
  "neighborhood": "Centro",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567",
  "country": "BR",
  "phone": "+5511987654321",
  "isDefault": true
}
```

**Output:**
```json
{
  "message": "Address created successfully",
  "address": {
    "id": "uuid",
    "userId": "uuid",
    "name": "Home",
    "street": "Rua Exemplo",
    "number": "123",
    "complement": "Apto 45",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567",
    "country": "BR",
    "phone": "+5511987654321",
    "isDefault": true,
    "createdAt": "2025-10-07T12:00:00.000Z",
    "updatedAt": "2025-10-07T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input or max addresses reached (10 per user)
- `404 Not Found`: User not found

---

### 2. Get All User Addresses

**Path:** `GET /addresses`

**Description:** Get all delivery addresses for the authenticated user

**Authentication:** Required

**Input:** None

**Output:**
```json
{
  "addresses": [
    {
      "id": "uuid",
      "userId": "uuid",
      "name": "Home",
      "street": "Rua Exemplo",
      "number": "123",
      "complement": "Apto 45",
      "neighborhood": "Centro",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01234-567",
      "country": "BR",
      "phone": "+5511987654321",
      "isDefault": true,
      "createdAt": "2025-10-07T12:00:00.000Z",
      "updatedAt": "2025-10-07T12:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `404 Not Found`: User not found

---

### 3. Get Address by ID

**Path:** `GET /addresses/:id`

**Description:** Get a specific address by ID

**Authentication:** Required

**Parameters:**
- `id` (string, required): Address UUID

**Input:** None

**Output:**
```json
{
  "address": {
    "id": "uuid",
    "userId": "uuid",
    "name": "Home",
    "street": "Rua Exemplo",
    "number": "123",
    "complement": "Apto 45",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567",
    "country": "BR",
    "phone": "+5511987654321",
    "isDefault": true,
    "createdAt": "2025-10-07T12:00:00.000Z",
    "updatedAt": "2025-10-07T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `403 Forbidden`: User is not the owner of the address
- `404 Not Found`: Address not found

---

### 4. Update Address

**Path:** `PUT /addresses/:id`

**Description:** Update a specific address

**Authentication:** Required

**Parameters:**
- `id` (string, required): Address UUID

**Input:**
```json
{
  "name": "Office",
  "street": "Av. Paulista",
  "number": "1000",
  "complement": "10º andar",
  "neighborhood": "Bela Vista",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01310-100",
  "country": "BR",
  "phone": "+5511999887766",
  "isDefault": false
}
```

**Output:**
```json
{
  "message": "Address updated successfully",
  "address": {
    "id": "uuid",
    "userId": "uuid",
    "name": "Office",
    "street": "Av. Paulista",
    "number": "1000",
    "complement": "10º andar",
    "neighborhood": "Bela Vista",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01310-100",
    "country": "BR",
    "phone": "+5511999887766",
    "isDefault": false,
    "createdAt": "2025-10-07T12:00:00.000Z",
    "updatedAt": "2025-10-07T13:00:00.000Z"
  }
}
```

**Error Responses:**
- `403 Forbidden`: User is not the owner of the address
- `404 Not Found`: Address not found

---

### 5. Delete Address

**Path:** `DELETE /addresses/:id`

**Description:** Delete a specific address

**Authentication:** Required

**Parameters:**
- `id` (string, required): Address UUID

**Input:** None

**Output:**
```json
{
  "message": "Address deleted successfully"
}
```

**Error Responses:**
- `403 Forbidden`: User is not the owner of the address
- `404 Not Found`: Address not found

---

### 6. Set Default Address

**Path:** `POST /addresses/:id/set-default`

**Description:** Set a specific address as the default delivery address

**Authentication:** Required

**Parameters:**
- `id` (string, required): Address UUID

**Input:** None

**Output:**
```json
{
  "message": "Default address updated successfully"
}
```

**Error Responses:**
- `403 Forbidden`: User is not the owner of the address
- `404 Not Found`: Address not found

---

## Companies Routes

Base path: `/companies`

### 1. Get All Companies

**Path:** `GET /companies/get-all-companies`

**Description:** List all companies in the system

**Authentication:** Required

**Input:** None

**Output:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Acme Corp",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-10-07T12:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "timestamp": "2025-10-07T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `500 Internal Server Error`: Failed to retrieve companies

---

### 2. Create Company

**Path:** `POST /companies/create-company`

**Description:** Create a new company

**Authentication:** Required

**Input:**
```json
{
  "name": "New Company Inc",
  "country": "BR",
  "cnpj": "12.345.678/0001-90"
}
```

**Output:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "New Company Inc",
    "createdAt": "2025-10-07T12:00:00.000Z",
    "updatedAt": "2025-10-07T12:00:00.000Z"
  },
  "meta": {
    "timestamp": "2025-10-07T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data

---

### 3. Validate CNPJ

**Path:** `POST /companies/validate-cnpj`

**Description:** Validate a Brazilian CNPJ (company registration number)

**Authentication:** Required

**Input:**
```json
{
  "cnpj": "12345678000190"
}
```

**Output:**
```json
{
  "success": true,
  "data": {
    "cnpj": "12345678000190",
    "formatted": "12.345.678/0001-90",
    "isValid": true
  },
  "meta": {
    "timestamp": "2025-10-07T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `500 Internal Server Error`: Validation service error

---

## Company Settings Routes

Base path: (no prefix, uses full path)

### 1. Get Company Settings

**Path:** `GET /companies/:companyId/settings`

**Description:** Get settings for a specific company

**Authentication:** Required

**Parameters:**
- `companyId` (string, required): Company UUID

**Input:** None

**Output:**
```json
{
  "settings": {
    "id": "uuid",
    "companyId": "uuid",
    "weeklyComplimentLimit": 100,
    "enableRedemptions": true,
    "requireApprovalForRedemptions": false,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-10-07T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `500 Internal Server Error`: Failed to retrieve settings

---

### 2. Update Company Settings

**Path:** `PUT /companies/:companyId/settings`

**Description:** Update settings for a specific company

**Authentication:** Required (requires `company:manage_settings` permission)

**Parameters:**
- `companyId` (string, required): Company UUID

**Input:**
```json
{
  "weeklyComplimentLimit": 150,
  "enableRedemptions": true,
  "requireApprovalForRedemptions": true
}
```

**Output:**
```json
{
  "message": "Company settings updated successfully!",
  "settings": {
    "id": "uuid",
    "companyId": "uuid",
    "weeklyComplimentLimit": 150,
    "enableRedemptions": true,
    "requireApprovalForRedemptions": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-10-07T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `403 Forbidden`: Missing required permission
- `400 Bad Request`: Invalid input data

---

## Company Values Routes

Base path: (no prefix, uses full path)

### 1. Create Company Value

**Path:** `POST /companies/:companyId/create-value`

**Description:** Create a new core value for a company

**Authentication:** Required (requires `company:manage_settings` permission)

**Parameters:**
- `companyId` (string, required): Company UUID

**Input:**
```json
{
  "name": "Innovation",
  "description": "We embrace new ideas and technologies",
  "icon": "💡"
}
```

**Output:**
```json
{
  "message": "Company value created successfully!",
  "value": {
    "id": "uuid",
    "companyId": "uuid",
    "name": "Innovation",
    "description": "We embrace new ideas and technologies",
    "icon": "💡",
    "createdAt": "2025-10-07T12:00:00.000Z",
    "updatedAt": "2025-10-07T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `403 Forbidden`: Missing required permission
- `400 Bad Request`: Invalid input data

---

### 2. List Company Values

**Path:** `GET /companies/:companyId/values`

**Description:** Get all core values for a company

**Authentication:** Required

**Parameters:**
- `companyId` (string, required): Company UUID

**Input:** None

**Output:**
```json
[
  {
    "id": "uuid",
    "companyId": "uuid",
    "name": "Innovation",
    "description": "We embrace new ideas and technologies",
    "icon": "💡",
    "createdAt": "2025-10-07T12:00:00.000Z",
    "updatedAt": "2025-10-07T12:00:00.000Z"
  }
]
```

**Error Responses:**
- `400 Bad Request`: Invalid company ID

---

## Compliments Routes

Base path: `/compliments`

### 1. Send Compliment

**Path:** `POST /compliments/send-compliment`

**Description:** Send a compliment (recognition) to another user

**Authentication:** Required

**Input:**
```json
{
  "receiverId": "uuid",
  "message": "Great work on the project!",
  "valueId": "uuid",
  "amount": 10
}
```

**Output:**
```json
{
  "message": "Compliment sent successfully!",
  "compliment": {
    "id": "uuid",
    "senderId": "uuid",
    "receiverId": "uuid",
    "message": "Great work on the project!",
    "valueId": "uuid",
    "amount": 10,
    "createdAt": "2025-10-07T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input or insufficient balance
- `404 Not Found`: Sender user not found

---

### 2. List Receivable Users

**Path:** `GET /compliments/list-receivable-users`

**Description:** Get a list of users who can receive compliments from the authenticated user

**Authentication:** Required

**Input:** None

**Output:**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "avatar": "https://..."
    }
  ]
}
```

**Error Responses:**
- `404 Not Found`: Current user not found

---

### 3. Get Compliment History

**Path:** `GET /compliments/history`

**Description:** Get compliment history for the authenticated user

**Authentication:** Required

**Query Parameters:**
- `type` (string, optional): Filter by 'sent' or 'received'
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Input:** None

**Output:**
```json
{
  "compliments": [
    {
      "id": "uuid",
      "senderId": "uuid",
      "senderName": "John Doe",
      "receiverId": "uuid",
      "receiverName": "Jane Doe",
      "message": "Great work!",
      "amount": 10,
      "createdAt": "2025-10-07T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

**Error Responses:**
- `404 Not Found`: Current user not found

---

## Wallets Routes

Base path: `/wallets`

### 1. Get Wallet Balance

**Path:** `GET /wallets/balance`

**Description:** Get the authenticated user's wallet balance

**Authentication:** Required

**Input:** None

**Output:**
```json
{
  "complimentBalance": 100,
  "redeemableBalance": 50
}
```

**Error Responses:**
- `404 Not Found`: User not found

---

### 2. Get Transaction History

**Path:** `GET /wallets/transactions`

**Description:** Get the authenticated user's transaction history

**Authentication:** Required

**Query Parameters:**
- `limit` (integer, optional): Number of items to return (1-100, default: 50)
- `offset` (integer, optional): Number of items to skip (default: 0)
- `balanceType` (string, optional): Filter by 'COMPLIMENT' or 'REDEEMABLE'
- `transactionType` (string, optional): Filter by 'DEBIT', 'CREDIT', or 'RESET'
- `fromDate` (string, optional): Filter transactions from this date (ISO 8601)
- `toDate` (string, optional): Filter transactions until this date (ISO 8601)

**Input:** None

**Output:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "transactionType": "CREDIT",
      "balanceType": "COMPLIMENT",
      "amount": 10,
      "previousBalance": 40,
      "newBalance": 50,
      "reason": "Received compliment",
      "metadata": {},
      "createdAt": "2025-10-07T12:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

**Error Responses:**
- `404 Not Found`: User not found
- `500 Internal Server Error`: Failed to retrieve transaction history

---

### 3. Reset Weekly Balance (Admin)

**Path:** `POST /wallets/reset-weekly-balance`

**Description:** Reset weekly compliment balances for a company or all companies

**Authentication:** Required (requires `admin:manage_system` permission)

**Query Parameters:**
- `companyId` (string, optional): Company UUID to reset (if omitted, resets all companies)

**Input:** None

**Output (single company):**
```json
{
  "message": "Weekly balance reset completed successfully for company",
  "companyId": "uuid",
  "companyName": "Acme Corp",
  "walletsUpdated": 50,
  "weeklyLimit": 100,
  "resetBy": "Admin User"
}
```

**Output (all companies):**
```json
{
  "message": "Weekly balance reset completed successfully for all companies",
  "companiesUpdated": 5,
  "walletsUpdated": 250,
  "resetBy": "Admin User"
}
```

**Error Responses:**
- `403 Forbidden`: Missing required permission
- `404 Not Found`: Admin user not found
- `500 Internal Server Error`: Failed to reset balances

---

## Prizes Routes

Base path: `/prizes`

### 1. List Prize Catalog

**Path:** `GET /prizes/catalog`

**Description:** List all available prizes for redemption

**Authentication:** Required

**Query Parameters:**
- `category` (string, optional): Filter by category
- `minPrice` (number, optional): Minimum coin price
- `maxPrice` (number, optional): Maximum coin price

**Input:** None

**Output:**
```json
{
  "prizes": [
    {
      "id": "uuid",
      "name": "Wireless Headphones",
      "description": "High-quality wireless headphones",
      "category": "electronics",
      "brand": "Sony",
      "coinPrice": 500,
      "images": ["https://..."],
      "stock": 10,
      "specifications": {},
      "createdAt": "2025-10-07T12:00:00.000Z",
      "updatedAt": "2025-10-07T12:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request`: Invalid query parameters
- `404 Not Found`: User not found

---

### 2. Get Prize Details

**Path:** `GET /prizes/catalog/:id`

**Description:** Get detailed information about a specific prize

**Authentication:** Required

**Parameters:**
- `id` (string, required): Prize UUID

**Input:** None

**Output:**
```json
{
  "prize": {
    "id": "uuid",
    "name": "Wireless Headphones",
    "description": "High-quality wireless headphones with noise cancellation",
    "category": "electronics",
    "brand": "Sony",
    "coinPrice": 500,
    "images": ["https://..."],
    "stock": 10,
    "specifications": {
      "color": "Black",
      "batteryLife": "30 hours"
    },
    "variants": [
      {
        "id": "uuid",
        "name": "Color",
        "value": "Black",
        "stock": 5
      }
    ],
    "createdAt": "2025-10-07T12:00:00.000Z",
    "updatedAt": "2025-10-07T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `404 Not Found`: Prize not found or not available to user

---

### 3. Get Available Categories

**Path:** `GET /prizes/categories`

**Description:** Get list of available prize categories

**Authentication:** Required

**Input:** None

**Output:**
```json
{
  "categories": [
    "electronics",
    "gift-cards",
    "experiences",
    "home-office"
  ]
}
```

**Error Responses:**
- `400 Bad Request`: Failed to get categories
- `404 Not Found`: User not found

---

### 4. Create Prize (Admin)

**Path:** `POST /prizes`

**Description:** Create a new prize

**Authentication:** Required (admin)

**Input:**
```json
{
  "name": "Premium Headphones",
  "description": "Noise-cancelling wireless headphones",
  "category": "electronics",
  "images": ["https://example.com/image.jpg"],
  "coinPrice": 500,
  "brand": "Sony",
  "specifications": {
    "color": "Black",
    "batteryLife": "30 hours"
  },
  "stock": 20,
  "isGlobal": false
}
```

**Output:**
```json
{
  "message": "Prize created successfully",
  "prize": {
    "id": "uuid",
    "companyId": "uuid",
    "name": "Premium Headphones",
    "description": "Noise-cancelling wireless headphones",
    "category": "electronics",
    "brand": "Sony",
    "coinPrice": 500,
    "images": ["https://example.com/image.jpg"],
    "stock": 20,
    "specifications": {},
    "createdAt": "2025-10-07T12:00:00.000Z",
    "updatedAt": "2025-10-07T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data
- `404 Not Found`: User not found

---

### 5. Add Prize Variant (Admin)

**Path:** `POST /prizes/:id/variants`

**Description:** Add a variant (e.g., size, color) to an existing prize

**Authentication:** Required (admin)

**Parameters:**
- `id` (string, required): Prize UUID

**Input:**
```json
{
  "name": "Color",
  "value": "White",
  "stock": 10
}
```

**Output:**
```json
{
  "message": "Prize variant added successfully",
  "variant": {
    "id": "uuid",
    "prizeId": "uuid",
    "name": "Color",
    "value": "White",
    "stock": 10,
    "createdAt": "2025-10-07T12:00:00.000Z",
    "updatedAt": "2025-10-07T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input or failed to add variant
- `404 Not Found`: User or prize not found

---

## Redemptions Routes

Base path: `/redemptions`

### 1. Redeem Prize

**Path:** `POST /redemptions/redeem`

**Description:** Redeem a prize using redeemable coins

**Authentication:** Required

**Input:**
```json
{
  "prizeId": "uuid",
  "variantId": "uuid",
  "addressId": "uuid"
}
```

**Output:**
```json
{
  "message": "Prize redeemed successfully",
  "redemption": {
    "id": "uuid",
    "userId": "uuid",
    "prizeId": "uuid",
    "variantId": "uuid",
    "addressId": "uuid",
    "coinPrice": 500,
    "status": "PENDING",
    "createdAt": "2025-10-07T12:00:00.000Z",
    "updatedAt": "2025-10-07T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Insufficient balance, variant required, or invalid input
- `404 Not Found`: User not found
- `409 Conflict`: Insufficient stock

---

### 2. Get User Redemptions

**Path:** `GET /redemptions/my-redemptions`

**Description:** Get list of all redemptions made by the authenticated user

**Authentication:** Required

**Query Parameters:**
- `limit` (number, optional): Items per page (default: 20)
- `offset` (number, optional): Number of items to skip (default: 0)

**Input:** None

**Output:**
```json
{
  "redemptions": [
    {
      "id": "uuid",
      "userId": "uuid",
      "prizeId": "uuid",
      "prizeName": "Wireless Headphones",
      "variantId": "uuid",
      "variantValue": "Black",
      "addressId": "uuid",
      "coinPrice": 500,
      "status": "PENDING",
      "trackingInfo": null,
      "createdAt": "2025-10-07T12:00:00.000Z",
      "updatedAt": "2025-10-07T12:00:00.000Z"
    }
  ],
  "meta": {
    "limit": 20,
    "offset": 0,
    "count": 1
  }
}
```

**Error Responses:**
- `400 Bad Request`: Failed to get redemptions
- `404 Not Found`: User not found

---

### 3. Get Redemption Details

**Path:** `GET /redemptions/my-redemptions/:id`

**Description:** Get detailed information about a specific redemption

**Authentication:** Required

**Parameters:**
- `id` (string, required): Redemption UUID

**Input:** None

**Output:**
```json
{
  "redemption": {
    "id": "uuid",
    "userId": "uuid",
    "prize": {
      "id": "uuid",
      "name": "Wireless Headphones",
      "description": "High-quality wireless headphones",
      "images": ["https://..."]
    },
    "variant": {
      "id": "uuid",
      "name": "Color",
      "value": "Black"
    },
    "address": {
      "id": "uuid",
      "name": "Home",
      "street": "Rua Exemplo",
      "number": "123",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01234-567"
    },
    "coinPrice": 500,
    "status": "PENDING",
    "trackingInfo": null,
    "createdAt": "2025-10-07T12:00:00.000Z",
    "updatedAt": "2025-10-07T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `404 Not Found`: Redemption not found or user not authorized

---

### 4. Cancel Redemption

**Path:** `POST /redemptions/my-redemptions/:id/cancel`

**Description:** Cancel a pending redemption

**Authentication:** Required

**Parameters:**
- `id` (string, required): Redemption UUID

**Input:**
```json
{
  "reason": "Changed my mind"
}
```

**Output:**
```json
{
  "message": "Redemption cancelled successfully",
  "coinsRefunded": 500,
  "newBalance": 550
}
```

**Error Responses:**
- `400 Bad Request`: Cannot cancel shipped orders or cancellation period expired
- `404 Not Found`: User or redemption not found

---

## RBAC Routes

Base path: `/admin`

### 1. Create Role

**Path:** `POST /admin/create-role`

**Description:** Create a new role with specific permissions

**Authentication:** Required (requires `users:manage_roles` permission)

**Input:**
```json
{
  "name": "Manager",
  "description": "Department manager role",
  "permissions": ["users:view", "compliments:send"]
}
```

**Output:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Manager",
    "description": "Department manager role",
    "permissions": ["users:view", "compliments:send"]
  }
}
```

**Error Responses:**
- `403 Forbidden`: Missing required permission
- `400 Bad Request`: Invalid input data

---

### 2. Assign Role to User

**Path:** `PUT /admin/users/:id/assign-role`

**Description:** Assign a role to a user

**Authentication:** Required (requires `users:manage_roles` permission)

**Parameters:**
- `id` (string, required): User UUID

**Input:**
```json
{
  "roleId": "uuid"
}
```

**Output:**
```json
{
  "success": true
}
```

**Error Responses:**
- `403 Forbidden`: Missing required permission
- `400 Bad Request`: Invalid user or role ID

---

### 3. Get User Permissions

**Path:** `GET /admin/me/permissions`

**Description:** Get all permissions for the authenticated user

**Authentication:** Required

**Input:** None

**Output:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "role": "Admin",
    "permissions": [
      "users:manage_roles",
      "company:manage_settings",
      "admin:manage_system"
    ]
  }
}
```

**Error Responses:**
- `400 Bad Request`: Failed to retrieve permissions
- `401 Unauthorized`: Invalid or missing token

---

## Status Codes

The API uses standard HTTP status codes:

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., insufficient stock)
- `500 Internal Server Error`: Server error

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed error message",
  "statusCode": 400
}
```

Or simplified version:

```json
{
  "message": "Error description"
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse. Default limits:
- Max requests: 100 per minute
- Time window: 60 seconds

When rate limit is exceeded, the API returns:
```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded"
}
```

---

## Pagination

For endpoints that return lists, pagination follows this pattern:

**Query Parameters:**
- `limit`: Number of items per page
- `offset`: Number of items to skip

**Response Structure:**
```json
{
  "data": [],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## Date Formats

All dates in the API use ISO 8601 format:
```
2025-10-07T12:00:00.000Z
```

---

## Support

For API support or questions:
- Email: support@valorize.com
- Documentation: http://localhost:3000/docs

---

*Last updated: October 7, 2025*

