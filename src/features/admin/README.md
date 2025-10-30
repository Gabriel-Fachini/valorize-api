# Admin Routes Structure

This directory contains the centralized routing structure for all administrative features of the Valorize API.

## 📁 Overview

All administrative routes are now centralized under the `/admin` prefix. This provides:

- **Clear organization** - All admin features in one place
- **Consistent URL structure** - `/admin/*` for all admin endpoints
- **Easy scalability** - Add new admin features in one location
- **Better security context** - Clear separation of admin vs user routes

## 🌐 Route Structure

### Current Admin Routes

```
/admin
├── /dashboard
│   └── /stats              GET  - Dashboard analytics (requires: admin:view_analytics)
└── /rbac
    ├── /create-role        POST - Create role (requires: users:manage_roles)
    ├── /users/:id/assign-role PUT - Assign role (requires: users:manage_roles)
    └── /me/permissions     GET  - Get user permissions
```

### Before vs After

**Before:**
```
❌ /dashboard/stats         - Not clearly an admin route
❌ /admin/create-role       - Inconsistent structure
❌ /admin/users/:id/assign-role
```

**After:**
```
✅ /admin/dashboard/stats
✅ /admin/rbac/create-role
✅ /admin/rbac/users/:id/assign-role
```

## 🚀 Adding New Admin Routes

To add a new admin feature, follow these steps:

### 1. Create your feature route file

Example: `src/features/analytics/analytics.routes.ts`

```typescript
import { FastifyInstance } from 'fastify'
import { requirePermission } from '@/middleware/rbac'
import { PERMISSION } from '@/features/rbac/permissions.constants'

export default async function analyticsRoutes(fastify: FastifyInstance) {
  // GET /admin/analytics/reports
  fastify.get('/reports', {
    preHandler: [requirePermission(PERMISSION.ADMIN_VIEW_ANALYTICS)],
  }, async (request, reply) => {
    // Your logic here
  })
}
```

### 2. Register in admin.routes.ts

Open [admin.routes.ts](./admin.routes.ts) and add:

```typescript
// Analytics routes - /admin/analytics/*
await fastify.register(
  async function (fastify) {
    const { default: analyticsRoutes } = await import('@/features/analytics/analytics.routes')
    await fastify.register(analyticsRoutes)
  },
  { prefix: '/analytics' },
)
```

### 3. That's it!

Your route is now available at `/admin/analytics/reports` 🎉

## 🔒 Security

All routes under `/admin` should:

1. **Require authentication** (handled by global `auth0Middleware`)
2. **Require admin permissions** (use `requirePermission` middleware)
3. **Use typed permissions** from `PERMISSION` constants

### Example Protected Route

```typescript
import { requirePermission } from '@/middleware/rbac'
import { PERMISSION } from '@/features/rbac/permissions.constants'

fastify.get('/sensitive-data', {
  preHandler: [requirePermission(PERMISSION.ADMIN_MANAGE_SYSTEM)],
}, async (request, reply) => {
  // Only super_admin can access this
})
```

## 📊 Current Admin Features

### Dashboard (`/admin/dashboard/*`)
- **Location**: [src/features/dashboard/](../dashboard/)
- **Routes**: Analytics, statistics, company metrics
- **Permission**: `PERMISSION.ADMIN_VIEW_ANALYTICS`

### RBAC (`/admin/rbac/*`)
- **Location**: [src/features/rbac/](../rbac/)
- **Routes**: Role management, permission assignment
- **Permission**: `PERMISSION.USERS_MANAGE_ROLES`

## 🎯 Best Practices

### ✅ Do

- Keep all admin routes under `/admin` prefix
- Use typed `PERMISSION` constants
- Require appropriate admin permissions
- Document your routes in this README
- Follow RESTful conventions

### ❌ Don't

- Create admin routes outside `/admin` prefix
- Use hardcoded permission strings
- Skip permission checks on admin routes
- Mix admin and user routes in the same file

## 🔗 Related Files

- **Main Router**: [src/config/app.ts](../../config/app.ts) - Registers admin routes
- **Admin Aggregator**: [admin.routes.ts](./admin.routes.ts) - Central admin routing
- **Permissions**: [src/features/rbac/permissions.constants.ts](../rbac/permissions.constants.ts)
- **RBAC Middleware**: [src/middleware/rbac.ts](../../middleware/rbac.ts)

## 📝 Migration Notes

If you're migrating existing admin routes:

1. Move route definitions to appropriate feature folder
2. Register in [admin.routes.ts](./admin.routes.ts)
3. Update any frontend API calls to use `/admin` prefix
4. Test all endpoints after migration

## 🆕 Future Admin Features

Ideas for future admin routes to add here:

- `/admin/analytics` - Advanced analytics and reporting
- `/admin/users` - User management dashboard
- `/admin/companies` - Company management
- `/admin/audit` - Audit logs and system monitoring
- `/admin/settings` - System-wide settings
- `/admin/notifications` - Notification management

Each feature should follow the same pattern demonstrated above.
