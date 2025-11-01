# Admin Users API - Testing Guide

This guide explains how to use the API documentation and Postman collection for testing the Admin Users CRUD system.

---

## 📚 Documentation Files

### 1. **ADMIN_USERS_API_REFERENCE.md**
Comprehensive API documentation including:
- Complete endpoint specifications
- Request/response formats
- Query parameters and body fields
- Error handling information
- Common workflows
- Frontend integration examples

**Use this for**: Building frontend, understanding endpoints, debugging issues

### 2. **ADMIN_USERS_POSTMAN_COLLECTION.json**
Ready-to-use Postman collection with pre-configured requests
- All 9 endpoints
- Environment variables
- Example request bodies
- Proper authorization setup

**Use this for**: Testing API, quick debugging, development

### 3. **TESTING_GUIDE.md** (this file)
Step-by-step guide for setting up and testing

---

## 🚀 Quick Start

### Step 1: Import Collection into Postman

1. Open **Postman**
2. Click **File** → **Import**
3. Select **ADMIN_USERS_POSTMAN_COLLECTION.json**
4. Collection will be imported with all endpoints organized

### Step 2: Set Up Environment Variables

In Postman, create or update these variables:

```
base_url:     http://localhost:3000
auth_token:   YOUR_AUTH0_JWT_TOKEN
user_id:      user_123 (replace with actual ID)
```

**How to set variables in Postman:**
1. Click **Environments** → **Create new environment**
2. Add the variables above
3. Select the environment in the top-right dropdown

### Step 3: Get Auth Token

#### Option A: Using Auth0 Dashboard
1. Go to Auth0 dashboard
2. Get your JWT token
3. Paste in `auth_token` variable

#### Option B: Using Authentication Request
1. In Postman, go to **Authentication** folder
2. Click "Get Auth Token (Example)"
3. Update with your Auth0 credentials
4. Click **Send**
5. Copy token from response and paste into `auth_token` variable

### Step 4: Start Testing

Select any endpoint from the collection and click **Send**

---

## 📋 API Endpoints Overview

### Users Management

| # | Endpoint | Method | Description |
|---|----------|--------|-------------|
| 1 | `/admin/users` | GET | List all users |
| 2 | `/admin/users/{userId}` | GET | Get user details |
| 3 | `/admin/users` | POST | Create user |
| 4 | `/admin/users/{userId}` | PATCH | Update user |
| 5 | `/admin/users/{userId}` | DELETE | Delete user |

### Bulk Actions

| # | Endpoint | Method | Action |
|---|----------|--------|--------|
| 6 | `/admin/users/bulk/actions` | POST | Activate multiple |
| 7 | `/admin/users/bulk/actions` | POST | Deactivate multiple |
| 8 | `/admin/users/bulk/actions` | POST | Export to CSV |

### CSV Import

| # | Endpoint | Method | Description |
|---|----------|--------|-------------|
| 9 | `/admin/users/csv/template` | GET | Download template |
| 10 | `/admin/users/csv/preview` | POST | Preview & validate |
| 11 | `/admin/users/csv/import` | POST | Confirm import |

---

## 🧪 Test Scenarios

### Scenario 1: List Users

**Request:**
```
GET /admin/users?page=1&limit=20
```

**Expected Response (200):**
```json
{
  "data": [
    {
      "id": "user_1",
      "name": "João Silva",
      "email": "joao@empresa.com.br",
      "isActive": true,
      ...
    }
  ],
  "totalCount": 50,
  "pageCount": 3,
  "currentPage": 1
}
```

---

### Scenario 2: Create User

**Request Body:**
```json
{
  "name": "Maria Santos",
  "email": "maria@empresa.com.br",
  "departmentId": "dept_1",
  "jobTitleId": "job_1"
}
```

**Expected Response (201):**
```json
{
  "id": "user_999",
  "name": "Maria Santos",
  "email": "maria@empresa.com.br",
  "isActive": true,
  "createdAt": "2025-01-21T10:00:00Z"
}
```

