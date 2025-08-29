import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { getCurrentUser } from '@shared/presentation/middlewares/auth0Middleware'
import { SessionService } from '../../application/services/SessionService'
import { UnauthorizedError } from '@shared/presentation/middlewares/errorHandler'

const sessionRoutes = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
  // Initialize session service
  const sessionService = new SessionService()

  // Verify token validity and get session info
  fastify.get('/verify', {
    schema: {
      tags: ['Session'],
      description: 'Verify token validity and get session information',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                isValid: { type: 'boolean' },
                expiresAt: { type: 'string', format: 'date-time' },
                timeRemaining: { type: 'number' },
                timeRemainingFormatted: { type: 'string' },
                needsRefresh: { type: 'boolean' },
                user: {
                  type: 'object',
                  properties: {
                    sub: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    email_verified: { type: 'boolean' },
                    name: { type: 'string' },
                    picture: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const currentUser = getCurrentUser(request)
      const token = request.headers.authorization?.substring(7) // Remove 'Bearer '
      
      if (!token) {
        throw new UnauthorizedError('Token not found')
      }

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
            picture: sessionInfo.user.picture
          }
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      if (error instanceof UnauthorizedError) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: errorMessage,
          statusCode: 401
        })
      }
      
      return reply.code(400).send({
        error: 'Bad Request',
        message: errorMessage,
        statusCode: 400
      })
    }
  })

  // Simple token validation without full session info
  fastify.get('/validate', {
    schema: {
      tags: ['Session'],
      description: 'Simple token validation',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                valid: { type: 'boolean' },
                expired: { type: 'boolean' },
                timeRemaining: { type: 'number' },
                message: { type: 'string' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                valid: { type: 'boolean' },
                expired: { type: 'boolean' },
                error: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const token = request.headers.authorization?.substring(7) // Remove 'Bearer '
      
      if (!token) {
        return reply.code(400).send({
          success: false,
          data: {
            valid: false,
            expired: false,
            error: 'No token provided'
          }
        })
      }

      const validation = sessionService.validateToken(token)
      
      if (!validation.valid) {
        return reply.code(400).send({
          success: false,
          data: {
            valid: validation.valid,
            expired: validation.expired,
            error: validation.error
          }
        })
      }

      return reply.code(200).send({
        success: true,
        data: {
          valid: validation.valid,
          expired: validation.expired,
          timeRemaining: validation.timeRemaining || 0,
          message: validation.expired 
            ? 'Token has expired' 
            : `Token is valid. Expires in ${sessionService.formatTimeRemaining(validation.timeRemaining || 0)}`
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token validation failed'
      
      return reply.code(400).send({
        success: false,
        data: {
          valid: false,
          expired: false,
          error: errorMessage
        }
      })
    }
  })

  // Get refresh token instructions
  fastify.get('/refresh-info', {
    schema: {
      tags: ['Session'],
      description: 'Get instructions for token refresh',
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
                  items: { type: 'string' }
                },
                example: {
                  type: 'object',
                  properties: {
                    method: { type: 'string' },
                    url: { type: 'string' },
                    headers: {
                      type: 'object',
                      properties: {
                        'Content-Type': { type: 'string' }
                      }
                    },
                    body: {
                      type: 'object',
                      properties: {
                        grant_type: { type: 'string' },
                        client_id: { type: 'string' },
                        client_secret: { type: 'string' },
                        refresh_token: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const refreshInfo = sessionService.getRefreshInstructions()
      
      return reply.code(200).send({
        success: true,
        data: {
          ...refreshInfo,
          example: {
            method: 'POST',
            url: refreshInfo.endpoint,
            headers: {
              'Content-Type': 'application/json'
            },
            body: {
              grant_type: 'refresh_token',
              client_id: 'YOUR_CLIENT_ID',
              client_secret: 'YOUR_CLIENT_SECRET',
              refresh_token: 'YOUR_REFRESH_TOKEN'
            }
          }
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get refresh info'
      
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: errorMessage,
        statusCode: 500
      })
    }
  })

  // Check if current session needs refresh
  fastify.get('/needs-refresh', {
    schema: {
      tags: ['Session'],
      description: 'Check if current token needs refresh',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                needsRefresh: { type: 'boolean' },
                timeRemaining: { type: 'number' },
                timeRemainingFormatted: { type: 'string' },
                threshold: { type: 'number' },
                message: { type: 'string' }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const currentUser = getCurrentUser(request)
      const token = request.headers.authorization?.substring(7) // Remove 'Bearer '
      
      if (!token) {
        throw new UnauthorizedError('Token not found')
      }

      const sessionInfo = await sessionService.getSessionInfo(currentUser, token)
      const threshold = 5 * 60 // 5 minutes in seconds
      
      return reply.code(200).send({
        success: true,
        data: {
          needsRefresh: sessionInfo.needsRefresh,
          timeRemaining: sessionInfo.timeRemaining,
          timeRemainingFormatted: sessionService.formatTimeRemaining(sessionInfo.timeRemaining),
          threshold,
          message: sessionInfo.needsRefresh 
            ? 'Token should be refreshed soon'
            : `Token is still valid for ${sessionService.formatTimeRemaining(sessionInfo.timeRemaining)}`
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      if (error instanceof UnauthorizedError) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: errorMessage,
          statusCode: 401
        })
      }
      
      return reply.code(400).send({
        error: 'Bad Request',
        message: errorMessage,
        statusCode: 400
      })
    }
  })

  // Health check for session module
  fastify.get('/health', {
    schema: {
      tags: ['Session'],
      description: 'Session module health check',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            module: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, async () => {
    return {
      status: 'ok',
      module: 'session',
      timestamp: new Date().toISOString()
    }
  })
}

export default sessionRoutes
