import { FastifyInstance } from 'fastify'
import { rbacService } from './rbac.service'
import { requirePermission } from '../../middleware/rbac'
import { User } from '@/features/users/user.model'
import { getCurrentUser } from '@/middleware/auth'
import { createRoleSchema, assignRoleToUserSchema, getUserPermissionsSchema } from './rbac.schemas'

export default async function rbacRoutes(fastify: FastifyInstance) {
  fastify.post('/create-role', {
    preHandler: [requirePermission('users:manage_roles')],
    schema: createRoleSchema,
  }, async (request, reply) => {
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

  fastify.put('/users/:id/assign-role', {
    preHandler: [requirePermission('users:manage_roles')],
    schema: assignRoleToUserSchema,
  }, async (request, reply) => {
      const { id } = request.params as { id: string }
      const { roleId } = request.body as { roleId: string }
      await rbacService.assignRoleToUser(id, roleId)
      return reply.code(200).send({ success: true })
    },
  )

  // Get current user permissions
  fastify.get('/me/permissions', {
    schema: getUserPermissionsSchema,
  }, async (request, reply) => {
      const user = getCurrentUser(request)
      const userPermissions = await rbacService.getUserPermissions(user.sub)
      
      return reply.code(200).send({
        success: true,
        data: userPermissions,
      })
    },
  )
}
