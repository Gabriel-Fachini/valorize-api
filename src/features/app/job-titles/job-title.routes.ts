/**
 * Job Titles Routes
 * Routes for managing job titles
 * Base path: /job-titles
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { jobTitleService } from './job-title.service'
import { getJobTitlesByDepartmentSchema } from './job-title.schemas'
import { requirePermission } from '@/middleware/rbac'
import { PERMISSION } from '@/features/app/rbac/permissions.constants'
import { getAuthUserId } from '@/middleware/auth'
import { getCompanyIdFromUser } from '@/lib/utils/auth'
import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

export default async function jobTitlesRoutes(fastify: FastifyInstance) {
  // ============================================================================
  // GET JOB TITLES BY DEPARTMENT
  // ============================================================================
  fastify.get(
    '/by-department',
    {
      schema: getJobTitlesByDepartmentSchema,
      preHandler: [requirePermission(PERMISSION.USERS_READ)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authUserId = getAuthUserId(request)
        const companyId = await getCompanyIdFromUser(authUserId)

        const query = request.query as { departmentId?: string }
        const departmentId = query.departmentId

        if (!departmentId) {
          return reply.code(400).send({
            error: 'Bad Request',
            message: 'departmentId query parameter is required',
            statusCode: 400,
          })
        }

        // Validate that the department belongs to the company
        const departmentExists = await prisma.department.findFirst({
          where: {
            id: departmentId,
            companyId,
          },
        })

        if (!departmentExists) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'Department not found',
            statusCode: 404,
          })
        }

        const jobTitles = await jobTitleService.getJobTitlesByDepartment(
          companyId,
          departmentId,
        )

        return reply.code(200).send(jobTitles)
      } catch (error) {
        logger.error('Failed to get job titles by department', { error })
        throw error
      }
    },
  )
}
