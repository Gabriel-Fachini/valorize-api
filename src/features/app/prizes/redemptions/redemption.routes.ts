import { FastifyInstance, FastifyRequest } from 'fastify'
import { getCurrentUser } from '@/middleware/auth'
import { User } from '@/features/app/users/user.model'
import { redemptionService } from './redemption.service'
import {
  redeemPrizeSchema,
  getUserRedemptionsSchema,
  getRedemptionDetailsSchema,
  cancelRedemptionSchema,
} from './redemption.schemas'

export default async function redemptionRoutes(fastify: FastifyInstance) {

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

