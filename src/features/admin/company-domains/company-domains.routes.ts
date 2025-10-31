/**
 * @fileoverview Company Domains Routes
 *
 * Routes for managing allowed domains for SSO (admin only).
 * Base path: /admin/company/domains
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { companyDomainsService } from './company-domains.service'
import {
  listDomainsSchema,
  replaceDomainsSchema,
  addDomainSchema,
  removeDomainSchema,
} from './company-domains.schemas'
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

export default async function companyDomainsRoutes(fastify: FastifyInstance) {
  /**
   * GET /admin/company/domains
   * List all allowed domains
   */
  fastify.get(
    '/',
    {
      schema: listDomainsSchema,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)

        const domains = await companyDomainsService.listDomains(companyId)
        return reply.code(200).send(domains)
      } catch (error) {
        logger.error('Failed to list domains', { error })

        return reply.code(500).send({
          error: 'Internal server error',
          message: 'Failed to retrieve domains',
        })
      }
    },
  )

  /**
   * PUT /admin/company/domains
   * Replace all allowed domains
   */
  fastify.put(
    '/',
    {
      schema: replaceDomainsSchema,
      preHandler: [requirePermission(PERMISSION.COMPANY_MANAGE_SETTINGS)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)

        const body = request.body as { domains: string[] }
        const domains = await companyDomainsService.replaceDomains(companyId, body.domains)

        return reply.code(200).send(domains)
      } catch (error) {
        logger.error('Failed to replace domains', { error })

        return reply.code(400).send({
          error: 'Validation error',
          message: error instanceof Error ? error.message : 'Failed to replace domains',
        })
      }
    },
  )

  /**
   * POST /admin/company/domains
   * Add a new allowed domain
   */
  fastify.post(
    '/',
    {
      schema: addDomainSchema,
      preHandler: [requirePermission(PERMISSION.COMPANY_MANAGE_SETTINGS)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)

        const domain = await companyDomainsService.addDomain(companyId, request.body as any)

        return reply.code(201).send(domain)
      } catch (error) {
        logger.error('Failed to add domain', { error })

        if (error instanceof Error && error.message === 'Domain already exists for this company') {
          return reply.code(409).send({
            error: 'Duplicate domain',
            message: error.message,
          })
        }

        return reply.code(400).send({
          error: 'Validation error',
          message: 'Failed to add domain',
        })
      }
    },
  )

  /**
   * DELETE /admin/company/domains/:id
   * Remove a specific allowed domain
   */
  fastify.delete(
    '/:id',
    {
      schema: removeDomainSchema,
      preHandler: [requirePermission(PERMISSION.COMPANY_MANAGE_SETTINGS)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)
        const domainId = (request.params as any).id

        await companyDomainsService.removeDomain(companyId, domainId)

        return reply.code(204).send()
      } catch (error) {
        logger.error('Failed to remove domain', { error })

        if (error instanceof Error && error.message === 'Domain not found') {
          return reply.code(404).send({
            error: 'Not found',
            message: error.message,
          })
        }

        if (
          error instanceof Error &&
          error.message === 'Cannot remove the last domain. At least one domain is required.'
        ) {
          return reply.code(400).send({
            error: 'Validation error',
            message: error.message,
          })
        }

        return reply.code(500).send({
          error: 'Internal server error',
          message: 'Failed to remove domain',
        })
      }
    },
  )
}
