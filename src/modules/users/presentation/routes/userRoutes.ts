import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { getCurrentUser } from '@shared/presentation/middlewares/auth0Middleware'
import { UserService } from '../../application/services/UserService'
import { UserRepositoryImpl } from '../../infrastructure/database/UserRepositoryImpl'

const userRoutes = async (fastify: FastifyInstance, _options: FastifyPluginOptions) => {
  // Initialize service with repository
  const userRepository = new UserRepositoryImpl()
  const userService = new UserService(userRepository)

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
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'number' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'number' },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'number' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const currentUser = getCurrentUser(request)
      const user = await userService.getUserProfile(currentUser.sub)
      
      if (!user) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'User profile not found or account is deactivated',
          statusCode: 404,
        })
      }
      
      return reply.code(200).send({
        success: true,
        data: user.toJSON(),
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      return reply.code(400).send({
        error: 'Bad Request',
        message: errorMessage,
        statusCode: 400,
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
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  }, async () => {
    return {
      status: 'ok',
      module: 'users',
      timestamp: new Date().toISOString(),
    }
  })
}

export default userRoutes 