import { FastifyInstance } from 'fastify'
import { rbacService } from './rbac.service'
import { requirePermission } from './rbac.middleware'
import { User } from '@/features/users/user.model'
import { getCurrentUser } from '@/middleware/auth'

export default async function rbacRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/roles',
    {
      preHandler: [requirePermission('users:manage_roles')],
      schema: {
        tags: ['RBAC'],
        description: 'Create role',
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            permissions: { type: 'array', items: { type: 'string' } },
          },
          additionalProperties: false,
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  permissions: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const user = getCurrentUser(request)
      const dbUser = await User.findByAuth0Id(user.sub)
      if (!dbUser) {
        throw new Error('User not found')
      }
      const { name, description, permissions = [] } = request.body as {
        name: string
        description?: string
        permissions?: string[]
      }
      const role = await rbacService.createRole(
        dbUser.companyId,
        name,
        permissions,
        description,
      )
      return reply.code(201).send({
        success: true,
        data: {
          id: role.id,
          name: role.name,
          description: role.description,
          permissions: role.permissions.map(rp => rp.permission.name),
        },
      })
    },
  )

  fastify.put(
    '/users/:id/roles',
    {
      preHandler: [requirePermission('users:manage_roles')],
      schema: {
        tags: ['RBAC'],
        description: 'Assign role to user',
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        body: {
          type: 'object',
          required: ['roleId'],
          properties: { roleId: { type: 'string' } },
          additionalProperties: false,
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { roleId } = request.body as { roleId: string }
      await rbacService.assignRoleToUser(id, roleId)
      return reply.code(200).send({ success: true })
    },
  )
}
