/**
 * @fileoverview Company Coin Economy Routes
 *
 * Routes for managing coin economy settings (admin only).
 * Base path: /admin/company/coin-economy
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { companyCoinEconomyService } from './company-coin-economy.service'
import {
  getCoinEconomySchema,
  updateCoinEconomySchema,
} from './company-coin-economy.schemas'
import { requirePermission } from '@/middleware/rbac'
import { PERMISSION } from '@/features/app/rbac/permissions.constants'
import { getAuthUserId } from '@/middleware/auth'
import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

/**
 * Get company ID from authenticated user
 */
async function getCompanyIdFromUser(authUserId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { authUserId },
    select: { companyId: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return user.companyId
}

export default async function companyCoinEconomyRoutes(fastify: FastifyInstance) {
  /**
   * GET /admin/company/coin-economy
   * Get coin economy settings
   */
  fastify.get(
    '/',
    {
      schema: getCoinEconomySchema,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authUserId = getAuthUserId(request)
        const companyId = await getCompanyIdFromUser(authUserId)

        const settings = await companyCoinEconomyService.getCoinEconomy(companyId)
        return reply.code(200).send(settings)
      } catch (error) {
        logger.error('Failed to get coin economy settings', { error })

        return reply.code(500).send({
          error: 'Internal server error',
          message: 'Failed to retrieve coin economy settings',
        })
      }
    },
  )

  /**
   * PATCH /admin/company/coin-economy
   * Update coin economy settings
   */
  fastify.patch(
    '/',
    {
      schema: updateCoinEconomySchema,
      preHandler: [requirePermission(PERMISSION.COMPANY_MANAGE_SETTINGS)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authUserId = getAuthUserId(request)
        const companyId = await getCompanyIdFromUser(authUserId)

        const settings = await companyCoinEconomyService.updateCoinEconomy(
          companyId,
          request.body as any,
        )

        return reply.code(200).send(settings)
      } catch (error) {
        logger.error('Failed to update coin economy settings', { error })

        return reply.code(400).send({
          error: 'Validation error',
          message: 'Failed to update coin economy settings',
        })
      }
    },
  )
}
