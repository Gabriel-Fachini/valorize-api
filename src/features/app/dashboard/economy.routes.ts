import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { economyDashboardService } from './economy.service'
import { getEconomyDashboardSchema } from './economy.schemas'
import { requirePermission } from '@/middleware/rbac'
import { requireFeature } from '@/middleware/plan-guard'
import { PERMISSION } from '@/features/app/rbac/permissions.constants'
import { PLAN_FEATURE } from '@/features/app/plans/plan-features.constants'
import { getAuthUserId } from '@/middleware/auth'
import { getCompanyIdFromUser } from '@/lib/utils/auth'
import { logger } from '@/lib/logger'

/**
 * Economy Dashboard Routes
 * Base path: /admin/dashboard/economy
 */
export default async function economyDashboardRoutes(fastify: FastifyInstance) {
  /**
   * GET /admin/dashboard/economy
   * Get complete economy dashboard
   */
  fastify.get(
    '/',
    {
      schema: getEconomyDashboardSchema,
      preHandler: [requirePermission(PERMISSION.ADMIN_VIEW_ANALYTICS)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authUserId = getAuthUserId(request)
        const companyId = await getCompanyIdFromUser(authUserId)

        const dashboard = await economyDashboardService.getEconomyDashboard(companyId)

        return reply.code(200).send(dashboard)
      } catch (error) {
        logger.error('Failed to get economy dashboard', { error })

        return reply.code(500).send({
          error: 'Internal server error',
          message: 'Failed to retrieve economy dashboard',
        })
      }
    },
  )

  /**
   * GET /admin/dashboard/economy/wallet-history
   * Get paginated wallet deposit history
   *
   * @requires PROFESSIONAL plan
   */
  fastify.get<{ Querystring: { limit?: string } }>(
    '/wallet-history',
    {
      preHandler: [
        requireFeature(PLAN_FEATURE.ECONOMY_WALLET_HISTORY),
        requirePermission(PERMISSION.ADMIN_VIEW_ANALYTICS),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authUserId = getAuthUserId(request)
        const companyId = await getCompanyIdFromUser(authUserId)
        const limit = (request.query as { limit?: string }).limit
          ? parseInt((request.query as { limit?: string }).limit!)
          : 20

        const history = await economyDashboardService.getDepositHistory(companyId, limit)

        return reply.code(200).send({
          deposits: history,
          total: history.length,
        })
      } catch (error) {
        logger.error('Failed to get wallet history', { error })

        return reply.code(500).send({
          error: 'Internal server error',
          message: 'Failed to retrieve wallet history',
        })
      }
    },
  )
}
