# RBAC System - Permissions and Roles

This directory contains the centralized RBAC (Role-Based Access Control) system for the Valorize API.

## 📁 Architecture

### Centralized Constants (✨ New!)

All permissions and roles are now defined in **centralized constant files** that serve as the single source of truth for the entire application:

- **[permissions.constants.ts](./permissions.constants.ts)** - All permission definitions
- **[roles.constants.ts](./roles.constants.ts)** - All role definitions with their permission mappings

### Benefits

✅ **Type Safety** - TypeScript catches typos at compile time
✅ **Autocomplete** - IDE suggestions for all permissions
✅ **Single Source of Truth** - One place to manage all permissions
✅ **Easy Refactoring** - Change once, update everywhere
✅ **Self-Documenting** - Permissions grouped by category

## 🎯 Usage

### Using Permissions in Routes

**❌ Old Way (Deprecated):**
```typescript
import { requirePermission } from '@/middleware/rbac'

// Using hardcoded strings (prone to typos!)
fastify.get('/stats', {
  preHandler: [requirePermission('admin:view_analytics')]
}, async (request, reply) => {
  // ...
})
```

**✅ New Way (Recommended):**
```typescript
import { requirePermission } from '@/middleware/rbac'
import { PERMISSION } from '@/features/rbac/permissions.constants'

// Using typed constants (autocomplete + type checking!)
fastify.get('/stats', {
  preHandler: [requirePermission(PERMISSION.ADMIN_VIEW_ANALYTICS)]
}, async (request, reply) => {
  // ...
})
```

### Using Roles in Code

```typescript
import { ROLE, getRolePermissions } from '@/features/rbac/roles.constants'

// Get all permissions for a role
const adminPermissions = getRolePermissions(ROLE.COMPANY_ADMIN)

// Check if a role has a permission
import { roleHasPermission } from '@/features/rbac/roles.constants'
import { PERMISSION } from '@/features/rbac/permissions.constants'

const canViewAnalytics = roleHasPermission(
  ROLE.HR_MANAGER,
  PERMISSION.ADMIN_VIEW_ANALYTICS
) // true
```

### Helper Functions

#### Permissions

```typescript
import {
  isValidPermission,
  getPermissionDefinition,
  getPermissionsByCategory,
  getAllCategories,
  PERMISSION
} from '@/features/rbac/permissions.constants'

// Validate a permission string
if (isValidPermission('users:read')) {
  // Safe to use
}

// Get permission metadata
const permission = getPermissionDefinition(PERMISSION.ADMIN_VIEW_ANALYTICS)
console.log(permission)
// {
//   name: 'admin:view_analytics',
//   description: 'View system analytics and reports',
//   category: 'Administration'
// }

// Get all permissions by category
const adminPerms = getPermissionsByCategory('Administration')

// Get all categories
const categories = getAllCategories()
// ['User Management', 'Role Management', 'Administration', ...]
```

#### Roles

```typescript
import {
  isValidRole,
  getRoleDefinition,
  getRolePermissions,
  roleHasPermission,
  getRolesWithPermission,
  ROLE
} from '@/features/rbac/roles.constants'

// Validate a role string
if (isValidRole('company_admin')) {
  // Safe to use
}

// Get role metadata
const role = getRoleDefinition(ROLE.COMPANY_ADMIN)
console.log(role)
// {
//   name: 'company_admin',
//   description: 'Company administrator with full company access',
//   permissions: [...]
// }

// Get all roles that have a specific permission
const rolesWithAnalytics = getRolesWithPermission(PERMISSION.ADMIN_VIEW_ANALYTICS)
// Returns: [super_admin, company_admin, hr_manager]
```

## 📝 Available Permissions

### User Management
- `PERMISSION.USERS_READ` - View user information
- `PERMISSION.USERS_CREATE` - Create new users
- `PERMISSION.USERS_UPDATE` - Update user information
- `PERMISSION.USERS_DELETE` - Delete users
- `PERMISSION.USERS_MANAGE_ROLES` - Assign and remove user roles

