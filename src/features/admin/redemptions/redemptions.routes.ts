import type { FastifyInstance, FastifyRequest } from 'fastify'
import { getCurrentUser } from '@/middleware/auth'
import { requirePermission } from '@/middleware/rbac'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/database'
import { User } from '@/features/app/users/user.model'
import { redemptionService } from '@/features/app/prizes/redemptions/redemption.service'
import { adminRedemptionsService } from './admin-redemptions.service'
import { redemptionsMetricsService } from './redemptions-metrics.service'
import { PERMISSION } from '@/features/app/rbac/permissions.constants'
import {
  sendVoucherToUserSchema,
  bulkRedeemVouchersSchema,
  listRedemptionsQuerySchema,
  getRedemptionParamsSchema,
  updateStatusSchema,
  updateTrackingSchema,
  addNoteSchema,
  cancelRedemptionSchema,
  metricsQuerySchema,
} from './redemptions.schemas'
import type {
  SendVoucherToUserRequest,
  BulkRedeemVouchersRequest,
  BulkRedemptionResponse,
  UpdateStatusPayload,
  AddTrackingPayload,
  AddNotePayload,
  CancelRedemptionPayload,
} from './types'

// Constante com o ID fixo da campanha do Tremendous
const DEFAULT_CAMPAIGN_ID = '8IJ7H3VPC766'

