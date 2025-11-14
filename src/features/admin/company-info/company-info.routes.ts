/**
 * @fileoverview Company Info Routes
 *
 * Routes for managing basic company information (admin only).
 * Base path: /admin/company/info
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { companyInfoService } from './company-info.service'
import {
  getCompanyInfoSchema,
  updateCompanyInfoSchema,
  uploadLogoSchema,
  deleteLogoSchema,
} from './company-info.schemas'
import { requirePermission } from '@/middleware/rbac'
import { PERMISSION } from '@/features/app/rbac/permissions.constants'
import { getAuth0Id } from '@/middleware/auth'
import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import { supabaseStorageService } from '@/lib/storage/supabase-storage.service'

/**
 * Get company ID from authenticated user
 */
async function getCompanyIdFromUser(auth0Id: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { auth0Id },
    select: { companyId: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return user.companyId
}

export default async function companyInfoRoutes(fastify: FastifyInstance) {
  // Register multipart plugin for file uploads
  await fastify.register(import('@fastify/multipart'), {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 1, // Only 1 file for logo upload
    },
  })

  /**
   * GET /admin/company/info
   * Get basic company information
   */
  fastify.get(
    '/',
    {
      schema: getCompanyInfoSchema,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)

        const info = await companyInfoService.getCompanyInfo(companyId)
        return reply.code(200).send(info)
      } catch (error) {
        logger.error('Failed to get company info', { error })

        if (error instanceof Error && error.message === 'Company not found') {
          return reply.code(404).send({
            error: 'Company not found',
            message: 'No company information found for this user',
          })
        }

        return reply.code(500).send({
          error: 'Internal server error',
          message: 'Failed to retrieve company information',
        })
      }
    },
  )

  /**
   * PATCH /admin/company/info
   * Update basic company information
   */
  fastify.patch(
    '/',
    {
      schema: updateCompanyInfoSchema,
      preHandler: [requirePermission(PERMISSION.COMPANY_MANAGE_SETTINGS)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)

        await companyInfoService.updateCompanyInfo(
          companyId,
          request.body as any,
        )

        return reply.code(200).send()
      } catch (error) {
        logger.error('Failed to update company info', { error })

        return reply.code(400).send({
          error: 'Validation error',
          message: 'Failed to update company information',
        })
      }
    },
  )

  /**
   * POST /admin/company/info/logo
   * Upload company logo
   */
  fastify.post(
    '/logo',
    {
      schema: uploadLogoSchema,
      preHandler: [requirePermission(PERMISSION.COMPANY_MANAGE_SETTINGS)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)

        // Get current company info to check for existing logo
        const currentCompany = await companyInfoService.getCompanyInfo(companyId)

        // Parse multipart form data
        const parts = request.parts()
        let uploadedUrl: string | null = null
        let fileCount = 0

        for await (const part of parts) {
          if (part.type === 'file') {
            fileCount++

            // Validate only 1 file is uploaded
            if (fileCount > 1) {
              return reply.code(400).send({
                error: 'Bad request',
                message: 'Only 1 logo file can be uploaded at once',
              })
            }

            // Read file buffer
            const buffer = await part.toBuffer()
            const fileName = part.filename
            const mimeType = part.mimetype

            // Delete old logo if exists
            if (currentCompany.logo_url) {
              try {
                const oldLogoPath = supabaseStorageService.extractPathFromUrl(
                  currentCompany.logo_url,
                )
                await supabaseStorageService.deleteCompanyLogo(oldLogoPath)
                logger.info('Old logo deleted successfully', { oldLogoPath })
              } catch (deleteError) {
                // Log warning but don't block upload
                logger.warn('Failed to delete old logo from storage, continuing with upload', {
                  error: deleteError,
                  oldLogoUrl: currentCompany.logo_url,
                })
              }
            }

            // Upload new logo to Supabase
            const { publicUrl } = await supabaseStorageService.uploadCompanyLogo(
              buffer,
              fileName,
              mimeType,
            )
            uploadedUrl = publicUrl
          }
        }

        // Validate that a file was uploaded
        if (!uploadedUrl) {
          return reply.code(400).send({
            error: 'Bad request',
            message: 'No file uploaded. Please provide a logo image file.',
          })
        }

        // Update company with new logo URL
        await companyInfoService.updateCompanyInfo(companyId, {
          logo_url: uploadedUrl,
        })

        logger.info('Company logo uploaded successfully', {
          companyId,
          logoUrl: uploadedUrl,
        })

        return reply.code(200).send({
          logo_url: uploadedUrl,
        })
      } catch (error) {
        logger.error('Failed to upload logo', { error })

        // Handle specific validation errors
        if (error instanceof Error) {
          if (error.message.includes('Invalid file type')) {
            return reply.code(400).send({
              error: 'Invalid file type',
              message: error.message,
            })
          }
          if (error.message.includes('File size exceeds')) {
            return reply.code(400).send({
              error: 'File too large',
              message: error.message,
            })
          }
        }

        return reply.code(500).send({
          error: 'Internal server error',
          message: 'Failed to upload company logo',
        })
      }
    },
  )

  /**
   * DELETE /admin/company/info/logo
   * Delete company logo
   */
  fastify.delete(
    '/logo',
    {
      schema: deleteLogoSchema,
      preHandler: [requirePermission(PERMISSION.COMPANY_MANAGE_SETTINGS)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth0Id = getAuth0Id(request)
        const companyId = await getCompanyIdFromUser(auth0Id)

        // Get current company info to check for existing logo
        const currentCompany = await companyInfoService.getCompanyInfo(companyId)

        // Validate that logo exists
        if (!currentCompany.logo_url) {
          return reply.code(404).send({
            error: 'Not found',
            message: 'Company does not have a logo to delete',
          })
        }

        // Delete logo from Supabase Storage
        try {
          const logoPath = supabaseStorageService.extractPathFromUrl(
            currentCompany.logo_url,
          )
          await supabaseStorageService.deleteCompanyLogo(logoPath)
          logger.info('Logo deleted from storage successfully', { logoPath })
        } catch (deleteError) {
          // Log warning but continue with DB update
          logger.warn('Failed to delete logo from storage, continuing with DB update', {
            error: deleteError,
            logoUrl: currentCompany.logo_url,
          })
        }

        // Update company to remove logo URL
        await companyInfoService.updateCompanyInfo(companyId, {
          logo_url: null,
        })

        logger.info('Company logo deleted successfully', { companyId })

        return reply.code(200).send({
          success: true,
          message: 'Company logo deleted successfully',
        })
      } catch (error) {
        logger.error('Failed to delete logo', { error })

        return reply.code(500).send({
          error: 'Internal server error',
          message: 'Failed to delete company logo',
        })
      }
    },
  )
}
