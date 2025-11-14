import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { economyDashboardService } from './economy.service'
import { getEconomyDashboardSchema } from './economy.schemas'
import { requirePermission } from '@/middleware/rbac'
import { PERMISSION } from '@/features/rbac/permissions.constants'
import { getAuth0Id } from '@/middleware/auth'
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
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)

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
   */
  fastify.get<{ Querystring: { limit?: string } }>(
    '/wallet-history',
    {
      preHandler: [requirePermission(PERMISSION.ADMIN_VIEW_ANALYTICS)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)
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
