import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { backofficeAuthService } from './backoffice-auth.service'
import { backofficeLoginSchema, backofficeVerifySchema } from './backoffice-auth.schemas'
import { logger } from '@/lib/logger'
import { getAuthUserId } from '@/middleware/auth'

/**
 * Backoffice Authentication Routes
 *
 * Handles authentication for Super Admins from Valorize HQ
 * All routes under /backoffice/auth are public (no auth middleware required)
 */
export const backofficeAuthRoutes = async (
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
) => {
  /**
   * POST /backoffice/auth/login
   *
   * Backoffice login endpoint for Super Admins
   * Validates:
   * - User credentials via Auth0
   * - User has SUPER_ADMIN role
   * - User belongs to "Valorize HQ" company
   */
  fastify.post(
    '/login',
    {
      schema: backofficeLoginSchema,
    },
    async (request, reply) => {
      try {
        const { email, password } = request.body as { email: string; password: string }

        if (!email || !password) {
          return reply.code(400).send({
            success: false,
            error: 'Bad Request',
            message: 'Email and password are required',
            statusCode: 400,
          })
        }

        logger.info('Backoffice login attempt', { email })

        const backofficeLoginResult = await backofficeAuthService.login({
          email,
          password,
        })

        logger.info('Backoffice login successful', { email })

        return reply.code(200).send({
          success: true,
          data: backofficeLoginResult,
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Backoffice authentication failed'

        logger.error('Backoffice login failed', {
          email: (request.body as { email?: string })?.email,
          error: errorMessage,
        })

        // Access denied errors (insufficient permissions or wrong company)
        if (
          errorMessage.toLowerCase().includes('access denied') ||
          errorMessage.toLowerCase().includes('restricted to valorize') ||
          errorMessage.toLowerCase().includes('super admin role required')
        ) {
          return reply.code(403).send({
            success: false,
            error: 'Forbidden',
            message: errorMessage,
            statusCode: 403,
          })
        }

        // Authentication errors (wrong credentials)
        if (
          errorMessage.toLowerCase().includes('authentication failed') ||
          errorMessage.toLowerCase().includes('invalid credentials') ||
          errorMessage.toLowerCase().includes('wrong email or password') ||
          errorMessage.toLowerCase().includes('access_denied')
        ) {
          return reply.code(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'Invalid email or password',
            statusCode: 401,
          })
        }

        // User not found errors
        if (errorMessage.toLowerCase().includes('user not found')) {
          return reply.code(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'Invalid email or password',
            statusCode: 401,
          })
        }

        // Validation errors
        if (
          errorMessage.toLowerCase().includes('invalid') ||
          errorMessage.toLowerCase().includes('required')
        ) {
          return reply.code(400).send({
            success: false,
            error: 'Bad Request',
            message: errorMessage,
            statusCode: 400,
          })
        }

        // Server or Auth0 service errors
        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Backoffice authentication service temporarily unavailable',
          statusCode: 500,
        })
      }
    },
  )

  /**
   * GET /backoffice/auth/verify
   *
   * Verify backoffice session and get user info
   * Used for checking if user is still logged in (e.g., on page reload)
   * Requires valid JWT token in Authorization header
   */
  fastify.get(
    '/verify',
    {
      schema: backofficeVerifySchema,
    },
    async (request, reply) => {
      try {
        const authUserId = getAuthUserId(request)

        logger.debug('Backoffice verify attempt', { authUserId })

        const sessionInfo = await backofficeAuthService.verify(authUserId)

        logger.info('Backoffice session verified', {
          userId: sessionInfo.user.id,
          email: sessionInfo.user.email,
        })

        return reply.code(200).send({
          success: true,
          data: sessionInfo,
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Session verification failed'

        logger.error('Backoffice verify failed', {
          error: errorMessage,
        })

        // Access denied errors (user not Super Admin or not from Valorize HQ)
        if (
          errorMessage.toLowerCase().includes('access denied') ||
          errorMessage.toLowerCase().includes('restricted to valorize') ||
          errorMessage.toLowerCase().includes('super admin role required')
        ) {
          return reply.code(403).send({
            success: false,
            error: 'Forbidden',
            message: errorMessage,
            statusCode: 403,
          })
        }

        // User not found errors
        if (errorMessage.toLowerCase().includes('user not found')) {
          return reply.code(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'Session expired or invalid',
            statusCode: 401,
          })
        }

        // Generic unauthorized error
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or expired session',
          statusCode: 401,
        })
      }
    },
  )
}
