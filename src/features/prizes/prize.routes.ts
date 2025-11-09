import { FastifyInstance, FastifyRequest } from 'fastify'
import { getCurrentUser } from '@/middleware/auth'
import { User } from '../users/user.model'
import { prizeService } from './prize.service'
import {
  listPrizesSchema,
  getPrizeDetailsSchema,
  createPrizeSchema,
  addVariantSchema,
} from './prize.schemas'

export default async function prizeRoutes(fastify: FastifyInstance) {
  // Public routes (authenticated users)
  
  // GET /prizes/catalog - List available prizes
  fastify.get(
    '/catalog',
    {
      schema: listPrizesSchema,
    },
    async (
      request: FastifyRequest<{
        Querystring: {
          category?: string
          type?: string
          minPrice?: number
          maxPrice?: number
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
        const prizes = await prizeService.listAvailablePrizes(
          user.companyId,
          request.query,
        )
        return reply.send({ prizes })
      } catch (error) {
        return reply.code(400).send({
          message:
            error instanceof Error ? error.message : 'Failed to list prizes',
        })
      }
    },
  )

  // GET /prizes/catalog/:id - Get prize details
  fastify.get(
    '/catalog/:id',
    {
      schema: getPrizeDetailsSchema,
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
        const prize = await prizeService.getPrizeDetails(
          request.params.id,
          user.companyId,
        )
        return reply.send({ prize })
      } catch (error) {
        return reply.code(404).send({
          message:
            error instanceof Error ? error.message : 'Prize not found',
        })
      }
    },
  )

  // GET /prizes/categories - Get available categories
  fastify.get('/categories', async (request, reply) => {
    const currentUser = getCurrentUser(request)
    const user = await User.findByAuth0Id(currentUser.sub)

    if (!user) {
      return reply.code(404).send({ message: 'User not found' })
    }

    try {
      const categories = await prizeService.getAvailableCategories(
        user.companyId,
      )
      return reply.send({ categories })
    } catch (error) {
      return reply.code(400).send({
        message:
          error instanceof Error ? error.message : 'Failed to get categories',
      })
    }
  })

  // Admin routes
  
  // POST /prizes - Create prize
  fastify.post(
    '/',
    {
      schema: createPrizeSchema,
    },
    async (
      request: FastifyRequest<{
        Body: {
          name: string
          description: string
          category: string
          images: string[]
          coinPrice: number
          brand?: string
          specifications?: Record<string, any>
          stock: number
          isGlobal?: boolean
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
        const { isGlobal, ...prizeData } = request.body
        
        // Se isGlobal = true, companyId será null (prêmio disponível para todos)
        // Se isGlobal = false ou undefined, prêmio é específico da empresa
        const companyId = isGlobal ? null : user.companyId

        const prize = await prizeService.createPrize(companyId, prizeData)
        
        return reply.code(201).send({
          message: 'Prize created successfully',
          prize,
        })
      } catch (error) {
        return reply.code(400).send({
          message:
            error instanceof Error ? error.message : 'Failed to create prize',
        })
      }
    },
  )

  // POST /prizes/:id/variants - Add variant to prize
  fastify.post(
    '/:id/variants',
    {
      schema: addVariantSchema,
    },
    async (
      request: FastifyRequest<{
        Params: { id: string }
        Body: {
          name: string
          value: string
          stock: number
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
        const variant = await prizeService.addVariant(
          request.params.id,
          user.companyId,
          request.body,
        )

        return reply.code(201).send({
          message: 'Prize variant added successfully',
          variant,
        })
      } catch (error) {
        return reply.code(400).send({
          message:
            error instanceof Error ? error.message : 'Failed to add variant',
        })
      }
    },
  )

  // PATCH /prizes/:id - Update prize
  fastify.patch(
    '/:id',
    async (
      request: FastifyRequest<{
        Params: { id: string }
        Body: {
          name?: string
          description?: string
          isActive?: boolean
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
        const { name, description, isActive } = request.body

        // Validar que pelo menos um campo foi fornecido
        if (name === undefined && description === undefined && isActive === undefined) {
          return reply.code(400).send({
            message: 'At least one field (name, description, or isActive) must be provided',
          })
        }

        const updatedPrize = await prizeService.updatePrize(
          request.params.id,
          user.companyId,
          {
            ...(name && { name }),
            ...(description && { description }),
            ...(isActive !== undefined && { isActive }),
          },
        )

        return reply.send({
          message: 'Prize updated successfully',
          prize: updatedPrize,
        })
      } catch (error) {
        if (error instanceof Error && error.message === 'Prize not found') {
          return reply.code(404).send({
            message: error.message,
          })
        }

        if (error instanceof Error && error.message === 'Prize does not belong to this company') {
          return reply.code(403).send({
            message: error.message,
          })
        }

        return reply.code(400).send({
          message:
            error instanceof Error ? error.message : 'Failed to update prize',
        })
      }
    },
  )
}

