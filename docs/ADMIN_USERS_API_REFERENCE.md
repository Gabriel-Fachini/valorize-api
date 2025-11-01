# Admin Users API Reference

## Overview

Complete API documentation for the Admin Users CRUD system. All endpoints require OAuth2 authentication and appropriate RBAC permissions.

**Base URL**: `http://localhost:3000/admin/users`

**Authentication**: Bearer Token (Auth0 JWT)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Error Handling](#error-handling)
3. [Endpoints](#endpoints)
   - [List Users](#1-list-users)
   - [Get User Detail](#2-get-user-detail)
   - [Create User](#3-create-user)
   - [Update User](#4-update-user)
   - [Delete User](#5-delete-user)
   - [Bulk Actions](#6-bulk-actions)
   - [CSV Template](#7-csv-template)
   - [CSV Preview](#8-csv-preview)
   - [CSV Import](#9-csv-import)

---

## Authentication

All requests require a Bearer token in the Authorization header:

```bash
Authorization: Bearer YOUR_AUTH0_JWT_TOKEN
```

---

## Error Handling

### Error Response Format

All errors follow this standard format:

```json
{
  "error": "Error Category",
  "message": "User-friendly error message",
  "statusCode": 400,
  "code": "ERROR_CODE",
  "requestId": "request-id-uuid"
}
```

### Common HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (Success, no body) |
| 400 | Bad Request (Validation error) |
| 403 | Forbidden (No permission) |
| 404 | Not Found |
| 409 | Conflict (Duplicate email) |
| 500 | Internal Server Error |

### Error Types

| Error | Status | Description |
|-------|--------|-------------|
| ValidationError | 400 | Input validation failed |
| NotFoundError | 404 | Resource not found |
| ConflictError | 409 | Duplicate email or resource exists |
| InsufficientPermissionError | 403 | User lacks required permission |
| Internal Server Error | 500 | Unexpected server error |

---

## Endpoints

### 1. List Users

Retrieve a paginated list of users with optional filters and search.

#### Request

```http
GET /admin/users?page=1&limit=20&search=&status=&departmentId=&sortBy=createdAt&sortOrder=desc
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number (1-based) |
| `limit` | integer | No | 20 | Items per page (1-100) |
| `search` | string | No | "" | Search by name or email (partial match) |
| `status` | string | No | - | Filter: "active" or "inactive" |
| `departmentId` | string | No | - | Filter by department ID |
| `sortBy` | string | No | "createdAt" | Sort field: name, email, createdAt, lastLogin |
| `sortOrder` | string | No | "desc" | Sort direction: asc, desc |

#### Required Permission

`users:read`

#### Response (200 OK)

```json
{
  "data": [
    {
      "id": "user_123",
      "name": "João Silva",
      "email": "joao@empresa.com.br",
      "department": {
        "id": "dept_456",
        "name": "Tecnologia"
      },
      "position": {
        "id": "job_789",
        "name": "Desenvolvedor"
      },
      "avatar": "https://example.com/avatar.jpg",
      "isActive": true,
      "createdAt": "2025-01-15T10:30:00Z",
      "lastLogin": null
    }
  ],
  "totalCount": 150,
  "pageCount": 8,
  "currentPage": 1
}
```

#### Example Request

```bash
curl -X GET "http://localhost:3000/admin/users?page=1&limit=20&search=joao&status=active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 2. Get User Detail

Retrieve complete information about a specific user including statistics.

#### Request

```http
GET /admin/users/{userId}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | User ID |

#### Required Permission

`users:read`

#### Response (200 OK)

```json
{
  "id": "user_123",
  "name": "João Silva",
  "email": "joao@empresa.com.br",
  "department": {
    "id": "dept_456",
    "name": "Tecnologia"
  },
  "position": {
    "id": "job_789",
    "name": "Desenvolvedor"
  },
  "avatar": "https://example.com/avatar.jpg",
  "isActive": true,
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-20T14:45:00Z",
  "lastLogin": null,
  "statistics": {
    "complimentsSent": 5,
    "complimentsReceived": 12,
    "totalCoins": 2500,
    "redeemptions": 3
  }
}
```

#### Response Codes

| Status | Description |
|--------|-------------|
| 200 | User found |
| 404 | User not found |
| 403 | Insufficient permission |

#### Example Request

```bash
curl -X GET "http://localhost:3000/admin/users/user_123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Create User

Create a new user in the system.

#### Request

```http
POST /admin/users
Content-Type: application/json
```

#### Body Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|-----------|
| `name` | string | Yes | User full name | Min 2 chars, max 100 |
| `email` | string | Yes | User email | Valid format, unique per company |
| `departmentId` | string | No | Department ID | Must exist in company |
| `jobTitleId` | string | No | Job title ID | Must exist in company |

#### Request Body

```json
{
  "name": "Maria Santos",
  "email": "maria@empresa.com.br",
  "departmentId": "dept_456",
  "jobTitleId": "job_789"
}
```

#### Required Permission

`users:create`

#### Response (201 Created)

```json
{
  "id": "user_999",
  "name": "Maria Santos",
  "email": "maria@empresa.com.br",
  "isActive": true,
  "createdAt": "2025-01-21T08:00:00Z"
}
```

#### Response Codes

| Status | Description |
|--------|-------------|
| 201 | User created successfully |
| 400 | Validation error (invalid name, email format) |
| 409 | Email already exists in company |
| 403 | Insufficient permission |

#### Error Examples

**Invalid Email**
```json
{
  "error": "ValidationError",
  "message": "Invalid email format",
  "statusCode": 400
}
```

**Duplicate Email**
```json
{
  "error": "ConflictError",
  "message": "Email already exists in this company",
  "statusCode": 409
}
```

#### Example Request

```bash
curl -X POST "http://localhost:3000/admin/users" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Santos",
    "email": "maria@empresa.com.br",
    "departmentId": "dept_456",
    "jobTitleId": "job_789"
  }'
```

---

### 4. Update User

Update user information.

#### Request

```http
PATCH /admin/users/{userId}
Content-Type: application/json
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | User ID |

#### Body Parameters (All Optional)

| Parameter | Type | Description | Validation |
|-----------|------|-------------|-----------|
| `name` | string | Updated name | Min 2 chars, max 100 |
| `email` | string | Updated email | Valid format, unique per company |
| `departmentId` | string \| null | Department ID or null to unset | Must exist if provided |
| `jobTitleId` | string \| null | Job title ID or null to unset | Must exist if provided |
| `isActive` | boolean | Active status | true or false |

#### Request Body

```json
{
  "name": "Maria dos Santos",
  "email": "maria.santos@empresa.com.br",
  "isActive": true
}
```

#### Required Permission

`users:update`

#### Response (200 OK)

```json
{
  "id": "user_123",
  "name": "Maria dos Santos",
  "email": "maria.santos@empresa.com.br",
  "isActive": true,
  "updatedAt": "2025-01-21T09:15:00Z"
}
```

#### Response Codes

| Status | Description |
|--------|-------------|
| 200 | User updated |
| 400 | Validation error |
| 404 | User not found |
| 409 | Email already exists |
| 403 | Insufficient permission |

#### Example Request

```bash
curl -X PATCH "http://localhost:3000/admin/users/user_123" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria dos Santos",
    "email": "maria.santos@empresa.com.br"
  }'
```

---

### 5. Delete User

Deactivate a user (soft delete - marks as inactive).

#### Request

```http
DELETE /admin/users/{userId}
```

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | User ID |

#### Required Permission

`users:delete`

#### Response (204 No Content)

Empty response body.

#### Response Codes

| Status | Description |
|--------|-------------|
| 204 | User deactivated |
| 404 | User not found |
| 403 | Insufficient permission |

#### Example Request

```bash
curl -X DELETE "http://localhost:3000/admin/users/user_123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 6. Bulk Actions

Perform actions on multiple users at once.

#### Request

```http
POST /admin/users/bulk/actions
Content-Type: application/json
```

#### Body Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|-----------|
| `userIds` | string[] | Yes | Array of user IDs | Min 1, max 100 items |
| `action` | string | Yes | Action to perform | "activate", "deactivate", "export" |

#### Request Body

```json
{
  "userIds": ["user_1", "user_2", "user_3"],
  "action": "activate"
}
```

#### Required Permission

`users:bulk_actions`

#### Response Examples

##### Activate/Deactivate (200 OK)

```json
{
  "updated": 3
}
```

##### Export (200 OK)

Returns CSV file with headers:
```
id,name,email,department,position,isActive,createdAt
user_1,"João Silva",joao@empresa.com.br,Tecnologia,Desenvolvedor,true,2025-01-15T10:30:00Z
user_2,"Maria Santos",maria@empresa.com.br,RH,Analista,true,2025-01-16T14:20:00Z
```

#### Response Codes

| Status | Description |
|--------|-------------|
| 200 | Action completed |
| 400 | Invalid action or parameters |
| 403 | Insufficient permission |

#### Example Requests

**Activate Users**
```bash
curl -X POST "http://localhost:3000/admin/users/bulk/actions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user_1", "user_2"],
    "action": "activate"
  }'
```

**Deactivate Users**
```bash
curl -X POST "http://localhost:3000/admin/users/bulk/actions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user_1", "user_2"],
    "action": "deactivate"
  }'
```

**Export Users**
```bash
curl -X POST "http://localhost:3000/admin/users/bulk/actions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user_1", "user_2"],
    "action": "export"
  }' \
  -o exported_users.csv
```

---

### 7. CSV Template

Download a CSV template for bulk user import.

#### Request

```http
GET /admin/users/csv/template
```

#### Required Permission

`users:import_csv`

#### Response (200 OK)

Returns a CSV file with content:

```csv
"nome","email","departamento","cargo"
"João Silva","joao@empresa.com.br","Tecnologia","Desenvolvedor"
"Maria Santos","maria@empresa.com.br","RH","Analista"
```

#### Response Headers

```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="users_template.csv"
```

#### Example Request

```bash
curl -X GET "http://localhost:3000/admin/users/csv/template" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o template.csv
```

---

### 8. CSV Preview

Preview and validate CSV file before importing.

#### Request

```http
POST /admin/users/csv/preview
Content-Type: application/json
```

#### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fileContent` | string | Yes | Base64 encoded CSV file content |

#### Request Body

```json
{
  "fileContent": "bm9tZSxlbWFpbCxkZXBhcnRhbWVudG8sY2FyZ28KSm7Dh28gU2lsdmEsam9hb0BlbXByZXNhLmNvbS5icixUZWNub2xvZ2lhLERlc2Vudm9sdmVkb3I="
}
```

#### Required Permission

`users:import_csv`

#### Response (200 OK)

```json
{
  "previewId": "preview-1705849200000-abc123def456",
  "totalRows": 2,
  "validRows": 2,
  "rowsWithErrors": 0,
  "preview": [
    {
      "rowNumber": 1,
      "name": "João Silva",
      "email": "joao@empresa.com.br",
      "department": "Tecnologia",
      "position": "Desenvolvedor",
      "status": "valid",
      "errors": [],
      "action": "create"
    },
    {
      "rowNumber": 2,
      "name": "Maria Santos",
      "email": "maria@empresa.com.br",
      "department": "RH",
      "position": "Analista",
      "status": "valid",
      "errors": [],
      "action": "create"
    }
  ],
  "summary": {
    "toCreate": 2,
    "toUpdate": 0,
    "errors": 0
  },
  "expiresAt": "2025-01-21T09:30:00Z"
}
```

#### Preview Status Values

| Status | Description |
|--------|-------------|
| `valid` | Row is valid and will be imported |
| `error` | Row has validation errors |
| `duplicate` | Email is duplicated within CSV |
| `exists` | Email already exists in database |

#### Action Values

| Action | Description |
|--------|-------------|
| `create` | New user will be created |
| `update` | Existing user will be updated |
| `skip` | Row will be skipped |

#### Response Codes

| Status | Description |
|--------|-------------|
| 200 | Preview generated |
| 400 | Invalid CSV format or file |
| 403 | Insufficient permission |

#### Error Example

```json
{
  "error": "ValidationError",
  "message": "CSV file is empty",
  "statusCode": 400
}
```

#### How to Generate Base64 Content

```bash
# On Linux/Mac
base64 < users.csv

# On Windows (PowerShell)
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("C:\users.csv"))

# In JavaScript/Node.js
const fs = require('fs');
const content = fs.readFileSync('users.csv');
const base64 = content.toString('base64');
```

#### Example Request

```bash
# First, encode your CSV file
BASE64_CONTENT=$(cat users.csv | base64)

# Then send the preview request
curl -X POST "http://localhost:3000/admin/users/csv/preview" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"fileContent\": \"$BASE64_CONTENT\"}"
```

---

### 9. CSV Import

Confirm and process CSV import.

#### Request

```http
POST /admin/users/csv/import
Content-Type: application/json
```

#### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `previewId` | string | Yes | Preview ID from CSV preview endpoint |
| `confirmedRows` | integer[] | No | Array of row numbers to import (if not provided, all valid rows are imported) |

#### Request Body

```json
{
  "previewId": "preview-1705849200000-abc123def456",
  "confirmedRows": [1, 2]
}
```

#### Required Permission

`users:import_csv`

#### Response (200 OK)

```json
{
  "status": "completed",
  "report": {
    "created": 2,
    "updated": 0,
    "skipped": 0,
    "errors": []
  }
}
```

#### Response With Errors

```json
{
  "status": "completed",
  "report": {
    "created": 1,
    "updated": 0,
    "skipped": 0,
    "errors": [
      {
        "rowNumber": 2,
        "email": "invalid@email",
        "reason": "Invalid email format"
      }
    ]
  }
}
```

#### Response Codes

| Status | Description |
|--------|-------------|
| 200 | Import processed |
| 400 | Invalid preview ID or parameters |
| 404 | Preview not found or expired |
| 403 | Insufficient permission |

#### Error Example

```json
{
  "error": "ValidationError",
  "message": "Preview expired or not found",
  "statusCode": 400
}
```

#### Example Request

```bash
curl -X POST "http://localhost:3000/admin/users/csv/import" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "previewId": "preview-1705849200000-abc123def456",
    "confirmedRows": [1, 2]
  }'
```

---

## CSV Format Details

### Expected Headers

| Column | Required | Type | Description |
|--------|----------|------|-------------|
| `nome` | Yes | string | User name (2-100 characters) |
| `email` | Yes | string | User email (valid format, unique) |
| `departamento` | No | string | Department name (will match by partial name) |
| `cargo` | No | string | Job title name (will match by partial name) |

### CSV Example

```csv
nome,email,departamento,cargo
João Silva,joao@empresa.com.br,Tecnologia,Desenvolvedor
Maria Santos,maria@empresa.com.br,RH,Analista Recursos Humanos
Pedro Oliveira,pedro@empresa.com.br,Financeiro,Contador
```

### Validation Rules

1. **Name**:
   - Required
   - Minimum 2 characters
   - Maximum 100 characters

2. **Email**:
   - Required
   - Valid email format
   - Unique per company
   - No duplicates within CSV file

3. **Department & Job Title**:
   - Optional
   - Matched by partial name (case-insensitive)
   - Must exist in company

4. **File**:
   - Maximum 1000 rows
   - Maximum 5MB size
   - UTF-8 encoding
   - CSV format with headers

---

## Common Workflows

### Workflow 1: List and Update User

```bash
# 1. List users to find one to update
curl -X GET "http://localhost:3000/admin/users?search=joao" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Get user details (to see current values)
curl -X GET "http://localhost:3000/admin/users/user_123" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Update user information
curl -X PATCH "http://localhost:3000/admin/users/user_123" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva Updated",
    "isActive": true
  }'
```

### Workflow 2: Import Users from CSV

```bash
# 1. Download template
curl -X GET "http://localhost:3000/admin/users/csv/template" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o template.csv

# 2. Fill template with data and save as users.csv

# 3. Preview import
BASE64=$(cat users.csv | base64)
curl -X POST "http://localhost:3000/admin/users/csv/preview" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"fileContent\": \"$BASE64\"}" \
  -o preview.json

# 4. Review preview in preview.json, extract previewId

# 5. Confirm import
curl -X POST "http://localhost:3000/admin/users/csv/import" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "previewId": "PREVIEW_ID_FROM_STEP_3"
  }'
```

### Workflow 3: Bulk Actions

```bash
# 1. Get list of user IDs to update
curl -X GET "http://localhost:3000/admin/users" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o users.json

# 2. Deactivate multiple users
curl -X POST "http://localhost:3000/admin/users/bulk/actions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user_1", "user_2", "user_3"],
    "action": "deactivate"
  }'
```

---

## Frontend Integration Examples

### JavaScript/TypeScript

```typescript
// List users
async function listUsers(page = 1, limit = 20) {
  const response = await fetch(
    `/admin/users?page=${page}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.json();
}

// Create user
async function createUser(name, email, departmentId) {
  const response = await fetch('/admin/users', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, email, departmentId })
  });
  return response.json();
}

// Preview CSV
async function previewCSV(file) {
  const buffer = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

  const response = await fetch('/admin/users/csv/preview', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fileContent: base64 })
  });
  return response.json();
}

// Import CSV
async function importCSV(previewId) {
  const response = await fetch('/admin/users/csv/import', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ previewId })
  });
  return response.json();
}
```

### React Component Example

```typescript
import { useState } from 'react';