export default async function adminRedemptionRoutes(fastify: FastifyInstance) {
  /**
   * POST /admin/redemptions/send-to-user
   * Send a single voucher to a user via email
   */
  fastify.post<{ Body: SendVoucherToUserRequest }>(
    '/send-to-user',
    {
      schema: sendVoucherToUserSchema,
      preHandler: [requirePermission(PERMISSION.VOUCHERS_SEND_TO_USERS)],
    },
    async (request: FastifyRequest<{ Body: SendVoucherToUserRequest }>, reply) => {
      const currentUser = getCurrentUser(request)
      const adminUser = await User.findByAuth0Id(currentUser.sub)

      if (!adminUser) {
        return reply.code(404).send({ message: 'Admin user not found' })
      }

      try {
        const { userId, email, prizeId, customAmount } = request.body

        logger.info('[AdminRedemptionRoutes] Send voucher to user request', {
          adminId: adminUser.id,
          userId,
          email,
          prizeId,
          customAmount,
          campaignId: DEFAULT_CAMPAIGN_ID,
        })

        // Validate user email match
        const targetUser = await User.findById(userId)
        if (!targetUser) {
          return reply.code(404).send({ message: 'Target user not found' })
        }

        if (targetUser.email !== email) {
          return reply.code(400).send({
            message: 'Email does not match user record',
          })
        }

        if (targetUser.companyId !== adminUser.companyId) {
          return reply.code(403).send({
            message: 'User is not in the same company',
          })
        }

        // Call service to send voucher (now includes email delivery - synchronous)
        const { redemption, voucherResult } =
          await redemptionService.sendVoucherToUser(
            userId,
            prizeId,
            adminUser.companyId,
            customAmount,
            DEFAULT_CAMPAIGN_ID,
          )

        logger.info('[AdminRedemptionRoutes] Voucher sent successfully via email', {
          redemptionId: redemption.id,
          userId,
          email,
          prizeId,
          customAmount,
          orderId: voucherResult?.orderId,
        })

        return reply.code(200).send({
          message: 'Voucher enviado com sucesso para o email do usuário',
          redemptionId: redemption.id,
          userId,
          email,
          prizeId,
          customAmount,
          status: 'sent',
          notes: 'Voucher foi enviado pela Tremendous API. O usuário receberá o email em breve.',
        })
      } catch (error) {
        logger.error('[AdminRedemptionRoutes] Error sending voucher to user', { error })

        return reply.code(400).send({
          message: error instanceof Error ? error.message : 'Failed to send voucher to user',
        })
      }
    },
  )

  /**
   * POST /admin/redemptions/bulk-redeem
   * Send vouchers to multiple users via email
   * Accepts up to 100 users per request
   */
  fastify.post<{ Body: BulkRedeemVouchersRequest }>(
    '/bulk-redeem',
    {
      schema: bulkRedeemVouchersSchema,
      preHandler: [requirePermission(PERMISSION.VOUCHERS_SEND_TO_USERS)],
    },
    async (
      request: FastifyRequest<{ Body: BulkRedeemVouchersRequest }>,
      reply,
    ) => {
      const currentUser = getCurrentUser(request)
      const adminUser = await User.findByAuth0Id(currentUser.sub)

      if (!adminUser) {
        return reply.code(404).send({ message: 'Admin user not found' })
      }

      try {
        const { prizeId, customAmount, campaignId, allUsersSelected, users: providedUsers } = request.body

        // 1. Determine users list
        let users: Array<{ userId: string; email: string }>

        if (allUsersSelected) {
          // Fetch all active users from the company
          const companyUsers = await prisma.user.findMany({
            where: {
              companyId: adminUser.companyId,
              isActive: true,
            },
            select: { id: true, email: true },
          })

          if (companyUsers.length === 0) {
            return reply.code(400).send({
              message: 'No active users found in your company',
            })
          }

          users = companyUsers.map((u) => ({ userId: u.id, email: u.email }))

          logger.info('[AdminRedemptionRoutes] Bulk redeem request (all users)', {
            adminId: adminUser.id,
            prizeId,
            customAmount,
            userCount: users.length,
          })
        } else {
          // Use provided users list
          if (!providedUsers || providedUsers.length === 0) {
            return reply.code(400).send({
              message: 'Either provide users array or set allUsersSelected to true',
            })
          }

          users = providedUsers

          logger.info('[AdminRedemptionRoutes] Bulk redeem request', {
            adminId: adminUser.id,
            prizeId,
            customAmount,
            userCount: users.length,
          })
        }

        // 2. Validate all users exist and belong to same company
        const userIds = users.map((u) => u.userId)
        const dbUsers = await prisma.user.findMany({
          where: {
            id: { in: userIds },
            companyId: adminUser.companyId,
          },
          select: { id: true, email: true },
        })

        if (dbUsers.length !== users.length) {
          return reply.code(400).send({
            message: 'One or more users not found or do not belong to your company',
          })
        }

        // 3. Validate email matches for all users (only if they were provided)
        if (!allUsersSelected) {
          const emailMismatches = users.filter((reqUser) => {
            const dbUser = dbUsers.find((u: any) => u.id === reqUser.userId)
            return dbUser && dbUser.email !== reqUser.email
          })

          if (emailMismatches.length > 0) {
            return reply.code(400).send({
              message: `Email mismatch for ${emailMismatches.length} user(s)`,
              mismatches: emailMismatches,
            })
          }
        }

        const results = await redemptionService.bulkRedeemVouchers(
          prizeId,
          customAmount,
          adminUser.companyId,
          users,
          campaignId,
        )

        const response: BulkRedemptionResponse = {
          message: allUsersSelected
            ? `Vouchers enviados com sucesso para todos os ${results.length} usuários da empresa`
            : 'Vouchers enviados com sucesso para os usuários',
          summary: {
            total: results.length,
            successful: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
          },
          results: results.map((r) => ({
            userId: r.userId,
            email: users.find((u) => u.userId === r.userId)?.email || '',
            prizeId,
            success: r.success,
            redemptionId: r.redemptionId,
            error: r.error,
          })),
        }

        logger.info('[AdminRedemptionRoutes] Bulk redemption completed successfully', {
          total: response.summary.total,
          successful: response.summary.successful,
          failed: response.summary.failed,
        })

        return reply.code(200).send(response)
      } catch (error) {
        logger.error('[AdminRedemptionRoutes] Error in bulk redeem', { error })

        return reply.code(400).send({
          message: error instanceof Error ? error.message : 'Failed to process bulk redemption',
        })
      }
    },
  )

  /**
   * GET /admin/redemptions
   * List all company redemptions with optional filters
   */
  fastify.get(
    '/',
    {
      schema: listRedemptionsQuerySchema,
      preHandler: [requirePermission(PERMISSION.REDEMPTIONS_VIEW_ALL)],
    },
    async (request: FastifyRequest, reply) => {
      const currentUser = getCurrentUser(request)
      const adminUser = await User.findByAuth0Id(currentUser.sub)

      if (!adminUser) {
        return reply.code(404).send({ message: 'Admin user not found' })
      }

      try {
        const { search, status, type, limit, offset } = request.query as Record<
          string,
          string | number | undefined
        >

        const filters = {
          search: search as string | undefined,
          status: status as string | undefined,
          type: type as 'voucher' | 'product' | undefined,
          limit: limit ? Number(limit) : 20,
          offset: offset ? Number(offset) : 0,
        }

        logger.info('[AdminRedemptionRoutes] List redemptions request', {
          adminId: adminUser.id,
          filters,
        })

        const { items, total } = await adminRedemptionsService.listRedemptions(
          adminUser.companyId,
          filters,
        )

        return reply.code(200).send({
          data: items,
          pagination: {
            total,
            limit: filters.limit,
            offset: filters.offset,
            pages: Math.ceil(total / filters.limit),
          },
        })
      } catch (error) {
        logger.error('[AdminRedemptionRoutes] Error listing redemptions', { error })

        return reply.code(400).send({
          message: error instanceof Error ? error.message : 'Failed to list redemptions',
        })
      }
    },
  )

  /**
   * GET /admin/redemptions/:id
   * Get complete details of a specific redemption
   */
  fastify.get(
    '/:id',
    {
      schema: getRedemptionParamsSchema,
      preHandler: [requirePermission(PERMISSION.REDEMPTIONS_VIEW_DETAILS)],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const currentUser = getCurrentUser(request)
      const adminUser = await User.findByAuth0Id(currentUser.sub)

      if (!adminUser) {
        return reply.code(404).send({ message: 'Admin user not found' })
      }

      try {
        const { id } = request.params

        logger.info('[AdminRedemptionRoutes] Get redemption details request', {
          adminId: adminUser.id,
          redemptionId: id,
        })

        const redemption = await adminRedemptionsService.getRedemptionDetails(
          id,
          adminUser.companyId,
        )

        return reply.code(200).send(redemption)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get redemption details'

        if (message === 'Redemption not found') {
          return reply.code(404).send({ message })
        }

        if (message.includes('Unauthorized')) {
          return reply.code(403).send({ message })
        }

        logger.error('[AdminRedemptionRoutes] Error getting redemption details', { error })

        return reply.code(400).send({ message })
      }
    },
  )

  /**
   * PATCH /admin/redemptions/:id/status
   * Update redemption status and optionally add notes
   */
  fastify.patch<{ Params: { id: string }; Body: UpdateStatusPayload }>(
    '/:id/status',
    {
      schema: updateStatusSchema,
      preHandler: [requirePermission(PERMISSION.REDEMPTIONS_UPDATE_STATUS)],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: UpdateStatusPayload }>,
      reply,
    ) => {
      const currentUser = getCurrentUser(request)
      const adminUser = await User.findByAuth0Id(currentUser.sub)

      if (!adminUser) {
        return reply.code(404).send({ message: 'Admin user not found' })
      }

      try {
        const { id } = request.params
        const { status, notes } = request.body

        logger.info('[AdminRedemptionRoutes] Update redemption status request', {
          adminId: adminUser.id,
          redemptionId: id,
          newStatus: status,
        })

        await adminRedemptionsService.updateRedemptionStatus(
          id,
          status as any,
          adminUser.companyId,
          adminUser.id,
          notes,
        )

        return reply.code(200).send({
          message: 'Redemption status updated successfully',
          redemptionId: id,
          status,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update status'

        if (message === 'Redemption not found') {
          return reply.code(404).send({ message })
        }

        if (message.includes('Unauthorized')) {
          return reply.code(403).send({ message })
        }

        logger.error('[AdminRedemptionRoutes] Error updating redemption status', { error })

        return reply.code(400).send({ message })
      }
    },
  )

  /**
   * PATCH /admin/redemptions/:id/tracking
   * Add tracking code and carrier information
   */
  fastify.patch<{ Params: { id: string }; Body: AddTrackingPayload }>(
    '/:id/tracking',
    {
      schema: updateTrackingSchema,
      preHandler: [requirePermission(PERMISSION.REDEMPTIONS_UPDATE_STATUS)],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: AddTrackingPayload }>,
      reply,
    ) => {
      const currentUser = getCurrentUser(request)
      const adminUser = await User.findByAuth0Id(currentUser.sub)

      if (!adminUser) {
        return reply.code(404).send({ message: 'Admin user not found' })
      }

      try {
        const { id } = request.params
        const { trackingCode, carrier, notes } = request.body

        logger.info('[AdminRedemptionRoutes] Add tracking code request', {
          adminId: adminUser.id,
          redemptionId: id,
          trackingCode,
        })

        await adminRedemptionsService.addTrackingCode(
          id,
          trackingCode,
          adminUser.companyId,
          adminUser.id,
          carrier,
          notes,
        )

        return reply.code(200).send({
          message: 'Tracking code added successfully',
          redemptionId: id,
          trackingCode,
          carrier: carrier || null,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add tracking code'

        if (message === 'Redemption not found') {
          return reply.code(404).send({ message })
        }

        if (message.includes('Unauthorized')) {
          return reply.code(403).send({ message })
        }

        logger.error('[AdminRedemptionRoutes] Error adding tracking code', { error })

        return reply.code(400).send({ message })
      }
    },
  )

  /**
   * POST /admin/redemptions/:id/notes
   * Add admin note to redemption
   */
  fastify.post<{ Params: { id: string }; Body: AddNotePayload }>(
    '/:id/notes',
    {
      schema: addNoteSchema,
      preHandler: [requirePermission(PERMISSION.REDEMPTIONS_UPDATE_STATUS)],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: AddNotePayload }>,
      reply,
    ) => {
      const currentUser = getCurrentUser(request)
      const adminUser = await User.findByAuth0Id(currentUser.sub)

      if (!adminUser) {
        return reply.code(404).send({ message: 'Admin user not found' })
      }

      try {
        const { id } = request.params
        const { note } = request.body

        logger.info('[AdminRedemptionRoutes] Add admin note request', {
          adminId: adminUser.id,
          redemptionId: id,
        })

        await adminRedemptionsService.addAdminNote(id, note, adminUser.companyId, adminUser.id)

        return reply.code(200).send({
          message: 'Note added successfully',
          redemptionId: id,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add note'

        if (message === 'Redemption not found') {
          return reply.code(404).send({ message })
        }

        if (message.includes('Unauthorized')) {
          return reply.code(403).send({ message })
        }

        logger.error('[AdminRedemptionRoutes] Error adding note', { error })

        return reply.code(400).send({ message })
      }
    },
  )

  /**
   * DELETE /admin/redemptions/:id/cancel
   * Cancel a redemption and refund coins + budget
   */
  fastify.delete<{ Params: { id: string }; Body: CancelRedemptionPayload }>(
    '/:id/cancel',
    {
      schema: cancelRedemptionSchema,
      preHandler: [requirePermission(PERMISSION.REDEMPTIONS_CANCEL)],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: CancelRedemptionPayload }>,
      reply,
    ) => {
      const currentUser = getCurrentUser(request)
      const adminUser = await User.findByAuth0Id(currentUser.sub)

      if (!adminUser) {
        return reply.code(404).send({ message: 'Admin user not found' })
      }

      try {
        const { id } = request.params
        const { reason } = request.body

        logger.info('[AdminRedemptionRoutes] Cancel redemption request', {
          adminId: adminUser.id,
          redemptionId: id,
          reason,
        })

        const result = await adminRedemptionsService.cancelRedemptionByAdmin(
          id,
          adminUser.companyId,
          adminUser.id,
          reason,
        )

        return reply.code(200).send(result)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to cancel redemption'

        if (message === 'Redemption not found') {
          return reply.code(404).send({ message })
        }

        if (message.includes('Unauthorized')) {
          return reply.code(403).send({ message })
        }

        if (message.includes('Cannot cancel')) {
          return reply.code(400).send({ message })
        }

        logger.error('[AdminRedemptionRoutes] Error cancelling redemption', { error })

        return reply.code(400).send({ message })
      }
    },
  )

  /**
   * GET /admin/redemptions/metrics
   * Get aggregated redemption metrics for the company
   */
  fastify.get(
    '/metrics',
    {
      schema: metricsQuerySchema,
      preHandler: [requirePermission(PERMISSION.REDEMPTIONS_VIEW_ALL)],
    },
    async (request: FastifyRequest, reply) => {
      const currentUser = getCurrentUser(request)
      const adminUser = await User.findByAuth0Id(currentUser.sub)

      if (!adminUser) {
        return reply.code(404).send({ message: 'Admin user not found' })
      }

      try {
        const { startDate, endDate } = request.query as Record<string, string | undefined>

        const filters = {
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        }

        logger.info('[AdminRedemptionRoutes] Get metrics request', {
          adminId: adminUser.id,
          filters,
        })

        const metrics = await redemptionsMetricsService.getRedemptionMetrics(
          adminUser.companyId,
          filters,
        )

        return reply.code(200).send(metrics)
      } catch (error) {
        logger.error('[AdminRedemptionRoutes] Error getting metrics', { error })

        return reply.code(400).send({
          message: error instanceof Error ? error.message : 'Failed to get redemption metrics',
        })
      }
    },
  )
}
