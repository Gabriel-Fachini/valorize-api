/**
 * Admin Users Routes
 * Routes for managing users in the admin panel
 * Base path: /admin/users
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { usersService } from './users.service'
import { csvImportService } from './csv-import.service'
import {
  listUsersSchema,
  getUserDetailSchema,
  createUserSchema,
  updateUserSchema,
  deleteUserSchema,
  bulkActionsSchema,
  csvTemplateSchema,
  csvPreviewSchema,
  csvImportSchema,
  resetPasswordSchema,
} from './users.schemas'
import { requirePermission } from '@/middleware/rbac'
import { PERMISSION } from '@/features/app/rbac/permissions.constants'
import { getAuthUserId } from '@/middleware/auth'
import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

/**
 * Get company ID from authenticated user
 */
async function getCompanyIdFromUser(authUserId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { authUserId },
    select: { companyId: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return user.companyId
}

export default async function usersRoutes(fastify: FastifyInstance) {
  // ============================================================================
  // LIST USERS
  // ============================================================================
  fastify.get(
    '/',
    {
      schema: listUsersSchema,
      preHandler: [requirePermission(PERMISSION.USERS_READ)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authUserId = getAuthUserId(request)
        const companyId = await getCompanyIdFromUser(authUserId)

        const query = request.query as any

        const result = await usersService.listUsers(companyId, {
          page: query.page ? parseInt(query.page, 10) : 1,
          limit: query.limit ? parseInt(query.limit, 10) : 20,
          search: query.search || '',
          status: query.status,
          departmentId: query.departmentId,
          sortBy: query.sortBy || 'createdAt',
          sortOrder: query.sortOrder || 'desc',
        })

        return reply.code(200).send(result)
      } catch (error) {
        logger.error('Failed to list users', { error })
        throw error
      }
    },
  )

  // ============================================================================
  // GET USER DETAIL
  // ============================================================================
  fastify.get(
    '/:userId',
    {
      schema: getUserDetailSchema,
      preHandler: [requirePermission(PERMISSION.USERS_READ)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authUserId = getAuthUserId(request)
        const companyId = await getCompanyIdFromUser(authUserId)
        const { userId } = request.params as { userId: string }

        const user = await usersService.getUserById(companyId, userId)

        return reply.code(200).send(user)
      } catch (error) {
        logger.error('Failed to get user detail', { error })
        throw error
      }
    },
  )

  // ============================================================================
  // CREATE USER
  // ============================================================================
  fastify.post(
    '/',
    {
      schema: createUserSchema,
      preHandler: [requirePermission(PERMISSION.USERS_CREATE)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authUserId = getAuthUserId(request)
        const companyId = await getCompanyIdFromUser(authUserId)
        const body = request.body as any

        const user = await usersService.createUser(companyId, {
          name: body.name,
          email: body.email,
          departmentId: body.departmentId,
          jobTitleId: body.jobTitleId,
        })

        return reply.code(201).send(user)
      } catch (error) {
        logger.error('Failed to create user', { error })
        throw error
      }
    },
  )

  // ============================================================================
  // UPDATE USER
  // ============================================================================
  fastify.patch(
    '/:userId',
    {
      schema: updateUserSchema,
      preHandler: [requirePermission(PERMISSION.USERS_UPDATE)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authUserId = getAuthUserId(request)
        const companyId = await getCompanyIdFromUser(authUserId)
        const { userId } = request.params as { userId: string }
        const body = request.body as any

        const user = await usersService.updateUser(companyId, userId, {
          name: body.name,
          email: body.email,
          departmentId: body.departmentId,
          jobTitleId: body.jobTitleId,
          isActive: body.isActive,
        })

        return reply.code(200).send(user)
      } catch (error) {
        logger.error('Failed to update user', { error })
        throw error
      }
    },
  )

  // ============================================================================
  // DELETE USER (SOFT DELETE)
  // ============================================================================
  fastify.delete(
    '/:userId',
    {
      schema: deleteUserSchema,
      preHandler: [requirePermission(PERMISSION.USERS_DELETE)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authUserId = getAuthUserId(request)
        const companyId = await getCompanyIdFromUser(authUserId)
        const { userId } = request.params as { userId: string }

        await usersService.deactivateUser(companyId, userId)

        return reply.code(204).send()
      } catch (error) {
        logger.error('Failed to delete user', { error })
        throw error
      }
    },
  )

  // ============================================================================
  // BULK ACTIONS
  // ============================================================================
  fastify.post(
    '/bulk/actions',
    {
      schema: bulkActionsSchema,
      preHandler: [requirePermission(PERMISSION.USERS_BULK_ACTIONS)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authUserId = getAuthUserId(request)
        const companyId = await getCompanyIdFromUser(authUserId)
        const body = request.body as any

        const { userIds, action } = body

        if (action === 'activate') {
          const result = await usersService.bulkActivate(companyId, userIds)
          return reply.code(200).send(result)
        } else if (action === 'deactivate') {
          const result = await usersService.bulkDeactivate(companyId, userIds)
          return reply.code(200).send(result)
        } else if (action === 'export') {
          const users = await usersService.getUsersForExport(companyId, userIds)

          // Convert to CSV
          const headers = ['id', 'name', 'email', 'department', 'position', 'isActive', 'createdAt']
          const rows = users.map(u => [
            u.id,
            u.name,
            u.email,
            u.department?.name || '',
            u.position?.name || '',
            u.isActive ? 'true' : 'false',
            u.createdAt.toISOString(),
          ])

          const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

          reply.header('Content-Type', 'text/csv')
          reply.header('Content-Disposition', 'attachment; filename="users_export.csv"')
          return reply.code(200).send(csv)
        }

        throw new Error('Invalid action')
      } catch (error) {
        logger.error('Failed to perform bulk action', { error })
        throw error
      }
    },
  )

  // ============================================================================
  // RESET PASSWORD
  // ============================================================================
  fastify.put(
    '/:userId/reset-password',
    {
      schema: resetPasswordSchema,
      preHandler: [requirePermission(PERMISSION.USERS_UPDATE)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authUserId = getAuthUserId(request)
        const companyId = await getCompanyIdFromUser(authUserId)
        const { userId } = request.params as { userId: string }

        const result = await usersService.resetUserPassword(companyId, userId)

        return reply.code(200).send(result)
      } catch (error) {
        logger.error('Failed to reset password', { error })
        throw error
      }
    },
  )

  // ============================================================================
  // CSV TEMPLATE
  // ============================================================================
  fastify.get(
    '/csv/template',
    {
      schema: csvTemplateSchema,
      preHandler: [requirePermission(PERMISSION.USERS_IMPORT_CSV)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const template = await csvImportService.generateTemplate()

        reply.header('Content-Type', 'text/csv; charset=utf-8')
        reply.header('Content-Disposition', 'attachment; filename="users_template.csv"')
        return reply.code(200).send(template)
      } catch (error) {
        logger.error('Failed to generate CSV template', { error })
        throw error
      }
    },
  )

  // ============================================================================
  // CSV PREVIEW
  // ============================================================================
  fastify.post(
    '/csv/preview',
    {
      schema: csvPreviewSchema,
      preHandler: [requirePermission(PERMISSION.USERS_IMPORT_CSV)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authUserId = getAuthUserId(request)
        const companyId = await getCompanyIdFromUser(authUserId)

        const body = request.body as any

        // Accept base64 encoded CSV content
        if (!body.fileContent || typeof body.fileContent !== 'string') {
          return reply.code(400).send({
            error: 'Validation Error',
            message: 'fileContent (base64) is required',
          })
        }

        // Decode base64
        const buffer = Buffer.from(body.fileContent, 'base64')

        // Validate file size (5MB)
        if (buffer.length > 5 * 1024 * 1024) {
          return reply.code(400).send({
            error: 'Validation Error',
            message: 'File size must not exceed 5MB',
          })
        }

        // Preview import
        const preview = await csvImportService.previewImport(buffer, companyId)

        return reply.code(200).send(preview)
      } catch (error) {
        logger.error('Failed to preview CSV', { error })
        throw error
      }
    },
  )

  // ============================================================================
  // CSV IMPORT
  // ============================================================================
  fastify.post(
    '/csv/import',
    {
      schema: csvImportSchema,
      preHandler: [requirePermission(PERMISSION.USERS_IMPORT_CSV)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authUserId = getAuthUserId(request)
        const companyId = await getCompanyIdFromUser(authUserId)
        const body = request.body as any

        const { previewId, confirmedRows } = body

        // Import users and get detailed result
        const result = await csvImportService.importUsers(companyId, previewId, confirmedRows)

        // Log summary for monitoring
        logger.info('CSV import request completed', {
          companyId,
          status: result.status,
          created: result.report.created,
          updated: result.report.updated,
          errors: result.report.errors.length,
          totalErrors: result.report.errors.length,
        })

        // Always return the full result with detailed errors
        // Use 200 for completed/partial, 207 Multi-Status for partial success
        const statusCode = result.status === 'failed' ? 422 : result.status === 'partial' ? 207 : 200

        return reply.code(statusCode).send({
          success: result.status === 'completed',
          status: result.status,
          message:
            result.status === 'completed'
              ? 'All users imported successfully'
              : result.status === 'partial'
                ? 'Import completed with some errors'
                : 'Import failed - all rows had errors',
          report: result.report,
        })
      } catch (error) {
        logger.error('CSV import endpoint error', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })

        // Re-throw to let global error handler deal with it
        // This ensures consistent error format across the API
        throw error
      }
    },
  )
}
