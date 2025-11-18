import { logger } from '@/lib/logger'
import { authService, LoginRequest, LoginResponse } from '@/features/app/auth/auth.service'
import { User } from '@/features/app/users/user.model'
import { Company } from '@/features/app/companies/company.model'
import { rbacService } from '@/features/app/rbac/rbac.service'
import { prisma } from '@/lib/database'

/**
 * Backoffice Authentication Service
 *
 * Handles authentication for Super Admins from Valorize HQ
 * Only users with SUPER_ADMIN role from "Valorize HQ" company can access backoffice
 */
export const backofficeAuthService = {
  /**
   * Backoffice login with Super Admin validation
   *
   * @param credentials - User email and password
   * @returns Login response with tokens and user info
   * @throws Error if user is not a Super Admin from Valorize HQ
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      // Step 1: Authenticate with Auth0 (same as regular login)
      const loginResult = await authService.login(credentials)

      logger.info('Backoffice login attempt', {
        email: credentials.email,
        auth0Id: loginResult.user_info.sub,
      })

      // Step 2: Get user from database with company and roles
      const user = await User.findByAuth0Id(loginResult.user_info.sub)

      if (!user) {
        logger.warn('Backoffice login denied - user not found in database', {
          email: credentials.email,
          auth0Id: loginResult.user_info.sub,
        })
        throw new Error('User not found in database')
      }

      // Step 3: Validate user belongs to Valorize HQ company
      const isValorizeHQ = user.companyId === 'valorize-hq-000'

      if (!isValorizeHQ) {
        logger.warn('Backoffice login denied - user not from Valorize HQ', {
          email: credentials.email,
          userId: user.id,
          companyId: user.companyId,
        })
        throw new Error(
          'Access denied: Backoffice access is restricted to Valorize team members',
        )
      }

      // Step 4: Get user roles
      const userRoles = await prisma.userRole.findMany({
        where: { userId: user.id },
        include: { role: true },
      })

      // Step 5: Validate user has Super Admin role
      const hasSuperAdminRole = userRoles.some(
        (userRole) => userRole.role.name === 'Super Administrador',
      )

      if (!hasSuperAdminRole) {
        logger.warn('Backoffice login denied - user does not have Super Admin role', {
          email: credentials.email,
          userId: user.id,
          roles: userRoles.map((ur) => ur.role.name),
        })
        throw new Error(
          'Access denied: Super Admin role required for backoffice access',
        )
      }

      // Step 6: Get company information
      const company = await Company.findById(user.companyId)

      // Step 7: Get user permissions for response
      const userPermissions = await rbacService.getUserPermissions(loginResult.user_info.sub)

      logger.info('Backoffice login successful', {
        email: credentials.email,
        userId: user.id,
        auth0Id: loginResult.user_info.sub,
        company: company?.name,
        roles: userPermissions.roles.map((role) => role.name),
        permissionsCount: userPermissions.permissions.length,
      })

      // Step 8: Return login response with additional backoffice info
      return {
        ...loginResult,
        user_info: {
          ...loginResult.user_info,
          companyName: company?.name,
        },
      }
    } catch (error) {
      logger.error('Backoffice login failed', {
        email: credentials.email,
        error: error instanceof Error ? error.message : String(error),
      })

      // Re-throw the error to be handled by the route
      throw error
    }
  },

  /**
   * Verify backoffice session and get user info
   *
   * @param auth0Id - User's Auth0 ID (already validated by middleware)
   * @returns User info with backoffice-specific data
   * @throws Error if user is not a Super Admin from Valorize HQ
   */
  async verify(auth0Id: string) {
    try {
      // Get user from database with company and roles
      const user = await User.findByAuth0Id(auth0Id)

      if (!user) {
        logger.warn('Backoffice verify failed - user not found in database', {
          auth0Id,
        })
        throw new Error('User not found in database')
      }

      // Validate user belongs to Valorize HQ company
      const isValorizeHQ = user.companyId === 'valorize-hq-000'

      if (!isValorizeHQ) {
        logger.warn('Backoffice verify failed - user not from Valorize HQ', {
          userId: user.id,
          companyId: user.companyId,
        })
        throw new Error(
          'Access denied: Backoffice access is restricted to Valorize team members',
        )
      }

      // Get user roles
      const userRoles = await prisma.userRole.findMany({
        where: { userId: user.id },
        include: { role: true },
      })

      // Validate user has Super Admin role
      const hasSuperAdminRole = userRoles.some(
        (userRole) => userRole.role.name === 'Super Administrador',
      )

      if (!hasSuperAdminRole) {
        logger.warn('Backoffice verify failed - user does not have Super Admin role', {
          userId: user.id,
          roles: userRoles.map((ur) => ur.role.name),
        })
        throw new Error(
          'Access denied: Super Admin role required for backoffice access',
        )
      }

      // Get company information
      const company = await Company.findById(user.companyId)

      // Get user permissions
      const userPermissions = await rbacService.getUserPermissions(auth0Id)

      logger.info('Backoffice session verified', {
        userId: user.id,
        auth0Id,
        email: user.email,
        company: company?.name,
        roles: userPermissions.roles.map((role) => role.name),
      })

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          companyId: user.companyId,
          companyName: company?.name,
          isActive: user.isActive,
          jobTitle: user.jobTitle ?? null,
          department: user.department ?? null,
        },
        roles: userPermissions.roles.map((role) => ({
          id: role.id,
          name: role.name,
          description: role.description,
        })),
        permissions: userPermissions.permissions, // Already an array of strings
      }
    } catch (error) {
      logger.error('Backoffice verify failed', {
        auth0Id,
        error: error instanceof Error ? error.message : String(error),
      })

      throw error
    }
  },
}
