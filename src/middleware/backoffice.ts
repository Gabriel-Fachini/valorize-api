/**
 * @fileoverview Backoffice middleware for Super Admin access control
 *
 * This module provides middleware to restrict access to backoffice routes
 * exclusively to Super Admins from the "Valorize HQ" company.
 *
 * @module middleware/backoffice
 * @requires fastify
 * @requires @/middleware/auth
 * @requires @/lib/logger
 */

import { FastifyReply, FastifyRequest } from 'fastify'
import { getCurrentUser } from '@/middleware/auth'
import { logger } from '@/lib/logger'
import { User } from '@/features/app/users/user.model'
import { prisma } from '@/lib/database'

/**
 * Error thrown when a non-Super Admin tries to access backoffice resources
 */
export class BackofficeAccessDeniedError extends Error {
  statusCode = 403
  code = 'BACKOFFICE_ACCESS_DENIED'

  constructor(message?: string) {
    super(message || 'Access restricted to Valorize backoffice team')
    this.name = 'BackofficeAccessDeniedError'
  }
}

/**
 * Creates a middleware function that requires Super Admin from Valorize HQ.
 *
 * This middleware validates that:
 * 1. User is authenticated (already validated by auth0Middleware)
 * 2. User has SUPER_ADMIN role
 * 3. User belongs to "Valorize HQ" company
 *
 * @function requireSuperAdmin
 * @returns {Function} A Fastify middleware function that performs backoffice access check
 *
 * @example
 * // Protect a backoffice route
 * fastify.get('/backoffice/companies', {
 *   preHandler: [requireSuperAdmin()]
 * }, async (request, reply) => {
 *   // Only Super Admins from Valorize HQ can access this
 * })
 *
 * @throws {BackofficeAccessDeniedError} When user is not a Super Admin or doesn't belong to Valorize HQ
 */
export const requireSuperAdmin = () => {
  /**
   * The actual middleware function that performs the backoffice access check.
   *
   * @async
   * @param {FastifyRequest} request - The Fastify request object containing user authentication data
   * @param {FastifyReply} reply - The Fastify reply object
   * @returns {Promise<void>} Resolves if access is granted, throws error otherwise
   *
   * @throws {BackofficeAccessDeniedError} When access is denied
   */
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const authUser = getCurrentUser(request)

    logger.debug('Checking backoffice access', {
      user: { sub: authUser.sub, email: authUser.email },
    })

    try {
      // Get full user data with company and roles
      const user = await User.findByAuthUserId(authUser.sub)

      if (!user) {
        logger.warn('Backoffice access denied: User not found in database', {
          authUserId: authUser.sub,
        })
        throw new BackofficeAccessDeniedError('User not found')
      }

      // Check if user belongs to Valorize HQ company
      const isValorizeHQ = user.companyId === 'valorize-hq-000'

      if (!isValorizeHQ) {
        logger.warn('Backoffice access denied: User not from Valorize HQ', {
          userId: user.id,
          companyId: user.companyId,
        })
        throw new BackofficeAccessDeniedError(
          'Access restricted to Valorize backoffice team',
        )
      }

      // Get user roles
      const userRoles = await prisma.userRole.findMany({
        where: { userId: user.id },
        include: { role: true },
      })

      // Check if user has Super Admin role
      const hasSuperAdminRole = userRoles.some(
        (userRole) => userRole.role.name === 'Super Administrador',
      )

      if (!hasSuperAdminRole) {
        logger.warn('Backoffice access denied: User does not have Super Admin role', {
          userId: user.id,
          roles: userRoles.map((ur) => ur.role.name),
        })
        throw new BackofficeAccessDeniedError(
          'Super Admin role required for backoffice access',
        )
      }

      logger.info('Backoffice access granted', {
        userId: user.id,
        email: user.email,
        companyId: user.companyId,
      })
    } catch (error) {
      if (error instanceof BackofficeAccessDeniedError) {
        throw error
      }

      logger.error('Error checking backoffice access', {
        error,
        authUserId: authUser.sub,
      })

      throw new BackofficeAccessDeniedError(
        'An error occurred while validating backoffice access',
      )
    }
  }
}
