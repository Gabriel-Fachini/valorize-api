import { FastifyInstance, FastifyRequest } from 'fastify'
import { getCurrentUser } from '@/middleware/auth'
import { requirePermission } from '@/middleware/rbac'
import { authService } from '../auth/auth.service'
import { dashboardService } from './dashboard.service'
import {
  dashboardStatsSchema,
  DashboardStatsQuery,
} from './dashboard.schemas'
import { PERMISSION } from '@/features/rbac/permissions.constants'

/**
 * Dashboard routes for admin analytics and statistics
 */
export default async function dashboardRoutes(fastify: FastifyInstance) {
  /**
   * GET /dashboard/stats
   *
   * Returns comprehensive dashboard statistics for the authenticated user's company.
   * Includes metrics like total compliments, active users, engagement rate,
   * prizes redeemed, top values, and weekly trends.
   *
   * Required permission: admin:view_analytics
   *
   * @queryParam days - Number of days to include in statistics (1-365, default: 30)
   */
  fastify.get(
    '/stats',
    {
      preHandler: [requirePermission(PERMISSION.ADMIN_VIEW_ANALYTICS)],
      schema: dashboardStatsSchema,
    },
    async (
      request: FastifyRequest<{ Querystring: DashboardStatsQuery }>,
      reply,
    ) => {
      const currentUser = getCurrentUser(request)

      try {
        const { days = 30 } = request.query

        // Get company ID efficiently without fetching full user object
        const companyId = await authService.getCompanyId(currentUser.sub)

        const stats = await dashboardService.getCompanyStats(companyId, days)

        return reply.send(stats)
      } catch (error) {
        return reply.code(500).send({
          message: 'Failed to retrieve dashboard statistics',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    },
  )
}
