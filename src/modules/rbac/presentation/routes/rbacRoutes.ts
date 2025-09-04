import { FastifyInstance } from 'fastify'
import { requirePermission, requireRole } from '@shared/presentation/middlewares/rbacMiddleware'

export async function rbacRoutes(fastify: FastifyInstance) {
  // Test routes for RBAC functionality

  // Get current user permissions and roles
  fastify.get('/rbac/me', async (request, reply) => {
    if (!request.currentUser) {
      return reply.status(401).send({ error: 'User not authenticated' })
    }

    if (!request.userPermissions) {
      return reply.status(500).send({ error: 'User permissions not loaded' })
    }

    return {
      user: {
        id: request.currentUser.id,
        name: request.currentUser.name,
        email: request.currentUser.email,
        isActive: request.currentUser.isActive,
      },
      permissions: request.userPermissions.permissions,
      roles: request.userPermissions.roles,
    }
  })

  // Users management routes - require specific permissions
  fastify.get('/rbac/users', {
    preHandler: requirePermission('users', 'read'),
  }, async (request, reply) => {
    const userService = fastify.userService
    const users = await userService.findAll()
    
    return {
      message: 'Users retrieved successfully',
      data: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        createdAt: user.createdAt,
      })),
    }
  })

  // Admin panel access - require admin role
  fastify.get('/rbac/admin/dashboard', {
    preHandler: requireRole('admin'),
  }, async (request, reply) => {
    return {
      message: 'Admin dashboard accessed successfully',
      user: request.currentUser?.name,
      timestamp: new Date().toISOString(),
    }
  })

  // User management admin panel - require specific permission
  fastify.get('/rbac/admin/users', {
    preHandler: requirePermission('admin', 'access'),
  }, async (request, reply) => {
    return {
      message: 'Admin user management panel accessed',
      user: request.currentUser?.name,
      permissions: request.userPermissions?.permissions,
    }
  })

  // System settings - require high-level admin permission
  fastify.get('/rbac/admin/settings', {
    preHandler: requirePermission('admin', 'system_settings'),
  }, async (request, reply) => {
    return {
      message: 'System settings accessed',
      user: request.currentUser?.name,
      warning: 'This requires admin:system_settings permission',
    }
  })

  // Reports access - require reports permission
  fastify.get('/rbac/reports', {
    preHandler: requirePermission('reports', 'read'),
  }, async (request, reply) => {
    return {
      message: 'Reports accessed successfully',
      user: request.currentUser?.name,
      availableReports: [
        'User Activity Report',
        'System Usage Report',
        'Performance Metrics',
      ],
    }
  })

  // Role management routes
  fastify.get('/rbac/roles', {
    preHandler: requirePermission('roles', 'read'),
  }, async (request, reply) => {
    const rbacService = fastify.rbacService
    const roles = await rbacService.getActiveRoles()
    
    return {
      message: 'Roles retrieved successfully',
      data: roles.map(role => role.toJSON()),
    }
  })

  fastify.get('/rbac/permissions', {
    preHandler: requirePermission('permissions', 'read'),
  }, async (request, reply) => {
    const rbacService = fastify.rbacService
    const permissions = await rbacService.getAllPermissions()
    
    return {
      message: 'Permissions retrieved successfully',
      data: permissions.map(permission => permission.toJSON()),
    }
  })

  // Test endpoint that requires multiple roles (OR logic)
  fastify.get('/rbac/admin-or-manager', {
    preHandler: fastify.requireAnyRole(['admin', 'user_manager']),
  }, async (request, reply) => {
    return {
      message: 'Access granted - you have admin or user_manager role',
      user: request.currentUser?.name,
      roles: request.userPermissions?.roles,
    }
  })
}