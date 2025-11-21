/**
 * @fileoverview Admin routes for wallet and coin expiration management
 *
 * Routes:
 * - POST /admin/wallet-management/expire-coins      - Manually trigger coin expiration
 * - GET  /admin/wallet-management/expiration-report - Get report of upcoming expirations
 *
 * @module features/admin/wallet-management/wallet-management.routes
 */

import { FastifyInstance } from 'fastify'
import { requirePermission } from '@/middleware/rbac'
import { getCurrentUser } from '@/middleware/auth'
import { User } from '@/features/app/users/user.model'
import { expireCoins, getExpirationReport } from '@/features/app/wallets/wallet.service'
import { logger } from '@/lib/logger'
import { PERMISSION } from '@/features/app/rbac/permissions.constants'

export default async function walletManagementRoutes(fastify: FastifyInstance) {
  /**
   * POST /admin/wallet-management/expire-coins
   * Manually trigger coin expiration process
   *
   * Query params:
   * - dryRun: boolean (optional) - If true, simulates expiration without updating database
   *
   * Permission: admin:manage_wallets (or existing admin permission)
   */
  fastify.post(
    '/expire-coins',
    {
      preHandler: [requirePermission(PERMISSION.ADMIN_ACCESS_PANEL)],
    },
    async (request, reply) => {
      const { dryRun } = request.query as { dryRun?: string }
      const isDryRun = dryRun === 'true'

      const currentUser = getCurrentUser(request)
      const admin = await User.findByAuthUserId(currentUser.sub)

      if (!admin) {
        return reply.code(404).send({ message: 'Admin user not found.' })
      }

      logger.info('Manual coin expiration triggered', {
        adminUserId: admin.id,
        adminName: admin.name,
        dryRun: isDryRun,
      })

      try {
        const report = await expireCoins(isDryRun)

        return reply.code(200).send({
          success: true,
          message: isDryRun
            ? 'Dry run completed successfully'
            : 'Coin expiration completed successfully',
          data: report,
        })
      } catch (error) {
        logger.error('Error during manual coin expiration', {
          error,
          adminUserId: admin.id,
        })
        return reply.code(500).send({
          success: false,
          message: 'Failed to expire coins',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    },
  )

  /**
   * GET /admin/wallet-management/expiration-report
   * Get report of coins expiring in the next N days
   *
   * Query params:
   * - days: number (optional, default 90) - How many days to look ahead
   *
   * Permission: admin:access_panel
   */
  fastify.get(
    '/expiration-report',
    {
      preHandler: [requirePermission(PERMISSION.ADMIN_ACCESS_PANEL)],
    },
    async (request, reply) => {
      const { days } = request.query as { days?: string }
      const daysAhead = days ? parseInt(days, 10) : 90

      if (isNaN(daysAhead) || daysAhead < 1 || daysAhead > 365) {
        return reply.code(400).send({
          success: false,
          message: 'Invalid days parameter. Must be between 1 and 365',
        })
      }

      const currentUser = getCurrentUser(request)
      const admin = await User.findByAuthUserId(currentUser.sub)

      if (!admin) {
        return reply.code(404).send({ message: 'Admin user not found.' })
      }

      logger.info('Generating expiration report', {
        adminUserId: admin.id,
        adminName: admin.name,
        days: daysAhead,
      })

      try {
        const report = await getExpirationReport(daysAhead)

        return reply.code(200).send({
          success: true,
          message: 'Expiration report generated successfully',
          data: report,
        })
      } catch (error) {
        logger.error('Error generating expiration report', {
          error,
          adminUserId: admin.id,
        })
        return reply.code(500).send({
          success: false,
          message: 'Failed to generate expiration report',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    },
  )
}
