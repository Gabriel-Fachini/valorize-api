import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { financialService } from './financial.service'
import { requireSuperAdmin } from '@/middleware/backoffice'
import { getAuth0Id } from '@/middleware/auth'
import { User } from '@/features/app/users/user.model'
import { logger } from '@/lib/logger'
import {
  listChargesSchema,
  getChargeSchema,
  createChargeSchema,
  updateChargeSchema,
  deleteChargeSchema,
  cancelChargeSchema,
  registerPaymentSchema,
  uploadAttachmentSchema,
  deleteAttachmentSchema,
} from './financial.schemas'
import type {
  ListChargesQuery,
  CreateChargeRequest,
  UpdateChargeRequest,
  RegisterPaymentRequest,
} from './financial.types'

/**
 * Backoffice Financial Routes
 *
 * Financial management for Super Admins from Valorize HQ
 * All routes require Super Admin authentication
 */
export default async (fastify: FastifyInstance, _options: FastifyPluginOptions) => {
  /**
   * GET /backoffice/financial/charges
   *
   * List all charges with filters, pagination, and sorting
   * Returns aggregations (total amounts by status)
   */
  fastify.get(
    '/charges',
    {
      preHandler: [requireSuperAdmin()],
      schema: listChargesSchema,
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

        const query = request.query as ListChargesQuery

        const result = await financialService.listCharges(query, user.id)

        return reply.code(200).send(result)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logger.error('Failed to list charges', { error })
        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: errorMessage,
        })
      }
    }
  )

  /**
   * GET /backoffice/financial/charges/:id
   *
   * Get full charge details with payments and attachments
   */
  fastify.get(
    '/charges/:id',
    {
      preHandler: [requireSuperAdmin()],
      schema: getChargeSchema,
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

        const result = await financialService.getChargeDetails(id, user.id)

        return reply.code(200).send(result)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logger.error('Failed to get charge details', { error })

        if (errorMessage.includes('not found')) {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: errorMessage,
          })
        }

        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: errorMessage,
        })
      }
    }
  )

  /**
   * POST /backoffice/financial/charges
   *
   * Create a new charge for a company
   */
  fastify.post(
    '/charges',
    {
      preHandler: [requireSuperAdmin()],
      schema: createChargeSchema,
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

        const body = request.body as CreateChargeRequest

        const result = await financialService.createCharge(body, user.id)

        return reply.code(201).send(result)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logger.error('Failed to create charge', { error })

        if (errorMessage.includes('not found')) {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: errorMessage,
          })
        }

        if (errorMessage.includes('not active')) {
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
    }
  )

  /**
   * PATCH /backoffice/financial/charges/:id
   *
   * Update an existing charge
   */
  fastify.patch(
    '/charges/:id',
    {
      preHandler: [requireSuperAdmin()],
      schema: updateChargeSchema,
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
        const body = request.body as UpdateChargeRequest

        const result = await financialService.updateCharge(id, body, user.id)

        return reply.code(200).send(result)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logger.error('Failed to update charge', { error })

        if (errorMessage.includes('not found')) {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: errorMessage,
          })
        }

        if (errorMessage.includes('Cannot update')) {
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
    }
  )

  /**
   * DELETE /backoffice/financial/charges/:id
   *
   * Delete a charge (only if status is PENDING or CANCELED)
   */
  fastify.delete(
    '/charges/:id',
    {
      preHandler: [requireSuperAdmin()],
      schema: deleteChargeSchema,
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

        const result = await financialService.deleteCharge(id, user.id)

        return reply.code(200).send(result)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logger.error('Failed to delete charge', { error })

        if (errorMessage.includes('not found')) {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: errorMessage,
          })
        }

        if (errorMessage.includes('Cannot delete')) {
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
    }
  )

  /**
   * POST /backoffice/financial/charges/:id/cancel
   *
   * Cancel a charge (only if status is PENDING or OVERDUE)
   */
  fastify.post(
    '/charges/:id/cancel',
    {
      preHandler: [requireSuperAdmin()],
      schema: cancelChargeSchema,
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

        const result = await financialService.cancelCharge(id, user.id)

        return reply.code(200).send(result)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logger.error('Failed to cancel charge', { error })

        if (errorMessage.includes('not found')) {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: errorMessage,
          })
        }

        if (errorMessage.includes('Cannot cancel')) {
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
    }
  )

  /**
   * POST /backoffice/financial/charges/:id/payments
   *
   * Register a payment for a charge
   */
  fastify.post(
    '/charges/:id/payments',
    {
      preHandler: [requireSuperAdmin()],
      schema: registerPaymentSchema,
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
        const body = request.body as RegisterPaymentRequest

        const result = await financialService.registerPayment(id, body, user.id)

        return reply.code(201).send(result)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logger.error('Failed to register payment', { error })

        if (errorMessage.includes('not found')) {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: errorMessage,
          })
        }

        if (
          errorMessage.includes('Cannot register') ||
          errorMessage.includes('must be greater than zero')
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
    }
  )

  /**
   * POST /backoffice/financial/charges/:id/attachments
   *
   * Upload an attachment for a charge (e.g., invoice, receipt)
   */
  fastify.post(
    '/charges/:id/attachments',
    {
      preHandler: [requireSuperAdmin()],
      schema: uploadAttachmentSchema,
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

        // Get the uploaded file
        const data = await request.file()

        if (!data) {
          return reply.code(400).send({
            success: false,
            error: 'Bad Request',
            message: 'No file uploaded',
          })
        }

        // Convert file stream to buffer
        const fileBuffer = await data.toBuffer()
        const fileName = data.filename
        const fileType = data.mimetype
        const fileSize = fileBuffer.length

        const result = await financialService.uploadAttachment(
          id,
          fileBuffer,
          fileName,
          fileType,
          fileSize,
          user.id
        )

        return reply.code(201).send(result)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logger.error('Failed to upload attachment', { error })

        if (errorMessage.includes('not found')) {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: errorMessage,
          })
        }

        if (
          errorMessage.includes('Invalid file type') ||
          errorMessage.includes('File size exceeds')
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
    }
  )

  /**
   * DELETE /backoffice/financial/charges/:id/attachments/:attachmentId
   *
   * Delete an attachment from a charge
   */
  fastify.delete(
    '/charges/:id/attachments/:attachmentId',
    {
      preHandler: [requireSuperAdmin()],
      schema: deleteAttachmentSchema,
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

        const { id, attachmentId } = request.params as {
          id: string
          attachmentId: string
        }

        const result = await financialService.deleteAttachment(id, attachmentId, user.id)

        return reply.code(200).send(result)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logger.error('Failed to delete attachment', { error })

        if (errorMessage.includes('not found') || errorMessage.includes('does not belong')) {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: errorMessage,
          })
        }

        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: errorMessage,
        })
      }
    }
  )
}
