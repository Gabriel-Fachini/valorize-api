import { FastifyInstance } from 'fastify'
import { RBACService } from '@modules/rbac/application/services/RBACService'
import { RoleRepositoryImpl } from '@modules/rbac/infrastructure/database/RoleRepositoryImpl'
import { PermissionRepositoryImpl } from '@modules/rbac/infrastructure/database/PermissionRepositoryImpl'
import { UserRoleRepositoryImpl, RolePermissionRepositoryImpl } from '@modules/rbac/infrastructure/database/AssignmentRepositoriesImpl'
import { UserService } from '@modules/users/application/services/UserService'
import { UserRepositoryImpl } from '@modules/users/infrastructure/database/UserRepositoryImpl'
import { requirePermission, requireRole, requireAnyRole } from '@shared/presentation/middlewares/rbacMiddleware'
import { logger } from '@shared/infrastructure/logger/Logger'

export async function setupRBAC(fastify: FastifyInstance) {
  try {
    logger.info('Setting up RBAC system...')

    // Create repository instances
    const roleRepository = new RoleRepositoryImpl()
    const permissionRepository = new PermissionRepositoryImpl()
    const userRoleRepository = new UserRoleRepositoryImpl()
    const rolePermissionRepository = new RolePermissionRepositoryImpl()
    const userRepository = new UserRepositoryImpl()

    // Create service instances
    const rbacService = new RBACService(
      roleRepository,
      permissionRepository,
      userRoleRepository,
      rolePermissionRepository,
    )

    const userService = new UserService(userRepository)

    // Register services with Fastify instance for middleware access
    fastify.decorate('rbacService', rbacService)
    fastify.decorate('userService', userService)

    // Register RBAC helper methods
    fastify.decorate('requirePermission', requirePermission)
    fastify.decorate('requireRole', requireRole)
    fastify.decorate('requireAnyRole', requireAnyRole)

    logger.info('RBAC system setup completed successfully')

    return {
      rbacService,
      userService,
    }
  } catch (error) {
    logger.error('Failed to setup RBAC system', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

// Helper function to assign default role to new users
export async function assignDefaultRole(rbacService: RBACService, userId: string): Promise<void> {
  try {
    // Get the default "user" role
    const userRole = await rbacService.getRoleByName('user')
    
    if (!userRole) {
      logger.warn('Default user role not found, skipping role assignment')
      return
    }

    // Check if user already has any roles
    const userRoles = await rbacService.getUserRoles(userId)
    
    if (userRoles.length === 0) {
      // Assign default role
      await rbacService.assignRoleToUser(userId, userRole.id)
      logger.info('Default role assigned to new user', {
        userId,
        roleId: userRole.id,
        roleName: userRole.name,
      })
    }
  } catch (error) {
    logger.error('Failed to assign default role to user', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    })
    // Don't throw error - role assignment failure shouldn't block user creation
  }
}

// Helper function to check if a user has admin access
export async function isUserAdmin(rbacService: RBACService, userId: string): Promise<boolean> {
  try {
    return await rbacService.userHasRole(userId, 'admin')
  } catch (error) {
    logger.error('Error checking if user is admin', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

// Helper function to get user's admin permissions
export async function getUserAdminPermissions(rbacService: RBACService, userId: string): Promise<string[]> {
  try {
    const userPermissions = await rbacService.getUserPermissions(userId)
    
    // Filter for admin-related permissions
    return userPermissions.permissions.filter(permission => 
      permission.startsWith('admin:') || 
      permission.startsWith('users:') ||
      permission.startsWith('roles:') ||
      permission.startsWith('permissions:')
    )
  } catch (error) {
    logger.error('Error getting user admin permissions', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    })
    return []
  }
}