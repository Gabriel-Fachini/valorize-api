import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { getCurrentUser } from '@shared/presentation/middlewares/auth0Middleware'

const userRoutes = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
  // Get current user profile
  fastify.get('/profile', {
    schema: {
      tags: ['Users'],
      description: 'Get current user profile',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
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
    // For now, we'll just return the Auth0 user info
    // Later, this will be connected to the actual user service
    const currentUser = getCurrentUser(request)
    
    return {
      id: currentUser.sub, // Using Auth0 sub as temporary ID
      auth0Id: currentUser.sub,
      email: currentUser.email || '',
      name: currentUser.name || '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
  }, async (request, reply) => {
    return {
      status: 'ok',
      module: 'users',
      timestamp: new Date().toISOString()
    }
  })
}

export default userRoutes 