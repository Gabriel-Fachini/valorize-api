# 🔐 Guide: Getting Logged-in User Permissions

**Endpoint**: `GET /me/permissions`  
**Authentication**: Bearer Token (required)  
**Status Code**: `200 OK` or `500 Internal Server Error`

---

## 📋 Overview

This endpoint allows any authenticated user to get their own system permissions. It's perfect for:

- ✅ Conditional rendering of UI elements
- ✅ Access verification before navigating
- ✅ Showing/hiding buttons and panels
- ✅ Client-side validation

---

## 📡 Request

```bash
curl -X GET http://localhost:3000/me/permissions \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

---

## 📦 Response

### Success (200)

```json
{
  "success": true,
  "data": [
    "roles:read",
    "roles:create",
    "roles:update",
    "users:read",
    "users:update",
    "compliments:create",
    "compliments:read"
  ]
}
```

### Error (500)

```json
{
  "error": "PERMISSIONS_FETCH_ERROR",
  "message": "User not found",
  "statusCode": 500
}
```

---

## 🎯 Using in React

### Custom Hook

```typescript
// hooks/useUserPermissions.ts

import { useState, useEffect } from 'react'

export const useUserPermissions = () => {
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('Token not found')
        }

        const response = await fetch('http://localhost:3000/me/permissions', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (!response.ok) {
          throw new Error('Error loading permissions')
        }

        const data = await response.json()
        setPermissions(data.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [])

  // Helper function to check permission
  const can = (permission: string) => permissions.includes(permission)

  // Function to check multiple permissions
  const canAll = (permissions: string[]) => 
    permissions.every(p => can(p))

  const canAny = (permissions: string[]) => 
    permissions.some(p => can(p))

  return { 
    permissions, 
    loading, 
    error, 
    can,
    canAll,
    canAny
  }
}
```

### Using in Component

```typescript
function MyComponent() {
  const { can, canAll, loading } = useUserPermissions()

  if (loading) return <p>Loading...</p>

  return (
    <div>
      {can('roles:read') && (
        <button>View Roles</button>
      )}

      {canAll(['roles:create', 'roles:update']) && (
        <button>Create and Edit Roles</button>
      )}

      {canAny(['admin', 'manager']) && (
        <AdminPanel />
      )}
    </div>
  )
}
```

---

## 🛡️ PermissionGuard Component

```typescript
// components/PermissionGuard.tsx

interface PermissionGuardProps {
  permission: string | string[]
  requireAll?: boolean
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGuard({
  permission,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { can, loading } = useUserPermissions()

  if (loading) return <div>Loading...</div>

  const permissions = Array.isArray(permission) ? permission : [permission]
  const hasPermission = requireAll
    ? permissions.every(p => can(p))
    : permissions.some(p => can(p))

  return hasPermission ? <>{children}</> : <>{fallback}</>
}

// Usage
<PermissionGuard 
  permission={['roles:read', 'roles:update']}
  requireAll={true}
  fallback={<p>No permission</p>}
>
  <AdminPanel />
</PermissionGuard>
```

---

## 🔄 Refresh Permissions

To refresh permissions (e.g., after login or role change):

```typescript
const { useUserPermissions } = await import('@/hooks/useUserPermissions')
const { updatePermissions } = useUserPermissions()

// Call after login
await updatePermissions()
```

---

## 📊 Available Permissions

See the complete list of permissions at:

- `GET /admin/roles/system/permissions`
- `GET /admin/roles/system/categories`

---

## ⚠️ Considerations

1. **Local Cache**: Permissions are fetched once when the component mounts
2. **Real-time Updates**: If permissions change (e.g., role assigned), you need to reload
3. **Security**: Never use only client-side validation; always validate on the backend
4. **Fallback UI**: Always provide a friendly message when lacking permission

---

## 🧪 Quick Test

```bash
# 1. Login to get token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'

# 2. Use the returned token
export TOKEN="your_token_here"

# 3. Get the permissions
curl -X GET http://localhost:3000/me/permissions \
  -H "Authorization: Bearer $TOKEN"
```

---

**Last updated**: November 3, 2025
