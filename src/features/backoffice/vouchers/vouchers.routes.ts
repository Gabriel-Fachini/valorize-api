import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { VoucherProductService } from '@/features/app/prizes/vouchers/voucher-product.service'
import { requireSuperAdmin } from '@/middleware/backoffice'
import { getAuth0Id } from '@/middleware/auth'
import { logger } from '@/lib/logger'
import { User } from '@/features/app/users/user.model'
import { supabaseStorageService } from '@/lib/storage/supabase-storage.service'

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
  // Register multipart support for file uploads
  await fastify.register(import('@fastify/multipart'), {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 4, // Max 4 files at once
    },
  })

  const service = new VoucherProductService()

  /**
   * GET /backoffice/vouchers
   *
   * List all voucher products with filters
   * For management and overview purposes
   */
  fastify.get(
    '/',
    {
      preHandler: [requireSuperAdmin()],
      schema: {
        description: 'List voucher products from catalog',
        tags: ['backoffice', 'vouchers'],
        querystring: {
          type: 'object',
          properties: {
            provider: { type: 'string' },
            category: { type: 'string' },
            currency: { type: 'string' },
            country: { type: 'string' },
            isActive: { type: 'string' },
            limit: { type: 'string' },
            offset: { type: 'string' },
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

        const { provider, category, currency, country, isActive, limit, offset } =
          request.query as {
            provider?: string
            category?: string
            currency?: string
            country?: string
            isActive?: string
            limit?: string
            offset?: string
          }

        const result = await service.listProducts({
          provider,
          category,
          currency,
          country,
          isActive: isActive ? isActive === 'true' : undefined,
          limit: limit ? parseInt(limit) : undefined,
          offset: offset ? parseInt(offset) : undefined,
        })

        return reply.code(200).send({
          success: true,
          ...result,
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to list voucher products'

        logger.error('[Backoffice] Failed to list voucher products', {
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

  /**
   * GET /backoffice/vouchers/all
   *
   * List ALL voucher products (including inactive ones)
   * For comprehensive catalog management and auditing
   *
   * ⚠️ This route bypasses isActive filtering and shows everything
   */
  fastify.get(
    '/all',
    {
      preHandler: [requireSuperAdmin()],
      schema: {
        description: 'List ALL voucher products including inactive',
        tags: ['backoffice', 'vouchers'],
        querystring: {
          type: 'object',
          properties: {
            provider: { type: 'string' },
            category: { type: 'string' },
            currency: { type: 'string' },
            country: { type: 'string' },
            limit: { type: 'string' },
            offset: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              items: { type: 'array' },
              total: { type: 'number' },
              limit: { type: 'number' },
              offset: { type: 'number' },
              summary: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  active: { type: 'number' },
                  inactive: { type: 'number' },
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

        const { provider, category, currency, country, limit, offset } = request.query as {
          provider?: string
          category?: string
          currency?: string
          country?: string
          limit?: string
          offset?: string
        }

        // Fetch all products (no isActive filter)
        const result = await service.listProducts({
          provider,
          category,
          currency,
          country,
          // NOTE: isActive is intentionally omitted to show ALL products
          limit: limit ? parseInt(limit) : undefined,
          offset: offset ? parseInt(offset) : undefined,
        })

        // Calculate summary stats
        const activeCount = result.items.filter((item) => item.isActive).length
        const inactiveCount = result.items.filter((item) => !item.isActive).length

        logger.info('[Backoffice] Listed all voucher products', {
          total: result.total,
          active: activeCount,
          inactive: inactiveCount,
          userId: user.id,
        })

        return reply.code(200).send({
          success: true,
          ...result,
          summary: {
            total: result.total,
            active: activeCount,
            inactive: inactiveCount,
          },
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to list all voucher products'

        logger.error('[Backoffice] Failed to list all voucher products', {
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

  /**
   * GET /backoffice/vouchers/:id
   *
   * Get specific voucher product details
   */
  fastify.get(
    '/:id',
    {
      preHandler: [requireSuperAdmin()],
      schema: {
        description: 'Get voucher product by ID',
        tags: ['backoffice', 'vouchers'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
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

        const { id } = request.params as { id: string }

        const product = await service.getProduct(id)

        if (!product) {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: 'Voucher product not found',
          })
        }

        return reply.code(200).send({
          success: true,
          product,
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to get voucher product'

        logger.error('[Backoffice] Failed to get voucher product', {
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

  /**
   * PATCH /backoffice/vouchers/:id
   *
   * Update voucher product catalog entry
   * Allows editing name, description, brand, images, and active status
   *
   * ⚠️ Super Admin only - This operation affects the global catalog
   */
  fastify.patch(
    '/:id',
    {
      preHandler: [requireSuperAdmin()],
      schema: {
        description: 'Update voucher product catalog entry',
        tags: ['backoffice', 'vouchers'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1 },
            description: { type: 'string' },
            brand: { type: 'string' },
            images: {
              type: 'array',
              items: { type: 'string', format: 'uri' },
            },
            isActive: { type: 'boolean' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              product: { type: 'object' },
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
          404: {
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

        const { id } = request.params as { id: string }
        const updateData = request.body as {
          name?: string
          description?: string
          brand?: string
          images?: string[]
          isActive?: boolean
        }

        logger.info('[Backoffice] Updating voucher product', {
          voucherProductId: id,
          updateData,
          userId: user.id,
        })

        const updatedProduct = await service.updateProduct(id, updateData)

        logger.info('[Backoffice] Voucher product updated successfully', {
          voucherProductId: id,
          userId: user.id,
        })

        return reply.code(200).send({
          success: true,
          message: 'Voucher product updated successfully',
          product: updatedProduct,
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update voucher product'

        logger.error('[Backoffice] Failed to update voucher product', {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        })

        if (error instanceof Error && error.message === 'Product not found') {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: 'Voucher product not found',
          })
        }

        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: errorMessage,
        })
      }
    },
  )

  /**
   * POST /backoffice/vouchers/:id/images
   *
   * Upload images for a voucher product (multipart/form-data)
   * Allows adding custom images to override or complement provider images
   *
   * ⚠️ Super Admin only - This operation affects the global catalog
   */
  fastify.post(
    '/:id/images',
    {
      preHandler: [requireSuperAdmin()],
      schema: {
        description: 'Upload images for voucher product',
        tags: ['backoffice', 'vouchers'],
        consumes: ['multipart/form-data'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              images: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
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
          404: {
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

        const { id } = request.params as { id: string }

        // Check if product exists
        const product = await service.getProduct(id)
        if (!product) {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: 'Voucher product not found',
          })
        }

        // Parse multipart form data
        const parts = request.parts()
        const uploadedUrls: string[] = []
        let fileCount = 0

        for await (const part of parts) {
          if (part.type === 'file') {
            fileCount++

            // Validate file count (max 4)
            if (fileCount > 4) {
              return reply.code(400).send({
                success: false,
                error: 'Bad Request',
                message: 'Maximum 4 files can be uploaded at once',
              })
            }

            // Read file buffer
            const buffer = await part.toBuffer()
            const fileName = part.filename
            const mimeType = part.mimetype

            // Upload to Supabase
            const { publicUrl } = await supabaseStorageService.uploadVoucherImage(
              buffer,
              fileName,
              mimeType,
            )
            uploadedUrls.push(publicUrl)
          }
        }

        // Validate that at least one file was uploaded
        if (uploadedUrls.length === 0) {
          return reply.code(400).send({
            success: false,
            error: 'Bad Request',
            message: 'No files were uploaded. Please provide at least one image file.',
          })
        }

        // Append new images to existing ones
        const updatedImages = [...product.images, ...uploadedUrls]

        // Update product with new images
        await service.updateProduct(id, { images: updatedImages })

        logger.info('[Backoffice] Voucher product images uploaded successfully', {
          voucherProductId: id,
          uploadedCount: uploadedUrls.length,
          totalImages: updatedImages.length,
          userId: user.id,
        })

        return reply.code(200).send({
          success: true,
          message: `${uploadedUrls.length} image(s) uploaded successfully`,
          images: updatedImages,
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to upload images'

        logger.error('[Backoffice] Failed to upload voucher images', {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        })

        if (
          error instanceof Error &&
          (error.message.includes('Maximum') || error.message.includes('Invalid file type'))
        ) {
          return reply.code(400).send({
            success: false,
            error: 'Bad Request',
            message: errorMessage,
          })
        }

        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: errorMessage,
        })
      }
    },
  )

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