function UserManagement({ token }) {
  const [users, setUsers] = useState([]);
  const [preview, setPreview] = useState(null);

  const handleCSVUpload = async (file) => {
    const buffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

    const response = await fetch('/admin/users/csv/preview', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileContent: base64 })
    });

    const data = await response.json();
    setPreview(data);
  };

  const handleImport = async () => {
    if (!preview) return;

    const response = await fetch('/admin/users/csv/import', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ previewId: preview.previewId })
    });

    const result = await response.json();
    console.log('Import complete:', result.report);
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleCSVUpload(e.target.files[0])} />
      {preview && (
        <div>
          <p>Valid: {preview.validRows} | Errors: {preview.rowsWithErrors}</p>
          <button onClick={handleImport}>Confirm Import</button>
        </div>
      )}
    </div>
  );
}
```

---

## Rate Limits

Currently, there are no explicit rate limits, but it's recommended to:
- Limit CSV preview requests to 1 per minute per company
- Limit file uploads to 5MB maximum
- Use pagination (max 100 items per page)

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Email addresses are stored in lowercase
- Soft delete: Users are marked as inactive, not deleted from database
- Company isolation: Admins only manage users from their own company
- CSV preview expires after 30 minutes
- All operations are logged for audit purposes

---

## Support & Troubleshooting

### Issue: "Email already exists in this company"
**Solution**: The email is already associated with another user. Use PATCH to update existing users or choose a different email.

### Issue: "Department not found"
**Solution**: The provided departmentId doesn't exist. Use list users endpoint to see available departments or try with a partial department name in CSV import.

### Issue: "CSV file is empty"
**Solution**: Ensure CSV has headers and at least one data row.

### Issue: "Preview expired or not found"
**Solution**: Preview ID is valid for 30 minutes. Request a new preview before importing.

---

**Last Updated**: 01/11/2025
**API Version**: 1.0.0
