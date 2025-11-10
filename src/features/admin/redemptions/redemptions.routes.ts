import type { FastifyInstance, FastifyRequest } from 'fastify'
import { getCurrentUser } from '@/middleware/auth'
import { requirePermission } from '@/middleware/rbac'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/database'
import { User } from '@/features/users/user.model'
import { redemptionService } from '@/features/prizes/redemptions/redemption.service'
import { PERMISSION } from '@/features/rbac/permissions.constants'
import {
  sendVoucherToUserSchema,
  bulkRedeemVouchersSchema,
} from './redemptions.schemas'
import type {
  SendVoucherToUserRequest,
  BulkRedeemVouchersRequest,
  BulkRedemptionResponse,
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
        const { redemption, user: targetUserData, prize, voucherPrize, voucherResult } =
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
        const { prizeId, customAmount, campaignId, users } = request.body

        logger.info('[AdminRedemptionRoutes] Bulk redeem request', {
          adminId: adminUser.id,
          prizeId,
          customAmount,
          userCount: users.length,
        })

        // Validate all users exist and belong to same company
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

        // Validate email matches for all users
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

        const results = await redemptionService.bulkRedeemVouchers(
          prizeId,
          customAmount,
          adminUser.companyId,
          users,
          campaignId,
        )

        const response: BulkRedemptionResponse = {
          message: 'Vouchers enviados com sucesso para os usuários',
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
            voucherLink: r.voucherLink,
            voucherCode: r.voucherCode,
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
}
