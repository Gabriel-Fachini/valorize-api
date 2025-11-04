/**
 * @fileoverview Roles Management API Routes
 *
 * RESTful API endpoints for managing roles and permissions within companies.
 * All endpoints enforce multi-tenancy using company ID from authenticated user.
 *
 * Base path: /admin/roles
 *
 * @module features/admin/roles-management/routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { rolesManagementService } from './roles-management.service'
import { requirePermission } from '@/middleware/rbac'
import { PERMISSION } from '@/features/rbac/permissions.constants'
import { getAuth0Id } from '@/middleware/auth'
import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import {
  listRolesSchema,
  getRoleSchema,
  createRoleSchema,
  updateRoleSchema,
  deleteRoleSchema,
  getRolePermissionsSchema,
  setRolePermissionsSchema,
  addRolePermissionsSchema,
  removeRolePermissionsSchema,
  listAllPermissionsSchema,
  listPermissionCategoriesSchema,
  getUserRolesSchema,
  assignRoleToUserSchema,
  removeRoleFromUserSchema,
  listCompanyUsersSchema,
} from './roles-management.schemas'

/**
 * Get company ID from authenticated user
 */
async function getCompanyIdFromUser(auth0Id: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { auth0Id },
    select: { companyId: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return user.companyId
}

export default async function rolesManagementRoutes(fastify: FastifyInstance) {
  // =========================================================================
  // CURRENT USER PERMISSIONS AND ROLES (ADMIN)
  // =========================================================================

  /**
   * GET /admin/roles/me
   * Get current admin user's permissions and roles
   * Allows an admin to see their own permissions and roles
   */
  fastify.get(
    '/me',
    {
      preHandler: [requirePermission(PERMISSION.ROLES_READ)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const auth0Id = getAuth0Id(request)
      const { rbacService } = await import('@/features/rbac/rbac.service')

      const userPermissions = await rbacService.getUserPermissions(auth0Id)

      logger.info('Admin retrieved own permissions', { auth0Id })

      return reply.code(200).send({
        success: true,
        data: userPermissions,
      })
    },
  )

  // =========================================================================
  // ROLES - LIST AND DETAIL
  // =========================================================================

  /**
   * GET /admin/roles
   * List all roles for the authenticated user's company
   */
  fastify.get(
    '/',
    {
      preHandler: [requirePermission(PERMISSION.ROLES_READ)],
      schema: listRolesSchema,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const auth0Id = getAuth0Id(request)
      const companyId = await getCompanyIdFromUser(auth0Id)

      const filters = {
        search: (request.query as Record<string, unknown>).search as string | undefined,
        sortBy: ((request.query as Record<string, unknown>).sortBy as string | undefined) as
          | 'name'
          | 'createdAt'
          | 'usersCount'
          | 'permissionsCount'
          | undefined,
        sortOrder: ((request.query as Record<string, unknown>).sortOrder as string | undefined) as
          | 'asc'
          | 'desc'
          | undefined,
        page: parseInt((request.query as Record<string, unknown>).page as string) || 1,
        limit: parseInt((request.query as Record<string, unknown>).limit as string) || 10,
      }

      const result = await rolesManagementService.listRoles(companyId, filters)

      return reply.code(200).send({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          hasNextPage: result.hasNextPage,
        },
      })
    },
  )

  /**
   * GET /admin/roles/:roleId
   * Get detailed information about a specific role
   */
  fastify.get(
    '/:roleId',
    {
      preHandler: [requirePermission(PERMISSION.ROLES_READ)],
      schema: getRoleSchema,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const auth0Id = getAuth0Id(request)
      const companyId = await getCompanyIdFromUser(auth0Id)
      const { roleId } = request.params as { roleId: string }

      const role = await rolesManagementService.getRoleById(companyId, roleId)

      if (!role) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Role not found',
          },
        })
      }

      return reply.code(200).send({
        success: true,
        data: role,
      })
    },
  )

  // =========================================================================
  // ROLES - CREATE
  // =========================================================================

  /**
   * POST /admin/roles
   * Create a new role for the company
   */
  fastify.post(
    '/',
    {
      preHandler: [requirePermission(PERMISSION.ROLES_CREATE)],
      schema: createRoleSchema,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const auth0Id = getAuth0Id(request)
      const companyId = await getCompanyIdFromUser(auth0Id)
      const { name, description, permissionNames } = request.body as Record<string, unknown>

      try {
        const role = await rolesManagementService.createRole(
          companyId,
          name as string,
          description as string | undefined,
          (permissionNames as string[]) || [],
        )

        logger.info('Role created', { roleId: role.id, companyId, name })

        return reply.code(201).send({
          success: true,
          data: role,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'

        if (message.includes('already exists')) {
          return reply.code(409).send({
            success: false,
            error: {
              code: 'ROLE_ALREADY_EXISTS',
              message,
            },
          })
        }

        if (message.includes('not found')) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'PERMISSION_NOT_FOUND',
              message,
            },
          })
        }

        throw error
      }
    },
  )

  // =========================================================================
  // ROLES - UPDATE
  // =========================================================================

  /**
   * PATCH /admin/roles/:roleId
   * Update role name and/or description
   */
  fastify.patch(
    '/:roleId',
    {
      preHandler: [requirePermission(PERMISSION.ROLES_UPDATE)],
      schema: updateRoleSchema,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const auth0Id = getAuth0Id(request)
      const companyId = await getCompanyIdFromUser(auth0Id)
      const { roleId } = request.params as { roleId: string }
      const { name, description } = request.body as Record<string, unknown>

      try {
        const role = await rolesManagementService.updateRole(companyId, roleId, {
          name: name as string | undefined,
          description: description as string | undefined,
        })

        logger.info('Role updated', { roleId, companyId })

        return reply.code(200).send({
          success: true,
          data: role,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'

        if (message.includes('not found')) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'ROLE_NOT_FOUND',
              message,
            },
          })
        }

        if (message.includes('already exists')) {
          return reply.code(409).send({
            success: false,
            error: {
              code: 'ROLE_ALREADY_EXISTS',
              message,
            },
          })
        }

        throw error
      }
    },
  )

  // =========================================================================
  // ROLES - DELETE
  // =========================================================================

  /**
   * DELETE /admin/roles/:roleId
   * Delete a role (only if no users are assigned)
   */
  fastify.delete(
    '/:roleId',
    {
      preHandler: [requirePermission(PERMISSION.ROLES_DELETE)],
      schema: deleteRoleSchema,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const auth0Id = getAuth0Id(request)
      const companyId = await getCompanyIdFromUser(auth0Id)
      const { roleId } = request.params as { roleId: string }

      try {
        await rolesManagementService.deleteRole(companyId, roleId)

        logger.info('Role deleted', { roleId, companyId })

        return reply.code(200).send({
          success: true,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        logger.error('Failed to delete role', { error: message, roleId, companyId })

        // Handle role not found error
        if (message.includes('not found')) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'ROLE_NOT_FOUND',
              message,
            },
          })
        }

        // Handle role with assigned users error
        if (message.includes('assigned users')) {
          const match = message.match(/(\d+)\s+assigned users/)
          const usersCount = match ? parseInt(match[1]) : 0

          return reply.code(409).send({
            success: false,
            error: {
              code: 'ROLE_HAS_USERS',
              message: `Cannot delete role with ${usersCount} assigned users`,
              details: { usersCount },
            },
          })
        }

        throw error
      }
    },
  )

  // =========================================================================
  // ROLE PERMISSIONS - READ
  // =========================================================================

  /**
   * GET /admin/roles/:roleId/permissions
   * Get all permissions assigned to a role, grouped by category
   */
  fastify.get(
    '/:roleId/permissions',
    {
      preHandler: [requirePermission(PERMISSION.ROLES_READ)],
      schema: getRolePermissionsSchema,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const auth0Id = getAuth0Id(request)
      const companyId = await getCompanyIdFromUser(auth0Id)
      const { roleId } = request.params as { roleId: string }

      try {
        const result = await rolesManagementService.getRolePermissions(companyId, roleId)

        return reply.code(200).send({
          success: true,
          data: result,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'

        if (message.includes('not found')) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'ROLE_NOT_FOUND',
              message,
            },
          })
        }

        throw error
      }
    },
  )

  // =========================================================================
  // ROLE PERMISSIONS - SET (REPLACE ALL)
  // =========================================================================

  /**
   * PUT /admin/roles/:roleId/permissions
   * Replace all permissions for a role
   */
  fastify.put(
    '/:roleId/permissions',
    {
      preHandler: [requirePermission(PERMISSION.ROLES_MANAGE_PERMISSIONS)],
      schema: setRolePermissionsSchema,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const auth0Id = getAuth0Id(request)
      const companyId = await getCompanyIdFromUser(auth0Id)
      const { roleId } = request.params as { roleId: string }
      const { permissionNames } = request.body as Record<string, unknown>

      try {
        const result = await rolesManagementService.setRolePermissions(
          companyId,
          roleId,
          (permissionNames as string[]) || [],
        )

        logger.info('Role permissions replaced', { roleId, companyId, count: result.permissions.length })

        return reply.code(200).send({
          success: true,
          data: result,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'

        if (message.includes('not found')) {
          if (message.includes('Role')) {
            return reply.code(404).send({
              success: false,
              error: {
                code: 'ROLE_NOT_FOUND',
                message,
              },
            })
          } else {
            return reply.code(400).send({
              success: false,
              error: {
                code: 'PERMISSION_NOT_FOUND',
                message,
              },
            })
          }
        }

        throw error
      }
    },
  )

  // =========================================================================
  // ROLE PERMISSIONS - ADD (INCREMENTAL)
  // =========================================================================

  /**
   * POST /admin/roles/:roleId/permissions
   * Add permissions to a role (incremental)
   */
  fastify.post(
    '/:roleId/permissions',
    {
      preHandler: [requirePermission(PERMISSION.ROLES_MANAGE_PERMISSIONS)],
      schema: addRolePermissionsSchema,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const auth0Id = getAuth0Id(request)
      const companyId = await getCompanyIdFromUser(auth0Id)
      const { roleId } = request.params as { roleId: string }
      const { permissionNames } = request.body as Record<string, unknown>

      try {
        const result = await rolesManagementService.addRolePermissions(
          companyId,
          roleId,
          (permissionNames as string[]) || [],
        )

        logger.info('Permissions added to role', {
          roleId,
          companyId,
          addedCount: result.addedPermissions.length,
        })

        return reply.code(200).send({
          success: true,
          data: result,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'

        if (message.includes('not found')) {
          if (message.includes('Role')) {
            return reply.code(404).send({
              success: false,
              error: {
                code: 'ROLE_NOT_FOUND',
                message,
              },
            })
          } else {
            return reply.code(400).send({
              success: false,
              error: {
                code: 'PERMISSION_NOT_FOUND',
                message,
              },
            })
          }
        }

        throw error
      }
    },
  )

  // =========================================================================
  // ROLE PERMISSIONS - REMOVE
  // =========================================================================

  /**
   * DELETE /admin/roles/:roleId/permissions
   * Remove specific permissions from a role
   */
  fastify.delete(
    '/:roleId/permissions',
    {
      preHandler: [requirePermission(PERMISSION.ROLES_MANAGE_PERMISSIONS)],
      schema: removeRolePermissionsSchema,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const auth0Id = getAuth0Id(request)
      const companyId = await getCompanyIdFromUser(auth0Id)
      const { roleId } = request.params as { roleId: string }
      const { permissionNames } = request.body as Record<string, unknown>

      try {
        const result = await rolesManagementService.removeRolePermissions(
          companyId,
          roleId,
          (permissionNames as string[]) || [],
        )

        logger.info('Permissions removed from role', {
          roleId,
          companyId,
          removedCount: result.removedPermissions.length,
        })

        return reply.code(200).send({
          success: true,
          data: result,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'

        if (message.includes('not found')) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'ROLE_NOT_FOUND',
              message,
            },
          })
        }

        throw error
      }
    },
  )

  // =========================================================================
  // PERMISSIONS - LIST ALL
  // =========================================================================

  /**
   * GET /admin/permissions
   * List all available permissions in the system
   */
  fastify.get(
    '/system/permissions',
    {
      preHandler: [requirePermission(PERMISSION.ROLES_READ)],
      schema: listAllPermissionsSchema,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const auth0Id = getAuth0Id(request)
      const companyId = await getCompanyIdFromUser(auth0Id)

      const result = await rolesManagementService.listAllPermissions(companyId)

      return reply.code(200).send({
        success: true,
        data: result,
      })
    },
  )

  // =========================================================================
  // PERMISSIONS - LIST CATEGORIES
  // =========================================================================

  /**
   * GET /admin/permissions/categories
   * List all permission categories
   */
  fastify.get(
    '/system/categories',
    {
      preHandler: [requirePermission(PERMISSION.ROLES_READ)],
      schema: listPermissionCategoriesSchema,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const result = await rolesManagementService.getPermissionCategories()

      return reply.code(200).send({
        success: true,
        data: result,
      })
    },
  )

  // =========================================================================
  // PERMISSIONS - LIST ALL FOR TOOLTIPS (WITH NEW PERMISSION)
  // =========================================================================

  /**
   * GET /admin/roles/system/permissions-info
   * Get all available permissions with descriptions and categories for frontend tooltips
   * 
   * Returns permissions grouped by category. Used by frontend to display
   * informative tooltips and permission documentation.
   * 
   * Requires: permissions:read_all permission
   */
  fastify.get(
    '/system/permissions-info',
    {
      preHandler: [requirePermission(PERMISSION.PERMISSIONS_READ_ALL)],
      schema: {
        tags: ['Permissions'],
        description: 'Get all available permissions with descriptions and categories for tooltips',
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  categories: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        category: { type: 'string' },
                        permissions: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              name: { type: 'string' },
                              description: { type: 'string' },
                              category: { type: 'string' },
                            },
                          },
                        },
                      },
                    },
                  },
                  total: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const result = await rolesManagementService.getPermissionsInfoForTooltips()

        logger.info('Permissions info for tooltips retrieved')

        return reply.code(200).send({
          success: true,
          data: result,
        })
      } catch (error) {
        logger.error('Error fetching permissions info', { error })

        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to retrieve permissions information',
          },
        })
      }
    },
  )

  // =========================================================================
  // USER ROLES - LIST
  // =========================================================================

  /**
   * GET /admin/users/:userId/roles
   * Get all roles assigned to a specific user
   */
  fastify.get(
    '/users/:userId/roles',
    {
      preHandler: [requirePermission(PERMISSION.USERS_READ)],
      schema: getUserRolesSchema,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const auth0Id = getAuth0Id(request)
      const companyId = await getCompanyIdFromUser(auth0Id)
      const { userId } = request.params as { userId: string }

      try {
        const result = await rolesManagementService.getUserRoles(companyId, userId)

        return reply.code(200).send({
          success: true,
          data: result,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'

        if (message.includes('not found')) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message,
            },
          })
        }

        throw error
      }
    },
  )

  // =========================================================================
  // USER ROLES - ASSIGN
  // =========================================================================

  /**
   * POST /admin/users/:userId/roles
   * Assign a role to one or multiple users
   * Supports both single user (via URL param) and multiple users (via userIds in body)
   */
  fastify.post(
    '/users/:userId/roles',
    {
      preHandler: [requirePermission(PERMISSION.USERS_MANAGE_ROLES)],
      schema: assignRoleToUserSchema,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const auth0Id = getAuth0Id(request)
      const companyId = await getCompanyIdFromUser(auth0Id)
      const { userId } = request.params as { userId: string }
      const { roleId, userIds } = request.body as Record<string, unknown>

      try {
        // If userIds array is provided, assign to multiple users
        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
          const result = await rolesManagementService.assignRoleToMultipleUsers(
            companyId,
            userIds as string[],
            roleId as string,
          )

          logger.info('Role assigned to multiple users', {
            roleId,
            userCount: userIds.length,
            companyId,
          })

          return reply.code(200).send({
            success: true,
            data: result,
          })
        } else {
          // Otherwise, assign to single user using userId param
          const result = await rolesManagementService.assignRoleToUser(
            companyId,
            userId,
            roleId as string,
          )

          logger.info('Role assigned to user', { userId, roleId, companyId })

          return reply.code(200).send({
            success: true,
            data: result,
          })
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'

        if (message.includes('not found')) {
          if (message.includes('User')) {
            return reply.code(404).send({
              success: false,
              error: {
                code: 'USER_NOT_FOUND',
                message,
              },
            })
          } else {
            return reply.code(404).send({
              success: false,
              error: {
                code: 'ROLE_NOT_FOUND',
                message,
              },
            })
          }
        }

        if (message.includes('already assigned')) {
          return reply.code(409).send({
            success: false,
            error: {
              code: 'ROLE_ALREADY_ASSIGNED',
              message,
            },
          })
        }

        throw error
      }
    },
  )

  // =========================================================================
  // USER ROLES - REMOVE
  // =========================================================================

  /**
   * DELETE /admin/users/:userId/roles/:roleId
   * Remove a role from a user
   */
  fastify.delete(
    '/users/:userId/roles/:roleId',
    {
      preHandler: [requirePermission(PERMISSION.USERS_MANAGE_ROLES)],
      schema: removeRoleFromUserSchema,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const auth0Id = getAuth0Id(request)
      const companyId = await getCompanyIdFromUser(auth0Id)
      const { userId, roleId } = request.params as { userId: string; roleId: string }

      try {
        await rolesManagementService.removeRoleFromUser(companyId, userId, roleId)

        logger.info('Role removed from user', { userId, roleId, companyId })

        return reply.code(200).send({
          success: true,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'

        if (message.includes('not found')) {
          if (message.includes('User')) {
            return reply.code(404).send({
              success: false,
              error: {
                code: 'USER_NOT_FOUND',
                message,
              },
            })
          } else {
            return reply.code(404).send({
              success: false,
              error: {
                code: 'ROLE_NOT_FOUND',
                message,
              },
            })
          }
        }

        throw error
      }
    },
  )

  // =========================================================================
  // COMPANY USERS - LIST
  // =========================================================================

  /**
   * GET /admin/roles/users/list
   * List all active users in the company for role assignment
   */
  fastify.get(
    '/users/list',
    {
      preHandler: [requirePermission(PERMISSION.ROLES_READ)],
      schema: listCompanyUsersSchema,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const auth0Id = getAuth0Id(request)
      const companyId = await getCompanyIdFromUser(auth0Id)

      const users = await rolesManagementService.listCompanyUsers(companyId)

      logger.info('Company users retrieved', { companyId, usersCount: users.length })

      return reply.code(200).send({
        success: true,
        data: users,
      })
    },
  )
}
