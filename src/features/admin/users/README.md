# Admin Users Management Module

## Overview

This module implements complete user management functionality for the administrative panel, including CRUD operations and bulk CSV import capabilities.

## Structure

```
users/
├── types.ts                 # TypeScript interfaces
├── users.schemas.ts         # Fastify JSON schemas for validation
├── users.service.ts         # Business logic and database operations
├── csv-import.service.ts    # CSV parsing, validation, and import
└── users.routes.ts          # HTTP endpoints
```

## Key Features

### 1. User Listing & Search
- Paginated results (20-100 items per page)
- Search by name or email
- Filter by status (active/inactive)
- Filter by department
- Sort by multiple columns

### 2. User Details
- Complete user information
- Statistics:
  - Compliments sent/received
  - Redeemable coins
  - Prizes redeemed
  - Created/Updated dates

### 3. CRUD Operations
- **Create**: Validate and create new user
- **Read**: Get user details with statistics
- **Update**: Edit name, email, department, position, status
- **Delete**: Soft delete (mark as inactive)

### 4. Bulk Operations
- Activate/Deactivate multiple users (max 100)
- Export users list to CSV

### 5. CSV Import (CRITICAL)
- Download template
- Parse and validate CSV files
- Preview with error detection
- Bulk import with transaction
- Detailed success/error report

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/admin/users` | `users:read` | List users with filters |
| GET | `/admin/users/:userId` | `users:read` | Get user details + stats |
| POST | `/admin/users` | `users:create` | Create new user |
| PATCH | `/admin/users/:userId` | `users:update` | Update user |
| DELETE | `/admin/users/:userId` | `users:delete` | Deactivate user |
| POST | `/admin/users/bulk/actions` | `users:bulk_actions` | Bulk actions |
| GET | `/admin/users/csv/template` | `users:import_csv` | Download template |
| POST | `/admin/users/csv/preview` | `users:import_csv` | Preview CSV |
| POST | `/admin/users/csv/import` | `users:import_csv` | Import CSV |

## Validations

### Email
- Valid format (RFC 5322 basic)
- Unique per company
- Domain validation ready

### Name
- Required
- Minimum 2 characters
- Maximum 100 characters

### CSV File
- Maximum 1000 rows
- Maximum 5MB size
- UTF-8 encoding
- Required columns: nome, email

### Bulk Operations
- Maximum 100 users per operation
- Valid user IDs required

## CSV Format

### Template
```csv
nome,email,departamento,cargo
João Silva,joao@empresa.com.br,Tecnologia,Desenvolvedor
Maria Santos,maria@empresa.com.br,RH,Analista
```

### Expected Columns
- `nome` (required) - User name
- `email` (required) - User email
- `departamento` (optional) - Department name
- `cargo` (optional) - Job title name

## Error Handling

All errors are properly caught and returned with:
- Error type/category
- User-friendly message
- HTTP status code
- Error code for frontend

### Error Classes
- `ValidationError` (400) - Input validation failed
- `NotFoundError` (404) - Resource not found
- `ConflictError` (409) - Duplicate email
- Standard HTTP errors for other cases

## Security Features

- ✅ OAuth2 authentication required (Auth0)
- ✅ RBAC with permission checking
- ✅ Company isolation (admins see only their users)
- ✅ Input validation and sanitization
- ✅ Transaction-based operations
- ✅ Soft delete (no data loss)
- ✅ Comprehensive logging

## Performance

- Pagination required (no N+1)
- Optimized Prisma queries
- Index support via Prisma
- CSV preview cache (30 minutes)
- Bulk operations with transactions

## CSV Import Flow

1. **Download Template**: Admin gets empty CSV template
2. **Prepare Data**: Admin fills CSV with user data
3. **Preview**:
   - System validates each row
   - Detects duplicates and errors
   - Shows what will be created/updated
   - Generates preview ID
4. **Confirm**: Admin reviews and confirms import
5. **Process**:
   - System processes in transaction
   - Creates new users
   - Updates existing (by email)
   - Generates report

## Usage Examples

### List Users
```bash
GET /admin/users?page=1&limit=20&search=john&status=active&sortBy=name&sortOrder=asc
```

### Create User
```bash
POST /admin/users
{
  "name": "João Silva",
  "email": "joao@empresa.com.br",
  "departmentId": "dept_123",
  "jobTitleId": "job_456"
}
```

### Update User
```bash
PATCH /admin/users/user_123
{
  "name": "João Silva Updated",
  "isActive": false
}
```

### Bulk Action
```bash
POST /admin/users/bulk/actions
{
  "userIds": ["user_1", "user_2", "user_3"],
  "action": "activate"
}
```

### CSV Import
```bash
# 1. Get preview
POST /admin/users/csv/preview
{
  "fileContent": "base64_encoded_csv"
}

# 2. Confirm import
POST /admin/users/csv/import
{
  "previewId": "preview_token",
  "confirmedRows": [0, 1, 2]  # optional
}
```

## Future Enhancements

1. **Auth0 Integration**
   - Auto-create users in Auth0
   - Send welcome emails
   - Generate temporary passwords

2. **Domain Validation**
   - Check against company_domains
   - Block unauthorized domains

3. **Background Jobs**
   - Bull/BullMQ for large imports
   - Completion notifications

4. **Advanced Reports**
   - Import history
   - Change audit trail

5. **Frontend Integration**
   - OpenAPI/Swagger specs
   - Request examples

## Notes

- Soft delete: Users marked as inactive instead of deleted
- Company isolation: Each admin only manages their company users
- No data loss: All operations preserve data integrity
- Logging: All operations logged for audit purposes

## Related Files

- `permissions.constants.ts` - RBAC permissions definition
- `admin.routes.ts` - Route registration
- `error-handler.ts` - Error handling middleware
- `logger.ts` - Logging utility