**Common Errors:**
- **400**: Invalid email format or name too short
- **409**: Email already exists
- **404**: Department or job title not found

---

### Scenario 3: CSV Import Workflow

#### Step 1: Download Template
```
GET /admin/users/csv/template
```
- Downloads CSV file with headers: nome, email, departamento, cargo

#### Step 2: Prepare CSV
Create file `users.csv`:
```csv
nome,email,departamento,cargo
João Silva,joao@empresa.com.br,Tecnologia,Desenvolvedor
Maria Santos,maria@empresa.com.br,RH,Analista
```

#### Step 3: Encode to Base64

**In Terminal:**
```bash
# Mac/Linux
base64 < users.csv

# Windows PowerShell
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("users.csv"))
```

**In JavaScript:**
```javascript
const fs = require('fs');
const content = fs.readFileSync('users.csv');
const base64 = content.toString('base64');
console.log(base64);
```

**In Python:**
```python
import base64
with open('users.csv', 'rb') as f:
    base64_content = base64.b64encode(f.read()).decode()
print(base64_content)
```

#### Step 4: Preview Import
```
POST /admin/users/csv/preview
Body:
{
  "fileContent": "YOUR_BASE64_CONTENT"
}
```

**Expected Response:**
```json
{
  "previewId": "preview-1705849200000-abc123",
  "totalRows": 2,
  "validRows": 2,
  "rowsWithErrors": 0,
  "preview": [
    {
      "rowNumber": 1,
      "name": "João Silva",
      "email": "joao@empresa.com.br",
      "status": "valid",
      "action": "create"
    }
  ],
  "summary": {
    "toCreate": 2,
    "toUpdate": 0,
    "errors": 0
  }
}
```

#### Step 5: Confirm Import
```
POST /admin/users/csv/import
Body:
{
  "previewId": "preview-1705849200000-abc123"
}
```

**Expected Response:**
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

---

### Scenario 4: Bulk Actions

#### Deactivate Multiple Users

**Request:**
```json
{
  "userIds": ["user_1", "user_2", "user_3"],
  "action": "deactivate"
}
```

**Response:**
```json
{
  "updated": 3
}
```

#### Export Users

**Request:**
```json
{
  "userIds": ["user_1", "user_2"],
  "action": "export"
}
```

**Response:** CSV file content
```csv
id,name,email,department,position,isActive,createdAt
user_1,João Silva,joao@empresa.com.br,Tecnologia,Desenvolvedor,true,2025-01-15T10:30:00Z
```

---

## 🔧 Advanced Testing

### Test Search Functionality

```
GET /admin/users?search=joao&limit=20
```

### Test Filtering

```
GET /admin/users?status=active&departmentId=dept_1
```

### Test Sorting

```
GET /admin/users?sortBy=name&sortOrder=asc
```

### Test Pagination

```
GET /admin/users?page=2&limit=50
```

---

## ❌ Common Issues & Solutions

### Issue: "Unauthorized" (401)
**Cause**: Missing or invalid token
**Solution**:
1. Check `auth_token` variable is set
2. Verify token is not expired
3. Get new token from Auth0

### Issue: "Forbidden" (403)
**Cause**: User lacks required permission
**Solution**:
1. Verify user has correct RBAC role
2. Check permission name matches endpoint requirement
3. Assign appropriate role in Auth0/admin panel

### Issue: "Email already exists" (409)
**Cause**: Email already in database
**Solution**:
1. Use unique email address
2. Or use PATCH to update existing user
3. Check current users with GET /admin/users

### Issue: "Invalid email format" (400)
**Cause**: Email doesn't match expected format
**Solution**:
1. Use format: `user@company.com`
2. Verify no spaces or special characters
3. Check email is not already in use

### Issue: "CSV file is empty"
**Cause**: CSV file has no data rows
**Solution**:
1. Ensure file has headers
2. Ensure file has at least one data row
3. Check file encoding is UTF-8

