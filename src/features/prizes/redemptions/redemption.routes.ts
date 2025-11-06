import { FastifyInstance, FastifyRequest } from 'fastify'
import { getCurrentUser } from '@/middleware/auth'
import { requirePermission } from '@/middleware/rbac'
import { User } from '@/features/users/user.model'
import { redemptionService } from './redemption.service'
import {
  redeemPrizeSchema,
  getUserRedemptionsSchema,
  getRedemptionDetailsSchema,
  cancelRedemptionSchema,
} from './redemption.schemas'
import { PERMISSION } from '@/features/rbac/permissions.constants'

interface BulkRedeemBody {
  items: Array<{
    userId: string
    prizeId: string
    addressId?: string
  }>
}

export default async function redemptionRoutes(fastify: FastifyInstance) {
  // POST /redemptions/bulk-redeem - Bulk redeem vouchers (max 100 items) - ADMIN ONLY
  fastify.post<{ Body: BulkRedeemBody }>(
    '/bulk-redeem',
    {
      preHandler: [requirePermission(PERMISSION.STORE_BULK_REDEEM_ADMIN)],
    },
    async (request, reply) => {
      const currentUser = getCurrentUser(request)
      const user = await User.findByAuth0Id(currentUser.sub)

      if (!user) {
        return reply.code(404).send({ message: 'User not found' })
      }

      try {
        const { items } = request.body

        // Validar que items é um array
        if (!Array.isArray(items)) {
          return reply.code(400).send({
            message: 'Items must be an array',
          })
        }

        // Validar quantidade máxima (agora 100 para testes)
        if (items.length === 0 || items.length > 100) {
          return reply.code(400).send({
            message: 'Bulk redemption accepts between 1 and 100 items',
          })
        }

        // Validar estrutura de cada item
        for (const item of items) {
          if (!item.userId || !item.prizeId) {
            return reply.code(400).send({
              message: 'Each item must have userId and prizeId',
            })
          }
        }

        const results = await redemptionService.bulkRedeemVouchers(items, user.companyId)

        return reply.code(207).send({
          message: 'Bulk redemption completed',
          summary: {
            total: results.length,
            successful: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
          },
          results,
        })
      } catch (error) {
        return reply.code(400).send({
          message: error instanceof Error ? error.message : 'Failed to process bulk redemption',
        })
      }
    },
  )

  // POST /redemptions/redeem - Redeem a prize
  fastify.post(
    '/redeem',
    {
      schema: redeemPrizeSchema,
    },
    async (
      request: FastifyRequest<{
        Body: {
          prizeId: string
          variantId?: string
          addressId: string
        }
      }>,
      reply,
    ) => {
      const currentUser = getCurrentUser(request)
      const user = await User.findByAuth0Id(currentUser.sub)

      if (!user) {
        return reply.code(404).send({ message: 'User not found' })
      }

      try {
        const redemption = await redemptionService.redeemPrize({
          userId: user.id,
          companyId: user.companyId,
          prizeId: request.body.prizeId,
          variantId: request.body.variantId,
          addressId: request.body.addressId,
        })

        return reply.code(201).send({
          message: 'Prize redeemed successfully',
          redemption,
        })
      } catch (error) {
        if (error instanceof Error) {
          // Erros específicos com códigos HTTP apropriados
          if (error.name === 'InsufficientBalanceError') {
            return reply.code(400).send({ message: error.message })
          }
          if (error.name === 'InsufficientStockError') {
            return reply.code(409).send({ message: error.message })
          }
          if (error.name === 'VariantRequiredError') {
            return reply.code(400).send({ message: error.message })
          }
        }

        return reply.code(400).send({
          message:
            error instanceof Error
              ? error.message
              : 'Failed to redeem prize',
        })
      }
    },
  )

  // GET /redemptions/my-redemptions - Get user's redemptions
  fastify.get(
    '/my-redemptions',
    {
      schema: getUserRedemptionsSchema,
    },
    async (
      request: FastifyRequest<{
        Querystring: {
          limit?: number
          offset?: number
        }
      }>,
      reply,
    ) => {
      const currentUser = getCurrentUser(request)
      const user = await User.findByAuth0Id(currentUser.sub)

      if (!user) {
        return reply.code(404).send({ message: 'User not found' })
      }

      try {
        const { limit = 20, offset = 0 } = request.query

        const redemptions = await redemptionService.getUserRedemptions(
          user.id,
          { limit, offset },
        )

        return reply.send({
          redemptions,
          meta: {
            limit,
            offset,
            count: redemptions.length,
          },
        })
      } catch (error) {
        return reply.code(400).send({
          message:
            error instanceof Error
              ? error.message
              : 'Failed to get redemptions',
        })
      }
    },
  )

  // GET /redemptions/my-redemptions/:id - Get redemption details
  fastify.get(
    '/my-redemptions/:id',
    {
      schema: getRedemptionDetailsSchema,
    },
    async (
      request: FastifyRequest<{
        Params: { id: string }
      }>,
      reply,
    ) => {
      const currentUser = getCurrentUser(request)
      const user = await User.findByAuth0Id(currentUser.sub)

      if (!user) {
        return reply.code(404).send({ message: 'User not found' })
      }

      try {
        const redemption = await redemptionService.getRedemptionDetails(
          request.params.id,
          user.id,
        )

        return reply.send({ redemption })
      } catch (error) {
        return reply.code(404).send({
          message:
            error instanceof Error
              ? error.message
              : 'Redemption not found',
        })
      }
    },
  )

  // POST /redemptions/my-redemptions/:id/cancel - Cancel redemption
  fastify.post(
    '/my-redemptions/:id/cancel',
    {
      schema: cancelRedemptionSchema,
    },
    async (
      request: FastifyRequest<{
        Params: { id: string }
        Body: {
          reason: string
        }
      }>,
      reply,
    ) => {
      const currentUser = getCurrentUser(request)
      const user = await User.findByAuth0Id(currentUser.sub)

      if (!user) {
        return reply.code(404).send({ message: 'User not found' })
      }

      try {
        const result = await redemptionService.cancelRedemption(
          request.params.id,
          user.id,
          request.body.reason,
        )

        return reply.send(result)
      } catch (error) {
        if (error instanceof Error) {
          // Erros específicos com códigos HTTP apropriados
          if (error.name === 'CannotCancelShippedOrderError') {
            return reply.code(400).send({ message: error.message })
          }
          if (error.name === 'CancellationPeriodExpiredError') {
            return reply.code(400).send({ message: error.message })
          }
        }

        return reply.code(400).send({
          message:
            error instanceof Error
              ? error.message
              : 'Failed to cancel redemption',
        })
      }
    },
  )
}

