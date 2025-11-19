/**
 * @fileoverview Voucher Product Admin Routes
 *
 * Routes for viewing voucher product catalog (read-only):
 * - GET /admin/voucher-products - List products with filters
 * - GET /admin/voucher-products/:id - Get product details
 *
 * Note: Catalog sync is done via backoffice at POST /backoffice/vouchers/sync
 *
 * @module features/prizes/vouchers/voucher-product.routes
 */

import { FastifyInstance } from 'fastify'
import { VoucherProductService } from './voucher-product.service'
import { logger } from '@/lib/logger'
import { requirePermission } from '@/middleware/rbac'
import { PERMISSION } from '@/features/app/rbac/permissions.constants'

export default async function voucherProductRoutes(fastify: FastifyInstance) {
  const service = new VoucherProductService()

  /**
   * GET /admin/voucher-products
   *
   * Lista produtos com filtros opcionais
   *
   * Query params:
   * - provider: string (ex: 'tremendous')
   * - category: string (ex: 'gift-cards')
   * - currency: string (ex: 'BRL')
   * - country: string (ex: 'BR')
   * - isActive: boolean
   * - limit: number
   * - offset: number
   */
  fastify.get<{
    Querystring: {
      provider?: string
      category?: string
      currency?: string
      country?: string
      isActive?: string // Vem como string do query param
      limit?: string
      offset?: string
    }
  }>(
    '/',
    {
      preHandler: [requirePermission(PERMISSION.PRIZES_READ)],
    },
    async (request, reply) => {
      try {
        const {
          provider,
          category,
          currency,
          country,
          isActive,
          limit,
          offset,
        } = request.query

        const result = await service.listProducts({
          provider,
          category,
          currency,
          country,
          isActive: isActive ? isActive === 'true' : undefined,
          limit: limit ? parseInt(limit) : undefined,
          offset: offset ? parseInt(offset) : undefined,
        })

        return reply.send({
          success: true,
          ...result,
        })
      } catch (error) {
        logger.error('[VoucherProductRoutes] Failed to list products', {
          error: error instanceof Error ? error.message : 'Unknown error',
        })

        return reply.code(500).send({
          success: false,
          message:
            error instanceof Error ? error.message : 'Failed to list products',
        })
      }
    },
  )

  /**
   * GET /admin/voucher-products/:id
   *
   * Busca produto específico por ID
   */
  fastify.get<{
    Params: { id: string }
  }>(
    '/:id',
    {
      preHandler: [requirePermission(PERMISSION.PRIZES_READ)],
    },
    async (request, reply) => {
      try {
        const { id } = request.params

        const product = await service.getProduct(id)

        if (!product) {
          return reply.code(404).send({
            success: false,
            message: 'Product not found',
          })
        }

        return reply.send({
          success: true,
          product,
        })
      } catch (error) {
        logger.error('[VoucherProductRoutes] Failed to get product', {
          error: error instanceof Error ? error.message : 'Unknown error',
        })

        return reply.code(500).send({
          success: false,
          message:
            error instanceof Error ? error.message : 'Failed to get product',
        })
      }
    },
  )
}
