/**
 * @fileoverview Company Settings Routes
 *
 * Routes for managing company settings (admin only).
 * Base path: /admin/company
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { companySettingsService } from './company-settings.service'
import {
  getCompanySettingsSchema,
  updateCompanySettingsSchema,
  updateBasicInfoSchema,
  updateDomainsSchema,
  updateCoinEconomySchema,
  uploadLogoSchema,
} from './company-settings.schemas'
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

export default async function companySettingsRoutes(fastify: FastifyInstance) {
  /**
   * GET /admin/company/settings
   * Get company settings for the authenticated user's company
   */
  fastify.get(
    '/settings',
    {
      schema: getCompanySettingsSchema,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)

        const settings = await companySettingsService.getCompanySettings(companyId)
        return reply.code(200).send(settings)
      } catch (error) {
        logger.error('Failed to get company settings', { error })

        if (error instanceof Error && error.message === 'Company not found') {
          return reply.code(404).send({
            error: 'Company not found',
            message: 'No company settings found for this user',
          })
        }

        return reply.code(500).send({
          error: 'Internal server error',
          message: 'Failed to retrieve company settings',
        })
      }
    },
  )

  /**
   * PUT /admin/company/settings
   * Update all company settings (full replacement)
   */
  fastify.put(
    '/settings',
    {
      schema: updateCompanySettingsSchema,
      preHandler: [requirePermission(PERMISSION.COMPANY_MANAGE_SETTINGS)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)

        const settings = await companySettingsService.updateFullSettings(
          companyId,
          request.body as any,
        )

        return reply.code(200).send(settings)
      } catch (error) {
        logger.error('Failed to update company settings', { error })

        return reply.code(400).send({
          error: 'Validation error',
          message: 'Failed to update company settings',
        })
      }
    },
  )

  /**
   * PATCH /admin/company/settings/basic-info
   * Update basic company information (name and logo)
   */
  fastify.patch(
    '/settings/basic-info',
    {
      schema: updateBasicInfoSchema,
      preHandler: [requirePermission(PERMISSION.COMPANY_MANAGE_SETTINGS)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)

        const settings = await companySettingsService.updateBasicInfo(
          companyId,
          request.body as any,
        )

        return reply.code(200).send(settings)
      } catch (error) {
        logger.error('Failed to update basic info', { error })

        return reply.code(400).send({
          error: 'Validation error',
          message: 'Company name is required and must be between 3 and 100 characters',
        })
      }
    },
  )

  /**
   * PATCH /admin/company/settings/domains
   * Update allowed domains for SSO
   */
  fastify.patch(
    '/settings/domains',
    {
      schema: updateDomainsSchema,
      preHandler: [requirePermission(PERMISSION.COMPANY_MANAGE_SETTINGS)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)

        const body = request.body as { domains: string[] }
        const settings = await companySettingsService.updateDomains(
          companyId,
          body.domains,
        )

        return reply.code(200).send(settings)
      } catch (error) {
        logger.error('Failed to update domains', { error })

        return reply.code(400).send({
          error: 'Validation error',
          message: 'At least one domain is required',
        })
      }
    },
  )

  /**
   * PATCH /admin/company/settings/coin-economy
   * Update coin economy settings
   */
  fastify.patch(
    '/settings/coin-economy',
    {
      schema: updateCoinEconomySchema,
      preHandler: [requirePermission(PERMISSION.COMPANY_MANAGE_SETTINGS)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)

        const settings = await companySettingsService.updateCoinEconomy(
          companyId,
          request.body as any,
        )

        return reply.code(200).send(settings)
      } catch (error) {
        logger.error('Failed to update coin economy', { error })

        return reply.code(400).send({
          error: 'Validation error',
          message: 'Invalid coin economy settings',
        })
      }
    },
  )

  /**
   * POST /admin/company/logo
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
