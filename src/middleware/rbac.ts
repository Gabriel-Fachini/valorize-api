/**
 * @fileoverview RBAC (Role-Based Access Control) middleware for Fastify routes
 * 
 * This module provides middleware functions to enforce permission-based access control
 * on API endpoints. It integrates with the authentication system to verify that the
 * current user has the required permissions to access specific resources or perform
 * certain actions.
 * 
 * @module middleware/rbac
 * @requires fastify
 * @requires @/middleware/error-handler
 * @requires @/middleware/auth
 * @requires ../features/rbac/rbac.service
 * @requires @/lib/logger
 */

import { FastifyReply, FastifyRequest } from 'fastify'
import { InsufficientPermissionError } from '@/middleware/error-handler'
import { getCurrentUser } from '@/middleware/auth'
import { rbacService } from '../features/app/rbac/rbac.service'
import { logger } from '@/lib/logger'

/**
 * Creates a middleware function that requires a specific permission for route access.
 * 
 * This higher-order function returns a Fastify middleware that checks if the authenticated
 * user has the specified permission. If the user lacks the required permission, it throws
 * an InsufficientPermissionError with detailed information about the user's current
 * permissions and the required permission.
 * 
 * @function requirePermission
 * @param {string} permission - The permission string required to access the route (e.g., 'users:read', 'admin:manage')
 * @returns {Function} A Fastify middleware function that performs the permission check
 * 
 * @example
 * // Protect a route that requires 'users:read' permission
 * fastify.get('/users', { preHandler: requirePermission('users:read') }, async (request, reply) => {
 *   // Route handler code
 * })
 * 
 * @example
 * // Protect an admin route
 * fastify.delete('/admin/users/:id', { 
 *   preHandler: requirePermission('admin:delete_user') 
 * }, async (request, reply) => {
 *   // Admin route handler code
 * })
 * 
 * @throws {InsufficientPermissionError} When the user doesn't have the required permission
 * 
 * @see {@link rbacService.checkPermissionWithDetails} For the underlying permission check logic
 * @see {@link getCurrentUser} For user authentication retrieval
 * @see {@link InsufficientPermissionError} For the error thrown when access is denied
 */
export const requirePermission = (permission: string) => {
  /**
   * The actual middleware function that performs the permission check.
   * 
   * @async
   * @param {FastifyRequest} request - The Fastify request object containing user authentication data
   * @param {FastifyReply} _reply - The Fastify reply object (unused in this middleware)
   * @returns {Promise<void>} Resolves if permission check passes, throws error otherwise
   * 
   * @throws {InsufficientPermissionError} When the user lacks the required permission
   */
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const user = getCurrentUser(request)
    logger.debug('Checking permission', { user: { sub: user.sub }, permission })
    
    const { allowed, userPermissions } = await rbacService.checkPermissionWithDetails(user.sub, permission)
    
    logger.debug('Permission check result', { 
      allowed, 
      permission,
      userPermissionsCount: userPermissions.length,
    })
    
    if (!allowed) {
      throw new InsufficientPermissionError(
        permission,
        userPermissions,
        `Access denied. You need the '${permission}' permission to perform this action.`,
      )
    }
  }
}
