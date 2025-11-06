/**
 * @fileoverview Voucher Product Admin Routes
 *
 * Routes for managing voucher product catalog:
 * - POST /admin/voucher-products/sync - Sync catalog from provider
 * - GET /admin/voucher-products - List products with filters
 * - GET /admin/voucher-products/:id - Get product details
 *
 * @module features/prizes/vouchers/voucher-product.routes
 */

import { FastifyInstance, FastifyRequest } from 'fastify'
import { VoucherProductService } from './voucher-product.service'
import { logger } from '@/lib/logger'

export default async function voucherProductRoutes(fastify: FastifyInstance) {
  const service = new VoucherProductService()

  /**
   * POST /admin/voucher-products/sync
   *
   * Sincroniza catálogo de produtos do provider (Tremendous)
   *
   * Busca produtos disponíveis para Brasil (BR, BRL) e salva no banco
   */
  fastify.post('/sync', async (request, reply) => {
    // TODO: Adicionar middleware de autenticação/permissão admin

    try {
      logger.info('[VoucherProductRoutes] Sync requested')

      const result = await service.syncCatalog('tremendous')

      logger.info('[VoucherProductRoutes] Sync completed successfully', {
        result,
      })

      return reply.code(200).send({
        success: true,
        message: 'Catalog synced successfully',
        result,
      })
    } catch (error) {
      logger.error('[VoucherProductRoutes] Sync failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      return reply.code(500).send({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to sync voucher catalog',
      })
    }
  })

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
  fastify.get(
    '/',
    async (
      request: FastifyRequest<{
        Querystring: {
          provider?: string
          category?: string
          currency?: string
          country?: string
          isActive?: string // Vem como string do query param
          limit?: string
          offset?: string
        }
      }>,
      reply,
    ) => {
      // TODO: Adicionar middleware de autenticação/permissão admin

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
  fastify.get(
    '/:id',
    async (
      request: FastifyRequest<{
        Params: { id: string }
      }>,
      reply,
    ) => {
      // TODO: Adicionar middleware de autenticação/permissão admin

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