### Issue: "Preview expired"
**Cause**: Preview ID older than 30 minutes
**Solution**:
1. Request new preview
2. Import immediately after preview
3. Don't delay between preview and import

---

## 📊 Test Data

Use this test data for creating users:

### Department IDs (example)
```
dept_tech        - Tecnologia
dept_rh          - Recursos Humanos
dept_finance     - Financeiro
```

### Job Title IDs (example)
```
job_dev          - Desenvolvedor
job_analyst      - Analista
job_manager      - Gerente
```

### Test Emails (format: firstname@empresa.com.br)
```
joao@empresa.com.br
maria@empresa.com.br
pedro@empresa.com.br
ana@empresa.com.br
carlos@empresa.com.br
```

---

## 🛠️ Postman Collection Variables

Edit these in Postman Environment:

```json
{
  "base_url": "http://localhost:3000",
  "auth_token": "eyJhbGc...",
  "user_id": "user_123",
  "preview_id": "preview-xxx",
  "department_id": "dept_456",
  "job_title_id": "job_789"
}
```

---

## 🔍 Response Inspection

### In Postman:

1. **View Response Body**: Click **Body** tab
2. **View Response Headers**: Click **Headers** tab
3. **View Status**: Check status code (200, 201, 400, etc.)
4. **View Timing**: Check **Timeline** tab for performance

### Save Response:
1. Click **Response** → **Save**
2. Save to file for documentation

### Check JSON Validity:
1. Select Body content
2. Click **{</>** to format
3. Postman will highlight JSON errors

---

## 📈 Performance Testing

### Test pagination with large dataset:
```
GET /admin/users?page=1&limit=100
```

### Measure CSV preview time:
```
POST /admin/users/csv/preview
(with 1000 row CSV)
```

### Measure bulk operation time:
```
POST /admin/users/bulk/actions
(with 100 user IDs)
```

---

## 📝 API Documentation Format

Each endpoint in the documentation includes:

- **Description**: What the endpoint does
- **HTTP Method**: GET, POST, PATCH, DELETE
- **Path**: URL path with parameters
- **Parameters**: Query params, path params, body fields
- **Authentication**: Required auth method
- **Permission**: Required RBAC permission
- **Response**: Example successful response
- **Status Codes**: Possible HTTP status codes
- **Error Examples**: Common error responses
- **Example Request**: curl or Postman example

---

## 🎓 Learning Path

1. **Start**: Import Postman collection
2. **Read**: ADMIN_USERS_API_REFERENCE.md (Overview section)
3. **Test**:
   - List Users endpoint
   - Get User Detail endpoint
4. **Create**: Create User endpoint
5. **Update**: Update User endpoint
6. **Delete**: Delete User endpoint
7. **Bulk**: Bulk Actions endpoints
8. **CSV**: CSV Import workflow (Template → Preview → Import)

---

## 📞 Support

If endpoint returns unexpected error:

1. **Check documentation**: ADMIN_USERS_API_REFERENCE.md
2. **Verify parameters**: Query/body format
3. **Check authentication**: Token validity
4. **Check permissions**: RBAC role assignment
5. **Review error message**: Specific guidance in docs
6. **Check logs**: Server logs for detailed error info

---

## ✅ Verification Checklist

Before deploying to production, verify:

- [ ] All 9 endpoints working
- [ ] Authentication working (token validation)
- [ ] RBAC permissions enforced
- [ ] Pagination working (page, limit params)
- [ ] Filtering working (status, departmentId)
- [ ] Search working (name, email)
- [ ] Sorting working (sortBy, sortOrder)
- [ ] CSV import working (template, preview, import)
- [ ] Error handling working (validation, conflicts)
- [ ] Response format correct (JSON, status codes)
- [ ] Company isolation working (admin sees only own company)
- [ ] Soft delete working (isActive flag)

---

**Document Version**: 1.0.0
**Last Updated**: 01/11/2025
**API Version**: 1.0.0