### Role Management
- `PERMISSION.ROLES_READ` - View roles and permissions
- `PERMISSION.ROLES_CREATE` - Create new roles
- `PERMISSION.ROLES_UPDATE` - Update existing roles
- `PERMISSION.ROLES_DELETE` - Delete roles
- `PERMISSION.ROLES_MANAGE_PERMISSIONS` - Assign permissions to roles

### Administration
- `PERMISSION.ADMIN_ACCESS_PANEL` - Access administrative panel
- `PERMISSION.ADMIN_VIEW_ANALYTICS` - View system analytics and reports
- `PERMISSION.ADMIN_MANAGE_COMPANY` - Manage company settings
- `PERMISSION.ADMIN_MANAGE_SYSTEM` - Manage system-wide settings
- `PERMISSION.COMPANY_MANAGE_SETTINGS` - Manage company-specific settings

### Praise System
- `PERMISSION.PRAISE_SEND` - Send praise to colleagues
- `PERMISSION.PRAISE_VIEW_ALL` - View all praise in company
- `PERMISSION.PRAISE_MODERATE` - Moderate and manage praise

### Coins System
- `PERMISSION.COINS_VIEW_BALANCE` - View coin balance
- `PERMISSION.COINS_TRANSFER` - Transfer coins to others
- `PERMISSION.COINS_MANAGE_SYSTEM` - Manage coin system settings

### Store System
- `PERMISSION.STORE_VIEW_CATALOG` - View prize catalog
- `PERMISSION.STORE_REDEEM_PRIZES` - Redeem prizes with coins
- `PERMISSION.STORE_MANAGE_CATALOG` - Manage prize catalog

### Library System
- `PERMISSION.LIBRARY_VIEW_BOOKS` - View book library
- `PERMISSION.LIBRARY_RATE_BOOKS` - Rate and review books
- `PERMISSION.LIBRARY_MANAGE_CATALOG` - Manage book catalog

## 👥 Available Roles

### Super Admin (`ROLE.SUPER_ADMIN`)
**All permissions** - Full system access

### Company Admin (`ROLE.COMPANY_ADMIN`)
Full company management access (cannot delete users or manage system settings)

### HR Manager (`ROLE.HR_MANAGER`)
User management and analytics access

### Team Lead (`ROLE.TEAM_LEAD`)
Limited administrative access for team leaders

### Employee (`ROLE.EMPLOYEE`)
Basic employee access

## 🔄 Migration Guide

If you have existing code using hardcoded permission strings:

1. Import the constants:
   ```typescript
   import { PERMISSION } from '@/features/rbac/permissions.constants'
   ```

2. Replace strings with constants:
   ```typescript
   // Before
   requirePermission('admin:view_analytics')

   // After
   requirePermission(PERMISSION.ADMIN_VIEW_ANALYTICS)
   ```

3. TypeScript will catch any typos or invalid permissions at compile time!

## 🛠️ Adding New Permissions

1. Add the permission to [permissions.constants.ts](./permissions.constants.ts):
   ```typescript
   export const PERMISSION = {
     // ... existing permissions
     NEW_FEATURE_ACTION: 'new_feature:action',
   } as const
   ```

2. Add it to the `ALL_PERMISSIONS` array with metadata:
   ```typescript
   {
     name: PERMISSION.NEW_FEATURE_ACTION,
     description: 'Description of what this permission allows',
     category: 'Feature Category',
   }
   ```

3. Add it to relevant roles in [roles.constants.ts](./roles.constants.ts)

4. Run the seed to update the database:
   ```bash
   npm run db:seed
   ```

## 🔗 Related Files

- **Middleware**: [middleware/rbac.ts](../../middleware/rbac.ts) - Permission checking middleware
- **Service**: [rbac.service.ts](./rbac.service.ts) - RBAC business logic
- **Routes**: [rbac.routes.ts](./rbac.routes.ts) - RBAC management endpoints
- **Seed Data**: [lib/seed/data/](../../lib/seed/data/) - Database seeding (deprecated, now re-exports from constants)
