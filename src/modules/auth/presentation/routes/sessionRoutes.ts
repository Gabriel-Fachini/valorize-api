import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { getCurrentUser } from '@shared/presentation/middlewares/auth0Middleware'
import { SessionService } from '../../application/services/SessionService'
import { AuthService } from '../../application/services/AuthService'
import { UnauthorizedError } from '@shared/presentation/middlewares/errorHandler'
import { loginSchema, refreshTokenSchema, verifySessionSchema } from '../schemas/sessionSchemas'

const sessionRoutes = async (fastify: FastifyInstance, _options: FastifyPluginOptions) => {
  const sessionService = new SessionService()
  const authService = new AuthService()

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
        const validation = sessionService.validateToken(token)
        
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
      const currentUser = getCurrentUser(request)
      const sessionInfo = await sessionService.getSessionInfo(currentUser, token)
      
      return reply.code(200).send({
        success: true,
        data: {
          isValid: sessionInfo.isValid,
          expiresAt: sessionInfo.expiresAt.toISOString(),
          timeRemaining: sessionInfo.timeRemaining,
          timeRemainingFormatted: sessionService.formatTimeRemaining(sessionInfo.timeRemaining),
          needsRefresh: sessionInfo.needsRefresh,
          user: {
            sub: sessionInfo.user.sub,
            email: sessionInfo.user.email,
            email_verified: sessionInfo.user.email_verified,
            name: sessionInfo.user.name,
            picture: sessionInfo.user.picture,
          },
          message: sessionInfo.needsRefresh 
            ? 'Token should be refreshed soon'
            : `Token is valid for ${sessionService.formatTimeRemaining(sessionInfo.timeRemaining)}`,
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
}

export default sessionRoutes
