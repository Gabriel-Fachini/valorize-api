import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { backofficeAuditLogsService } from './audit-logs.service'
import { requireSuperAdmin } from '@/middleware/backoffice'
import { logger } from '@/lib/logger'
import { AuditAction, AuditEntityType } from '@/lib/audit-logger'
import {
  listAuditLogsSchema,
  listCompanyAuditLogsSchema,
  listUserAuditLogsSchema,
} from './audit-logs.schemas'

/**
 * Backoffice Audit Logs Routes
 *
 * Audit log visualization for Super Admins from Valorize HQ
 * All routes require Super Admin authentication
 */
export const backofficeAuditLogsRoutes = async (
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
) => {
  /**
   * GET /backoffice/audit-logs
   *
   * List all audit logs (global) with advanced filters and pagination
   * Returns logs from all companies with user information
   */
  fastify.get(
    '/',
    {
      preHandler: [requireSuperAdmin()],
      schema: listAuditLogsSchema,
    },
    async (request, reply) => {
      try {
        const query = request.query as any

        const filters = {
          action: query.action as AuditAction | undefined,
          entityType: query.entityType as AuditEntityType | undefined,
          userId: query.userId,
          companyId: query.companyId,
          startDate: query.startDate ? new Date(query.startDate) : undefined,
          endDate: query.endDate ? new Date(query.endDate) : undefined,
        }

        const pagination = {
          page: query.page || 1,
          limit: query.limit || 50,
        }

        const sorting = {
          sortOrder: query.sortOrder || 'desc',
        }

        const result = await backofficeAuditLogsService.listAllAuditLogs(
          filters,
          pagination,
          sorting,
        )

        return reply.code(200).send({
          success: true,
          data: result.data,
          pagination: result.pagination,
        })
      } catch (error) {
        logger.error('Failed to list audit logs', { error })
        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to list audit logs',
        })
      }
    },
  )

  /**
   * GET /backoffice/audit-logs/companies/:companyId
   *
   * List audit logs for a specific company
   * Returns all actions performed on or related to the company
   */
  fastify.get(
    '/companies/:companyId',
    {
      preHandler: [requireSuperAdmin()],
      schema: listCompanyAuditLogsSchema,
    },
    async (request, reply) => {
      try {
        const { companyId } = request.params as { companyId: string }
        const query = request.query as any

        const filters = {
          action: query.action as AuditAction | undefined,
          entityType: query.entityType as AuditEntityType | undefined,
          userId: query.userId,
          startDate: query.startDate ? new Date(query.startDate) : undefined,
          endDate: query.endDate ? new Date(query.endDate) : undefined,
        }

        const pagination = {
          page: query.page || 1,
          limit: query.limit || 50,
        }

        const sorting = {
          sortOrder: query.sortOrder || 'desc',
        }

        const result = await backofficeAuditLogsService.listCompanyAuditLogs(
          companyId,
          filters,
          pagination,
          sorting,
        )

        return reply.code(200).send({
          success: true,
          data: result.data,
          pagination: result.pagination,
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)

        logger.error('Failed to list company audit logs', { error })

        // Handle specific errors
        if (errorMessage.includes('not found')) {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: errorMessage,
          })
        }

        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to list company audit logs',
        })
      }
    },
  )

  /**
   * GET /backoffice/audit-logs/users/:userId
   *
   * List all actions performed by a specific Super Admin
   * Useful for internal auditing of Super Admin activities
   */
  fastify.get(
    '/users/:userId',
    {
      preHandler: [requireSuperAdmin()],
      schema: listUserAuditLogsSchema,
    },
    async (request, reply) => {
      try {
        const { userId } = request.params as { userId: string }
        const query = request.query as any

        const filters = {
          action: query.action as AuditAction | undefined,
          entityType: query.entityType as AuditEntityType | undefined,
          companyId: query.companyId,
          startDate: query.startDate ? new Date(query.startDate) : undefined,
          endDate: query.endDate ? new Date(query.endDate) : undefined,
        }

        const pagination = {
          page: query.page || 1,
          limit: query.limit || 50,
        }

        const sorting = {
          sortOrder: query.sortOrder || 'desc',
        }

        const result = await backofficeAuditLogsService.listUserAuditLogs(
          userId,
          filters,
          pagination,
          sorting,
        )

        return reply.code(200).send({
          success: true,
          data: result.data,
          pagination: result.pagination,
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)

        logger.error('Failed to list user audit logs', { error })

        // Handle specific errors
        if (errorMessage.includes('not found')) {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: errorMessage,
          })
        }

        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to list user audit logs',
        })
      }
    },
  )
}
