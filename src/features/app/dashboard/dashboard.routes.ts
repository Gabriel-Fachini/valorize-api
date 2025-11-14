import { FastifyInstance, FastifyRequest } from 'fastify'
import { getCurrentUser } from '@/middleware/auth'
import { requirePermission } from '@/middleware/rbac'
import { authService } from '../auth/auth.service'
import { dashboardService } from './dashboard.service'
import {
  dashboardStatsSchema,
  DashboardStatsQuery,
} from './dashboard.schemas'
import { PERMISSION } from '@/features/app/rbac/permissions.constants'
import { departmentService } from '../departments/department.service'
import { jobTitleService } from '../job-titles/job-title.service'

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
   * @queryParam startDate - Start date for statistics (ISO 8601 format: YYYY-MM-DD)
   * @queryParam endDate - End date for statistics (ISO 8601 format: YYYY-MM-DD)
   * @queryParam departmentId - Filter by department ID
   * @queryParam jobTitleId - Filter by job title ID
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
        const { startDate, endDate, departmentId, jobTitleId } = request.query

        // Get company ID efficiently without fetching full user object
        const companyId = await authService.getCompanyId(currentUser.sub)

        // Validate that department/jobTitle belong to the company if provided
        if (departmentId) {
          const isValid = await departmentService.validateDepartmentBelongsToCompany(
            departmentId,
            companyId,
          )
          if (!isValid) {
            return reply.code(400).send({
              message: 'Department does not belong to your company',
            })
          }
        }

        if (jobTitleId) {
          const isValid = await jobTitleService.validateJobTitleBelongsToCompany(
            jobTitleId,
            companyId,
          )
          if (!isValid) {
            return reply.code(400).send({
              message: 'Job title does not belong to your company',
            })
          }
        }

        const stats = await dashboardService.getCompanyStats(companyId, {
          startDate,
          endDate,
          departmentId,
          jobTitleId,
        })

        return reply.send(stats)
      } catch (error) {
        return reply.code(500).send({
          message: 'Failed to retrieve dashboard statistics',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    },
  )

  /**
   * GET /dashboard/departments
   *
   * Returns list of all departments in the authenticated user's company
   * with user counts for filtering purposes.
   *
   * Required permission: admin:view_analytics
   */
  fastify.get(
    '/departments',
    {
      preHandler: [requirePermission(PERMISSION.ADMIN_VIEW_ANALYTICS)],
    },
    async (request, reply) => {
      const currentUser = getCurrentUser(request)

      try {
        const companyId = await authService.getCompanyId(currentUser.sub)
        const departments = await departmentService.getDepartmentsByCompany(companyId)

        return reply.send(departments)
      } catch (error) {
        return reply.code(500).send({
          message: 'Failed to retrieve departments',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    },
  )

  /**
   * GET /dashboard/job-titles
   *
   * Returns list of all job titles in the authenticated user's company
   * with user counts for filtering purposes.
   *
   * Required permission: admin:view_analytics
   */
  fastify.get(
    '/job-titles',
    {
      preHandler: [requirePermission(PERMISSION.ADMIN_VIEW_ANALYTICS)],
    },
    async (request, reply) => {
      const currentUser = getCurrentUser(request)

      try {
        const companyId = await authService.getCompanyId(currentUser.sub)
        const jobTitles = await jobTitleService.getJobTitlesByCompany(companyId)

        return reply.send(jobTitles)
      } catch (error) {
        return reply.code(500).send({
          message: 'Failed to retrieve job titles',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    },
  )

  // Economy dashboard routes - /dashboard/economy/*
  await fastify.register(
    async function (fastify) {
      const { default: economyDashboardRoutes } = await import(
        '@/features/app/dashboard/economy.routes'
      )
      await fastify.register(economyDashboardRoutes)
    },
    { prefix: '/economy' },
  )
}
