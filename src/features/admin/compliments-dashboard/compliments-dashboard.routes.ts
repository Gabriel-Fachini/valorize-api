/**
 * @fileoverview Compliments Dashboard Routes
 *
 * Comprehensive dashboard route for compliments analytics (admin only).
 * Base path: /admin/compliments-dashboard
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { complimentsDashboardService } from './compliments-dashboard.service'
import {
  getComplimentsDashboardSchema,
  getNetworkGraphSchema,
} from './compliments-dashboard.schemas'
import { requirePermission } from '@/middleware/rbac'
import { requireFeature } from '@/middleware/plan-guard'
import { PERMISSION } from '@/features/app/rbac/permissions.constants'
import { PLAN_FEATURE } from '@/features/app/plans/plan-features.constants'
import { getAuthUserId } from '@/middleware/auth'
import { getCompanyIdFromUser } from '@/lib/utils/auth'
import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import { DashboardFilters } from './compliments-dashboard.types'

/**
 * Parse and validate date parameters
 */
function parseDateParameters(query: any): { startDate: Date; endDate: Date } {
  const now = new Date()

  // Default to last 30 days if no dates provided
  const endDate = query.endDate
    ? new Date(query.endDate)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  const startDate = query.startDate
    ? new Date(query.startDate)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days before end date

  // Validate dates
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Invalid date format')
  }

  if (startDate > endDate) {
    throw new Error('Start date must be before end date')
  }

  // Maximum date range of 1 year
  const oneYearInMs = 365 * 24 * 60 * 60 * 1000
  if (endDate.getTime() - startDate.getTime() > oneYearInMs) {
    throw new Error('Date range cannot exceed 1 year')
  }

  return { startDate, endDate }
}

export default async function complimentsDashboardRoutes(fastify: FastifyInstance) {
  /**
   * GET /admin/compliments-dashboard
   * Get complete compliments dashboard with all metrics
   *
   * This is the main analytics endpoint for the compliments feature.
   * It provides comprehensive metrics about recognition patterns,
   * engagement rates, value distribution, and actionable insights.
   */
  fastify.get(
    '/',
    {
      schema: getComplimentsDashboardSchema,
      preHandler: [requirePermission(PERMISSION.ADMIN_VIEW_ANALYTICS)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Get authenticated user's company
        const authUserId = getAuthUserId(request)
        const companyId = await getCompanyIdFromUser(authUserId)

        // Parse query parameters
        const query = request.query as any
        const { startDate, endDate } = parseDateParameters(query)

        // Build filters object
        const filters: Omit<DashboardFilters, 'startDate' | 'endDate'> = {}

        if (query.departmentId) {
          // Validate department belongs to company
          const department = await prisma.department.findFirst({
            where: {
              id: query.departmentId,
              companyId,
            },
          })

          if (!department) {
            return reply.code(400).send({
              error: 'Invalid department',
              message: 'Department not found or does not belong to your company',
            })
          }

          filters.departmentId = query.departmentId
        }

        if (query.jobTitleId) {
          // Validate job title belongs to company
          const jobTitle = await prisma.jobTitle.findFirst({
            where: {
              id: query.jobTitleId,
              companyId,
            },
          })

          if (!jobTitle) {
            return reply.code(400).send({
              error: 'Invalid job title',
              message: 'Job title not found or does not belong to your company',
            })
          }

          filters.jobTitleId = query.jobTitleId
        }

        // Log the request
        logger.info('Generating compliments dashboard', {
          companyId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          filters,
        })

        // Generate dashboard
        const dashboard = await complimentsDashboardService.getCompleteDashboard(
          companyId,
          startDate,
          endDate,
          filters,
        )

        // Log successful generation
        logger.info('Compliments dashboard generated successfully', {
          companyId,
          executionTime: dashboard.metadata.executionTime,
          totalCompliments: dashboard.overview.totalCompliments,
          activeUsers: dashboard.overview.activeUsers.count,
        })

        return reply.code(200).send(dashboard)
      } catch (error) {
        logger.error('Failed to generate compliments dashboard', { error })

        // Handle specific error cases
        if (error instanceof Error) {
          if (error.message.includes('date')) {
            return reply.code(400).send({
              error: 'Invalid parameters',
              message: error.message,
            })
          }

          if (error.message === 'User not found') {
            return reply.code(401).send({
              error: 'Authentication error',
              message: 'User not found',
            })
          }
        }

        // Generic error response
        return reply.code(500).send({
          error: 'Internal server error',
          message: 'Failed to generate compliments dashboard',
        })
      }
    },
  )

  /**
   * GET /admin/compliments-dashboard/network
   * Get network graph visualization data
   *
   * Returns nodes (users) and links (compliment relationships)
   * for graph visualization of recognition patterns.
   *
   * @requires PROFESSIONAL plan
   */
  fastify.get(
    '/network',
    {
      schema: getNetworkGraphSchema,
      preHandler: [
        requireFeature(PLAN_FEATURE.DASHBOARD_NETWORK_GRAPH),
        requirePermission(PERMISSION.ADMIN_VIEW_ANALYTICS),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Get authenticated user's company
        const authUserId = getAuthUserId(request)
        const companyId = await getCompanyIdFromUser(authUserId)

        // Parse query parameters
        const query = request.query as any
        const { startDate, endDate } = parseDateParameters(query)

        // Parse userIds from comma-separated string
        const userIds = query.userIds
          ? query.userIds.split(',').map((id: string) => id.trim()).filter(Boolean)
          : undefined

        // Build filters
        const filters = {
          startDate,
          endDate,
          department: query.department,
          minConnections: query.minConnections ? Number(query.minConnections) : undefined,
          limit: query.limit ? Number(query.limit) : undefined,
          userIds,
        }

        logger.info('Generating network graph', {
          companyId,
          filters,
        })

        // Generate network graph
        const networkData = await complimentsDashboardService.getNetworkGraph(companyId, filters)

        logger.info('Network graph generated successfully', {
          companyId,
          nodeCount: networkData.nodes.length,
          linkCount: networkData.links.length,
        })

        return reply.code(200).send(networkData)
      } catch (error) {
        logger.error('Failed to generate network graph', { error })

        // Handle specific errors
        if (error instanceof Error) {
          if (error.message.includes('date')) {
            return reply.code(400).send({
              error: 'Invalid parameters',
              message: error.message,
            })
          }

          if (error.message === 'User not found') {
            return reply.code(401).send({
              error: 'Authentication error',
              message: 'User not found',
            })
          }
        }

        // Generic error
        return reply.code(500).send({
          error: 'Internal server error',
          message: 'Failed to generate network graph',
        })
      }
    },
  )
}