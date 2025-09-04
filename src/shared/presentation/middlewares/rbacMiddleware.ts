import { FastifyRequest, FastifyReply } from 'fastify'
import { RBACService } from '@modules/rbac/application/services/RBACService'
import { UserService } from '@modules/users/application/services/UserService'
import { getCurrentUser } from './auth0Middleware'
import { UnauthorizedError, ForbiddenError } from './errorHandler'
import { logger } from '@shared/infrastructure/logger/Logger'

// RBAC middleware factory function
export const requirePermission = (resource: string, action: string) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      // Get the authenticated user from Auth0 middleware
      const authenticatedUser = getCurrentUser(request)
      
      // Get RBAC and User services from Fastify instance
      const rbacService = request.server.rbacService as RBACService
      const userService = request.server.userService as UserService

      if (!rbacService) {
        logger.error('RBAC service not available')
        throw new Error('RBAC service not configured')
      }

      if (!userService) {
        logger.error('User service not available')
        throw new Error('User service not configured')
      }

      // Get the user from database using Auth0 ID
      const user = await userService.findByAuth0Id(authenticatedUser.sub)
      if (!user) {
        logger.warn('User not found in database', { auth0Id: authenticatedUser.sub })
        throw new UnauthorizedError('User not found in system')
      }

      if (!user.isActive) {
        logger.warn('Inactive user attempted access', { userId: user.id, auth0Id: authenticatedUser.sub })
        throw new UnauthorizedError('User account is inactive')
      }

      // Check if user has the required permission
      const hasPermission = await rbacService.userHasPermission(user.id, resource, action)

      if (!hasPermission) {
        logger.warn('User access denied - insufficient permissions', {
          userId: user.id,
          auth0Id: authenticatedUser.sub,
          requiredPermission: `${resource}:${action}`,
          userRoles: (await rbacService.getUserPermissions(user.id)).roles,
        })
        throw new ForbiddenError(`Insufficient permissions. Required: ${resource}:${action}`)
      }

      logger.debug('User permission check passed', {
        userId: user.id,
        auth0Id: authenticatedUser.sub,
        permission: `${resource}:${action}`,
      })

      // Attach user and permissions to request for use in handlers
      request.currentUser = user
      request.userPermissions = await rbacService.getUserPermissions(user.id)

    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
        throw error
      }

      logger.error('Error in RBAC permission check', {
        resource,
        action,
        error: error instanceof Error ? error.message : String(error),
      })

      throw new ForbiddenError('Permission check failed')
    }
  }
}

// RBAC middleware factory function for role checking
export const requireRole = (roleName: string) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      // Get the authenticated user from Auth0 middleware
      const authenticatedUser = getCurrentUser(request)
      
      // Get RBAC and User services from Fastify instance
      const rbacService = request.server.rbacService as RBACService
      const userService = request.server.userService as UserService

      if (!rbacService || !userService) {
        throw new Error('RBAC or User service not configured')
      }

      // Get the user from database using Auth0 ID
      const user = await userService.findByAuth0Id(authenticatedUser.sub)
      if (!user) {
        throw new UnauthorizedError('User not found in system')
      }

      if (!user.isActive) {
        throw new UnauthorizedError('User account is inactive')
      }

      // Check if user has the required role
      const hasRole = await rbacService.userHasRole(user.id, roleName)

      if (!hasRole) {
        logger.warn('User access denied - missing role', {
          userId: user.id,
          auth0Id: authenticatedUser.sub,
          requiredRole: roleName,
          userRoles: (await rbacService.getUserPermissions(user.id)).roles,
        })
        throw new ForbiddenError(`Insufficient permissions. Required role: ${roleName}`)
      }

      logger.debug('User role check passed', {
        userId: user.id,
        auth0Id: authenticatedUser.sub,
        role: roleName,
      })

      // Attach user and permissions to request for use in handlers
      request.currentUser = user
      request.userPermissions = await rbacService.getUserPermissions(user.id)

    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
        throw error
      }

      logger.error('Error in RBAC role check', {
        roleName,
        error: error instanceof Error ? error.message : String(error),
      })

      throw new ForbiddenError('Role check failed')
    }
  }
}

// RBAC middleware factory function for multiple roles (OR logic)
export const requireAnyRole = (roleNames: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      // Get the authenticated user from Auth0 middleware
      const authenticatedUser = getCurrentUser(request)
      
      // Get RBAC and User services from Fastify instance
      const rbacService = request.server.rbacService as RBACService
      const userService = request.server.userService as UserService

      if (!rbacService || !userService) {
        throw new Error('RBAC or User service not configured')
      }

      // Get the user from database using Auth0 ID
      const user = await userService.findByAuth0Id(authenticatedUser.sub)
      if (!user) {
        throw new UnauthorizedError('User not found in system')
      }

      if (!user.isActive) {
        throw new UnauthorizedError('User account is inactive')
      }

      // Check if user has any of the required roles
      const hasAnyRole = await rbacService.userHasAnyRole(user.id, roleNames)

      if (!hasAnyRole) {
        logger.warn('User access denied - missing required roles', {
          userId: user.id,
          auth0Id: authenticatedUser.sub,
          requiredRoles: roleNames,
          userRoles: (await rbacService.getUserPermissions(user.id)).roles,
        })
        throw new ForbiddenError(`Insufficient permissions. Required one of: ${roleNames.join(', ')}`)
      }

      logger.debug('User any-role check passed', {
        userId: user.id,
        auth0Id: authenticatedUser.sub,
        requiredRoles: roleNames,
      })

      // Attach user and permissions to request for use in handlers
      request.currentUser = user
      request.userPermissions = await rbacService.getUserPermissions(user.id)

    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
        throw error
      }

      logger.error('Error in RBAC any-role check', {
        roleNames,
        error: error instanceof Error ? error.message : String(error),
      })

      throw new ForbiddenError('Role check failed')
    }
  }
}