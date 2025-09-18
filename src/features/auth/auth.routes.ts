import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { getAuth0Id } from '@/middleware/auth'
import { authService } from './auth.service'
import { UnauthorizedError } from '@/middleware/error-handler'
import { loginSchema, refreshTokenSchema, verifySessionSchema } from './auth.schemas'
import { logger } from '@/lib/logger'

const authRoutes = async (fastify: FastifyInstance, _options: FastifyPluginOptions) => {
  // Login endpoint
  fastify.post('/login', {
    schema: loginSchema,
  }, async (request, reply) => {
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

      const loginResult = await authService.login({ email, password })

      return reply.code(200).send({
        success: true,
        data: loginResult,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed'

      // Check if it's an authentication error (wrong credentials)
      if (errorMessage.toLowerCase().includes('authentication failed') || 
          errorMessage.toLowerCase().includes('invalid credentials') ||
          errorMessage.toLowerCase().includes('wrong email or password') ||
          errorMessage.toLowerCase().includes('access_denied')) {
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid email or password',
          statusCode: 401,
        })
      }

      // Check if it's a validation error
      if (errorMessage.toLowerCase().includes('invalid') || 
          errorMessage.toLowerCase().includes('required')) {
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          message: errorMessage,
          statusCode: 400,
        })
      }

      // Server or Auth0 service error
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Authentication service temporarily unavailable',
        statusCode: 500,
      })
    }
  })

  // Refresh access token using refresh token
  fastify.post('/refresh', {
    schema: refreshTokenSchema,
  }, async (request, reply) => {
    try {
      const { refresh_token } = request.body as { refresh_token: string }

      if (!refresh_token) {
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Refresh token is required',
          statusCode: 400,
        })
      }

      const refreshResult = await authService.refreshToken(refresh_token)

      return reply.code(200).send({
        success: true,
        data: refreshResult,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed'

      // Check if it's an invalid refresh token error
      if (errorMessage.toLowerCase().includes('invalid') || 
          errorMessage.toLowerCase().includes('expired') ||
          errorMessage.toLowerCase().includes('revoked')) {
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or expired refresh token',
          statusCode: 401,
        })
      }

      return reply.code(400).send({
        success: false,
        error: 'Bad Request',
        message: errorMessage,
        statusCode: 400,
      })
    }
  })

  // Verify token validity and get session info
  fastify.get('/verify', {
    schema: verifySessionSchema,
  }, async (request, reply) => {
    try {      
      const { minimal = false } = request.query as { minimal?: boolean }
      const token = request.headers.authorization?.substring(7) // Remove 'Bearer '
      
      if (!token) {
        throw new UnauthorizedError('Token not found')
      }

      // For minimal mode, use simple token validation
      if (minimal) {
        const validation = authService.validateToken(token)
        
        if (!validation.valid) {
          return reply.code(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'Token is invalid or expired',
            statusCode: 401,
          })
        }

        return reply.code(200).send({
          success: true,
          data: {
            isValid: validation.valid,
            timeRemaining: validation.timeRemaining ?? 0,
            message: validation.expired 
              ? 'Token has expired - please reauthenticate' 
              : 'Token is valid',
          },
        })
      }

      // Full mode - get complete session info
      const auth0Id = getAuth0Id(request)
      const sessionInfo = await authService.getSessionInfo(auth0Id, token)
      logger.debug('sessionInfo', sessionInfo)
      
      return reply.code(200).send({
        success: true,
        data: {
          isValid: sessionInfo.isValid,
          expiresAt: sessionInfo.expiresAt.toISOString(),
          timeRemaining: sessionInfo.timeRemaining,
          timeRemainingFormatted: authService.formatTimeRemaining(sessionInfo.timeRemaining),
          needsRefresh: sessionInfo.needsRefresh,
          user: {
            id: sessionInfo.user.id,
            email: sessionInfo.user.email,
            name: sessionInfo.user.name,
            avatar: sessionInfo.user.avatar,
            companyId: sessionInfo.user.companyId,
            isActive: sessionInfo.user.isActive,
          },
          message: sessionInfo.needsRefresh 
            ? 'Token should be refreshed soon'
            : `Token is valid for ${authService.formatTimeRemaining(sessionInfo.timeRemaining)}`,
        },
      })
    } catch (error) {      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      if (error instanceof UnauthorizedError) {
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized',
          message: errorMessage,
          statusCode: 401,
        })
      }
      
      return reply.code(400).send({
        success: false,
        error: 'Bad Request',
        message: errorMessage,
        statusCode: 400,
      })
    }
  })

  // Get refresh instructions
  fastify.get('/refresh-instructions', {
    schema: {
      tags: ['Authentication'],
      description: 'Get instructions for refreshing tokens',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                endpoint: { type: 'string' },
                instructions: { type: 'string' },
                  requiredFields: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
  }, async (_request, reply) => {
    return reply.code(200).send({
      success: true,
      data: authService.getRefreshInstructions(),
    })
  })

  // Health check for auth module
  fastify.get('/health', {
    schema: {
      tags: ['Authentication'],
      description: 'Auth module health check',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            module: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  }, async () => {
    return {
      status: 'ok',
      module: 'auth',
      timestamp: new Date().toISOString(),
    }
  })
}
export default authRoutes

