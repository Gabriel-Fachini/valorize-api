import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { getCurrentUser } from '@/middleware/auth'
import { userService } from './user.service'
import { walletService } from '../wallets/wallet.service'

const userRoutes = async (
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
) => {
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
                authUserId: { type: 'string' },
                email: { type: 'string', format: 'email' },
                name: { type: 'string' },
                avatar: { type: 'string', format: 'uri', nullable: true },
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

  // Update user profile
  fastify.put('/profile', {
    schema: {
      tags: ['Users'],
      description: 'Update current user profile (name and/or avatar)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100 },
          avatar: { type: 'string', format: 'uri' },
        },
        additionalProperties: false,
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                authUserId: { type: 'string' },
                email: { type: 'string', format: 'email' },
                name: { type: 'string' },
                avatar: { type: 'string', format: 'uri', nullable: true },
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
      const { name, avatar } = request.body as { name?: string; avatar?: string }
      
      const updatedUser = await userService.updateUserProfile(currentUser.sub, { name, avatar })
      
      return reply.code(200).send({
        success: true,
        data: updatedUser.toJSON(),
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      if (errorMessage.includes('not found')) {
        return reply.code(404).send({
          error: 'Not Found',
          message: errorMessage,
          statusCode: 404,
        })
      }
      
      return reply.code(400).send({
        error: 'Bad Request',
        message: errorMessage,
        statusCode: 400,
      })
    }
  })

  // Deactivate user account
  fastify.delete('/profile', {
    schema: {
      tags: ['Users'],
      description: 'Deactivate current user account',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
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
      
      await userService.deactivateUser(currentUser.sub)
      
      return reply.code(200).send({
        success: true,
        message: 'User account deactivated successfully',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      if (errorMessage.includes('not found')) {
        return reply.code(404).send({
          error: 'Not Found',
          message: errorMessage,
          statusCode: 404,
        })
      }
      
      return reply.code(400).send({
        error: 'Bad Request',
        message: errorMessage,
        statusCode: 400,
      })
    }
  })

  // Get user balance
  fastify.get(
    '/me/get-my-balance',
    {
      schema: {
        tags: ['Users'],
        description: 'Get current user\'s coin balance',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              complimentBalance: { type: 'number' },
              redeemableBalance: { type: 'number' },
            },
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const currentUser = getCurrentUser(request)
      const user = await userService.getUserProfile(currentUser.sub)
      if (!user) {
        return reply.code(404).send({ message: 'User not found' })
      }

      const balance = await walletService.getUserBalance(user.id)
      return reply.send(balance)
    },
  )

  // Get current user's permissions
  fastify.get('/me/permissions', {
    schema: {
      tags: ['Users'],
      description: 'Get current user permissions for conditional UI rendering',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: { type: 'string' },
            },
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
      },
    },
  }, async (request, reply) => {
    const user = await getCurrentUser(request)
    const { rbacService } = await import('@/features/app/rbac/rbac.service')

    try {
      const result = await rbacService.getUserPermissions(user.authUserId as string)
      
      return reply.send({
        success: true,
        data: result.permissions,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve permissions'
      reply.statusCode = 500
      return {
        error: 'PERMISSIONS_FETCH_ERROR',
        message,
        statusCode: 500,
      }
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
