import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { VoucherProductService } from '@/features/app/prizes/vouchers/voucher-product.service'
import { requireSuperAdmin } from '@/middleware/backoffice'
import { getAuth0Id } from '@/middleware/auth'
import { logger } from '@/lib/logger'
import { User } from '@/features/app/users/user.model'

/**
 * Backoffice Vouchers Routes
 *
 * Global voucher catalog management for Super Admins from Valorize HQ
 * All routes require Super Admin authentication
 */
export const backofficeVouchersRoutes = async (
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
) => {
  const service = new VoucherProductService()

  /**
   * POST /backoffice/vouchers/sync
   *
   * Sync voucher catalog from Tremendous API
   * This creates/updates global voucher products and prizes available to all companies
   *
   * ⚠️ Super Admin only - This operation affects all companies
   */
  fastify.post(
    '/sync',
    {
      preHandler: [requireSuperAdmin()],
      schema: {
        description: 'Sync voucher catalog from Tremendous API',
        tags: ['backoffice', 'vouchers'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              result: {
                type: 'object',
                properties: {
                  syncedProducts: { type: 'number' },
                  createdPrizes: { type: 'number' },
                  reactivatedPrizes: { type: 'number' },
                  deactivatedProducts: { type: 'number' },
                  deactivatedPrizes: { type: 'number' },
                },
              },
            },
          },
          401: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          500: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const auth0Id = getAuth0Id(request)

        const user = await User.findByAuth0Id(auth0Id)
        if (!user) {
          return reply.code(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'User not found',
          })
        }

        logger.info('[Backoffice] Voucher catalog sync requested', {
          userId: user.id,
          companyId: user.companyId,
        })

        const result = await service.syncCatalog('tremendous')

        logger.info('[Backoffice] Voucher catalog sync completed successfully', {
          result,
          userId: user.id,
        })

        return reply.code(200).send({
          success: true,
          message: 'Catalog synced successfully',
          result,
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to sync voucher catalog'

        logger.error('[Backoffice] Voucher catalog sync failed', {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        })

        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: errorMessage,
        })
      }
    },
  )
}
