import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { getAuthUserId } from '@/middleware/auth'
import { authService } from './auth.service'
import { UnauthorizedError } from '@/middleware/error-handler'
import {
  loginSchema,
  adminLoginSchema,
  refreshTokenSchema,
  verifySessionSchema,
  signupSchema,
} from './auth.schemas'
import { logger } from '@/lib/logger'

const authRoutes = async (fastify: FastifyInstance, _options: FastifyPluginOptions) => {
  // Login endpoint
  fastify.post('/login', {
    schema: loginSchema,
  }, async (request, reply) => {
    try {
      const { email, password, access_token, refresh_token } = request.body as {
        email?: string
        password?: string
        access_token?: string
        refresh_token?: string
      }

      if (access_token) {
        const loginResult = await authService.loginWithAccessToken({
          access_token,
          refresh_token,
        })

        return reply.code(200).send({
          success: true,
          data: loginResult,
        })
      }

      if (!email || !password) {
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Either email/password or access_token is required',
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
      const normalizedErrorMessage = errorMessage.toLowerCase()

      // Check if it's an authentication error (wrong credentials)
      if (normalizedErrorMessage.includes('authentication failed') || 
          normalizedErrorMessage.includes('invalid credentials') ||
          normalizedErrorMessage.includes('invalid access token') ||
          normalizedErrorMessage.includes('invalid token issuer') ||
          normalizedErrorMessage.includes('wrong email or password') ||
          normalizedErrorMessage.includes('token has expired') ||
          normalizedErrorMessage.includes('token is missing subject') ||
          normalizedErrorMessage.includes('token verification failed') ||
          normalizedErrorMessage.includes('access_denied')) {
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized',
          message: normalizedErrorMessage.includes('token')
            ? errorMessage
            : 'Invalid email or password',
          statusCode: 401,
        })
      }

      // Check if it's a validation error
      if (normalizedErrorMessage.includes('required')) {
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          message: errorMessage,
          statusCode: 400,
        })
      }

      if (normalizedErrorMessage.includes('user not found in database') ||
          normalizedErrorMessage.includes('authenticated account does not match the provisioned user')) {
        return reply.code(403).send({
          success: false,
          error: 'Forbidden',
          message: 'Access denied. This account is not provisioned in Valorize',
          statusCode: 403,
        })
      }

      if (normalizedErrorMessage.includes('deactivated')) {
        return reply.code(403).send({
          success: false,
          error: 'Forbidden',
          message: errorMessage,
          statusCode: 403,
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

  // Signup endpoint
  fastify.post('/signup', {
    schema: signupSchema,
  }, async (request, reply) => {
    try {
      const { email, name } = request.body as { email: string; name: string }

      if (!email || !name) {
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Email and name are required',
          statusCode: 400,
        })
      }

      const { message } = await authService.signup({ email, name })

      return reply.code(201).send({
        success: true,
        message,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed'

      // Check if it's a user already exists error
      if (errorMessage.toLowerCase().includes('already exists')) {
        return reply.code(409).send({
          success: false,
          error: 'Conflict',
          message: 'User with this email already exists',
          statusCode: 409,
        })
      }

      // Check if it's a validation error
      if (errorMessage.toLowerCase().includes('invalid') || 
          errorMessage.toLowerCase().includes('required') ||
          errorMessage.toLowerCase().includes('validation')) {
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
        message: 'Signup service temporarily unavailable',
        statusCode: 500,
      })
    }
  })

  // Admin login endpoint
  fastify.post('/admin/login', {
    schema: adminLoginSchema,
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

      const adminLoginResult = await authService.adminLogin({ email, password })

      return reply.code(200).send({
        success: true,
        data: adminLoginResult,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Admin authentication failed'

      // Check if it's an access denied error (insufficient permissions)
      if (errorMessage.toLowerCase().includes('access denied') || 
          errorMessage.toLowerCase().includes('admin permissions required')) {
        return reply.code(403).send({
          success: false,
          error: 'Forbidden',
          message: 'Access denied: Admin permissions required',
          statusCode: 403,
        })
      }

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
        message: 'Admin authentication service temporarily unavailable',
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
      const authUserId = getAuthUserId(request)
      const sessionInfo = await authService.getSessionInfo(authUserId, token)
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
            jobTitle: sessionInfo.user.jobTitle ?? null,
            department: sessionInfo.user.department ?? null,
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
