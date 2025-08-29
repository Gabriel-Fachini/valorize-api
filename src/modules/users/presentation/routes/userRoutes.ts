import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { getCurrentUser } from '@shared/presentation/middlewares/auth0Middleware'
import { UserService, CallbackRequest } from '../../application/services/UserService'
import { UserRepositoryImpl } from '../../infrastructure/database/UserRepositoryImpl'

const userRoutes = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
  // Initialize service with repository
  const userRepository = new UserRepositoryImpl()
  const userService = new UserService(userRepository)

  // Login route - handles user login and profile sync
  fastify.post('/login', {
    schema: {
      tags: ['Authentication'],
      description: 'Generate Auth0 authorization URL for login',
      body: {
        type: 'object',
        required: ['redirectUri'],
        properties: {
          redirectUri: { 
            type: 'string', 
            format: 'uri',
            description: 'Callback URL where Auth0 will redirect after authentication'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                authorizeUrl: { type: 'string', format: 'uri' },
                state: { type: 'string' }
              }
            }
          }
        },
        400: {
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
      const { redirectUri } = request.body as { redirectUri: string }
      
      const result = await userService.generateAuthorizationUrl(redirectUri)
      
      return reply.code(200).send({
        success: true,
        message: 'Authorization URL generated successfully',
        data: {
          authorizeUrl: result.authorizeUrl,
          state: result.state
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      return reply.code(400).send({
        error: 'Bad Request',
        message: errorMessage,
        statusCode: 400
      })
    }
  })

  // Handle Auth0 callback and exchange code for token
  fastify.post('/auth/callback', {
    schema: {
      tags: ['Authentication'],
      description: 'Exchange authorization code for access token',
      body: {
        type: 'object',
        required: ['code', 'state', 'redirectUri'],
        properties: {
          code: { 
            type: 'string',
            description: 'Authorization code from Auth0'
          },
          state: { 
            type: 'string',
            description: 'State parameter for CSRF protection'
          },
          redirectUri: { 
            type: 'string', 
            format: 'uri',
            description: 'Same redirect URI used in authorization request'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                access_token: { type: 'string' },
                token_type: { type: 'string' },
                expires_in: { type: 'number' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    auth0Id: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    name: { type: 'string' },
                    isActive: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                  }
                },
                lastLoginAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        400: {
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
      const { code, state, redirectUri } = request.body as CallbackRequest & { redirectUri: string }
      
      const result = await userService.exchangeCodeForToken({ code, state }, redirectUri)
      
      return reply.code(200).send({
        success: true,
        message: 'Login successful',
        data: {
          access_token: result.access_token,
          token_type: result.token_type,
          expires_in: result.expires_in,
          user: result.user.toJSON(),
          lastLoginAt: result.lastLoginAt.toISOString()
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      if (errorMessage.includes('Invalid or expired authorization code')) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Invalid or expired authorization code',
          statusCode: 400
        })
      }
      
      if (errorMessage.includes('Invalid client configuration')) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Invalid client configuration',
          statusCode: 400
        })
      }
      
      return reply.code(400).send({
        error: 'Bad Request',
        message: errorMessage,
        statusCode: 400
      })
    }
  })

  // Get current user profile - Updated to use UserService
  fastify.get('/profile', {
    schema: {
      tags: ['Users'],
      description: 'Get current user profile',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                auth0Id: { type: 'string' },
                email: { type: 'string', format: 'email' },
                name: { type: 'string' },
                isActive: { type: 'boolean' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
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
        },
        404: {
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
      const user = await userService.getUserProfile(currentUser.sub)
      
      if (!user) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'User profile not found or account is deactivated',
          statusCode: 404
        })
      }
      
      return reply.code(200).send({
        success: true,
        data: user.toJSON()
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      return reply.code(400).send({
        error: 'Bad Request',
        message: errorMessage,
        statusCode: 400
      })
    }
  })

  // Health check for users module
  fastify.get('/health', {
    schema: {
      tags: ['Users'],
      description: 'Users module health check',
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
      module: 'users',
      timestamp: new Date().toISOString()
    }
  })
}

export default userRoutes 