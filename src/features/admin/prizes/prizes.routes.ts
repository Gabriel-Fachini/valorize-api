import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { requirePermission } from '@/middleware/rbac'
import { PERMISSION } from '@/features/rbac/permissions.constants'
import { getAuth0Id, getCurrentUser } from '@/middleware/auth'
import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import { prizesService } from './prizes.service'
import { supabaseStorageService } from '@/lib/storage/supabase-storage.service'
import { rbacService } from '@/features/rbac/rbac.service'
import { InsufficientPermissionError } from '@/middleware/error-handler'
import type {
  CreatePrizeRequest,
  UpdatePrizeRequest,
  ListPrizesQuery,
} from './types'
import {
  createPrizeSchema,
  listPrizesSchema,
  getPrizeSchema,
  updatePrizeSchema,
  deletePrizeSchema,
  uploadImagesSchema,
  deleteImageSchema,
} from './prizes.schemas'

export default async function prizesRoutes(fastify: FastifyInstance) {
  // Register multipart support for file uploads
  await fastify.register(import('@fastify/multipart'), {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 4, // Max 4 files at once
    },
  })

  /**
   * Helper function to get company ID from Auth0 user ID
   */
  async function getCompanyIdFromUser(auth0Id: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { auth0Id },
      select: { companyId: true },
    })

    if (!user || !user.companyId) {
      throw new Error('User or company not found')
    }

    return user.companyId
  }

  /**
   * POST /admin/prizes
   * Create a new prize (without images initially)
   */
  fastify.post<{ Body: CreatePrizeRequest }>(
    '/',
    {
      schema: createPrizeSchema,
      preHandler: [requirePermission(PERMISSION.PRIZES_CREATE)],
    },
    async (request: FastifyRequest<{ Body: CreatePrizeRequest }>, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)
        const body = request.body

        // Additional validation: Only SUPER_ADMIN can create global prizes
        if (body.isGlobal) {
          const { allowed, userPermissions } = await rbacService.checkPermissionWithDetails(
            auth0Id,
            PERMISSION.PRIZES_CREATE_GLOBAL,
          )

          if (!allowed) {
            throw new InsufficientPermissionError(
              PERMISSION.PRIZES_CREATE_GLOBAL,
              userPermissions,
              'Only Super Administrators can create global prizes. Set isGlobal to false to create a company-specific prize.',
            )
          }
        }

        const prize = await prizesService.createPrize(companyId, body)

        return reply.code(201).send({ prize })
      } catch (error) {
        logger.error('Error creating prize', { error })

        // Handle InsufficientPermissionError specifically
        if (error instanceof InsufficientPermissionError) {
          return reply.code(403).send({
            error: 'Insufficient Permission',
            message: error.message,
            required: error.required,
            current: error.current,
          })
        }

        return reply.code(500).send({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Failed to create prize',
        })
      }
    },
  )

  /**
   * GET /admin/prizes
   * List all prizes with filtering and pagination
   */
  fastify.get<{ Querystring: ListPrizesQuery }>(
    '/',
    {
      schema: listPrizesSchema,
      preHandler: [requirePermission(PERMISSION.PRIZES_READ)],
    },
    async (request: FastifyRequest<{ Querystring: ListPrizesQuery }>, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)
        const query = request.query

        const result = await prizesService.listPrizes(companyId, query)

        return reply.code(200).send(result)
      } catch (error) {
        logger.error('Error listing prizes', { error })
        return reply.code(500).send({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Failed to list prizes',
        })
      }
    },
  )

  /**
   * GET /admin/prizes/:id
   * Get a single prize by ID
   */
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: getPrizeSchema,
      preHandler: [requirePermission(PERMISSION.PRIZES_READ)],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)
        const { id } = request.params

        const prize = await prizesService.getPrizeById(id, companyId)

        return reply.code(200).send({ prize })
      } catch (error) {
        logger.error('Error getting prize', { error })

        if (error instanceof Error && error.message.includes('not found')) {
          return reply.code(404).send({
            error: 'Not found',
            message: error.message,
          })
        }

        return reply.code(500).send({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Failed to get prize',
        })
      }
    },
  )

  /**
   * PATCH /admin/prizes/:id
   * Update a prize
   */
  fastify.patch<{ Params: { id: string }; Body: UpdatePrizeRequest }>(
    '/:id',
    {
      schema: updatePrizeSchema,
      preHandler: [requirePermission(PERMISSION.PRIZES_UPDATE)],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: UpdatePrizeRequest }>,
      reply: FastifyReply,
    ) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)
        const { id } = request.params
        const body = request.body

        const prize = await prizesService.updatePrize(id, companyId, body)

        return reply.code(200).send({ prize })
      } catch (error) {
        logger.error('Error updating prize', { error })

        if (error instanceof Error && error.message.includes('not found')) {
          return reply.code(404).send({
            error: 'Not found',
            message: error.message,
          })
        }

        if (error instanceof Error && error.message.includes('permission')) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: error.message,
          })
        }

        return reply.code(500).send({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Failed to update prize',
        })
      }
    },
  )

  /**
   * DELETE /admin/prizes/:id
   * Soft delete a prize (set isActive to false)
   */
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    {
      schema: deletePrizeSchema,
      preHandler: [requirePermission(PERMISSION.PRIZES_DELETE)],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)
        const { id } = request.params

        await prizesService.deletePrize(id, companyId)

        return reply.code(200).send({
          message: 'Prize deleted successfully',
        })
      } catch (error) {
        logger.error('Error deleting prize', { error })

        if (error instanceof Error && error.message.includes('not found')) {
          return reply.code(404).send({
            error: 'Not found',
            message: error.message,
          })
        }

        if (error instanceof Error && error.message.includes('permission')) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: error.message,
          })
        }

        return reply.code(500).send({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Failed to delete prize',
        })
      }
    },
  )

  /**
   * POST /admin/prizes/:id/images
   * Upload images for a prize (multipart/form-data)
   */
  fastify.post<{ Params: { id: string } }>(
    '/:id/images',
    {
      schema: uploadImagesSchema,
      preHandler: [requirePermission(PERMISSION.PRIZES_MANAGE_IMAGES)],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)
        const { id } = request.params

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
                error: 'Bad request',
                message: 'Maximum 4 files can be uploaded at once',
              })
            }

            // Read file buffer
            const buffer = await part.toBuffer()
            const fileName = part.filename
            const mimeType = part.mimetype

            // Upload to Supabase
            const { publicUrl } = await supabaseStorageService.uploadPrizeImage(
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
            error: 'Bad request',
            message: 'No files were uploaded. Please provide at least one image file.',
          })
        }

        // Add images to prize
        const images = await prizesService.addImages(id, companyId, uploadedUrls)

        return reply.code(200).send({
          images,
          message: `${uploadedUrls.length} image(s) uploaded successfully`,
        })
      } catch (error) {
        logger.error('Error uploading images', { error })

        if (error instanceof Error && error.message.includes('not found')) {
          return reply.code(404).send({
            error: 'Not found',
            message: error.message,
          })
        }

        if (error instanceof Error && error.message.includes('permission')) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: error.message,
          })
        }

        if (
          error instanceof Error &&
          (error.message.includes('Maximum') || error.message.includes('Invalid file type'))
        ) {
          return reply.code(400).send({
            error: 'Bad request',
            message: error.message,
          })
        }

        return reply.code(500).send({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Failed to upload images',
        })
      }
    },
  )

  /**
   * DELETE /admin/prizes/:id/images/:imageIndex
   * Remove a specific image from a prize
   */
  fastify.delete<{ Params: { id: string; imageIndex: string } }>(
    '/:id/images/:imageIndex',
    {
      schema: deleteImageSchema,
      preHandler: [requirePermission(PERMISSION.PRIZES_MANAGE_IMAGES)],
    },
    async (
      request: FastifyRequest<{ Params: { id: string; imageIndex: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)
        const { id, imageIndex } = request.params

        const index = parseInt(imageIndex, 10)
        if (isNaN(index)) {
          return reply.code(400).send({
            error: 'Bad request',
            message: 'Invalid image index',
          })
        }

        const images = await prizesService.removeImage(id, companyId, index)

        return reply.code(200).send({
          images,
          message: 'Image removed successfully',
        })
      } catch (error) {
        logger.error('Error removing image', { error })

        if (error instanceof Error && error.message.includes('not found')) {
          return reply.code(404).send({
            error: 'Not found',
            message: error.message,
          })
        }

        if (error instanceof Error && error.message.includes('permission')) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: error.message,
          })
        }

        if (error instanceof Error && error.message.includes('Invalid image index')) {
          return reply.code(400).send({
            error: 'Bad request',
            message: error.message,
          })
        }

        return reply.code(500).send({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Failed to remove image',
        })
      }
    },
  )
}
