/**
 * @fileoverview Company Info Routes
 *
 * Routes for managing basic company information (admin only).
 * Base path: /admin/company/info
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { companyInfoService } from './company-info.service'
import {
  getCompanyInfoSchema,
  updateCompanyInfoSchema,
  uploadLogoSchema,
} from './company-info.schemas'
import { requirePermission } from '@/middleware/rbac'
import { PERMISSION } from '@/features/rbac/permissions.constants'
import { getAuth0Id } from '@/middleware/auth'
import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

/**
 * Get company ID from authenticated user
 */
async function getCompanyIdFromUser(auth0Id: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { auth0Id },
    select: { companyId: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return user.companyId
}

export default async function companyInfoRoutes(fastify: FastifyInstance) {
  /**
   * GET /admin/company/info
   * Get basic company information
   */
  fastify.get(
    '/',
    {
      schema: getCompanyInfoSchema,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)

        const info = await companyInfoService.getCompanyInfo(companyId)
        return reply.code(200).send(info)
      } catch (error) {
        logger.error('Failed to get company info', { error })

        if (error instanceof Error && error.message === 'Company not found') {
          return reply.code(404).send({
            error: 'Company not found',
            message: 'No company information found for this user',
          })
        }

        return reply.code(500).send({
          error: 'Internal server error',
          message: 'Failed to retrieve company information',
        })
      }
    },
  )

  /**
   * PATCH /admin/company/info
   * Update basic company information
   */
  fastify.patch(
    '/',
    {
      schema: updateCompanyInfoSchema,
      preHandler: [requirePermission(PERMISSION.COMPANY_MANAGE_SETTINGS)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)

        await companyInfoService.updateCompanyInfo(
          companyId,
          request.body as any,
        )

        return reply.code(200).send()
      } catch (error) {
        logger.error('Failed to update company info', { error })

        return reply.code(400).send({
          error: 'Validation error',
          message: 'Failed to update company information',
        })
      }
    },
  )

  /**
   * POST /admin/company/info/logo
   * Upload company logo (MOCK - to be implemented)
   */
  fastify.post(
    '/logo',
    {
      schema: uploadLogoSchema,
      preHandler: [requirePermission(PERMISSION.COMPANY_MANAGE_SETTINGS)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // MOCK: Just return the provided URL
        // TODO: Implement real file upload (multipart/form-data)
        logger.info('Logo upload endpoint called (MOCK)')

        const body = request.body as { logo_url: string }
        return reply.code(200).send({
          logo_url: body.logo_url,
        })
      } catch (error) {
        logger.error('Failed to upload logo', { error })

        return reply.code(400).send({
          error: 'Invalid file',
          message: 'Invalid file format. Accepted: PNG, JPG, SVG',
        })
      }
    },
  )
}
