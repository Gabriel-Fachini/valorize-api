import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import { supabaseStorageService } from '@/lib/storage/supabase-storage.service'
import type {
  CreatePrizeRequest,
  UpdatePrizeRequest,
  ListPrizesQuery,
  ListPrizesResponse,
  PrizeWithRelations,
} from './types'
import { Prisma } from '@prisma/client'

class PrizesService {
  /**
   * Create a new prize
   * @param companyId - Company ID (null for global prizes)
   * @param data - Prize data
   */
  async createPrize(companyId: string | null, data: CreatePrizeRequest): Promise<PrizeWithRelations> {
    try {
      logger.info('Creating new prize', { companyId, name: data.name })

      const prize = await prisma.prize.create({
        data: {
          companyId: data.isGlobal ? null : companyId,
          name: data.name,
          description: data.description,
          type: data.type,
          category: data.category,
          coinPrice: data.coinPrice,
          brand: data.brand ?? null,
          stock: data.stock,
          specifications: (data.specifications ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          images: [], // Start with empty array, images will be added later
          isActive: true,
        },
        include: {
          variants: true,
        },
      })

      logger.info('Prize created successfully', { prizeId: prize.id })
      return prize
    } catch (error) {
      logger.error('Error creating prize', { error, data })
      throw error
    }
  }

  /**
   * List prizes with filtering and pagination
   * @param companyId - Company ID of the requesting user
   * @param query - Query parameters for filtering and pagination
   */
  async listPrizes(companyId: string, query: ListPrizesQuery): Promise<ListPrizesResponse> {
    try {
      const page = query.page ?? 1
      const limit = Math.min(query.limit ?? 20, 100)
      const skip = (page - 1) * limit

      logger.info('Listing prizes', { companyId, query })

      // Build where clause
      const where: Prisma.PrizeWhereInput = {
        OR: [
          { companyId: companyId }, // Prizes from user's company
          { companyId: null }, // Global prizes
        ],
      }

      // Apply filters
      if (query.type) {
        where.type = query.type
      }

      if (query.category) {
        where.category = query.category
      }

      if (query.isActive !== undefined) {
        where.isActive = query.isActive
      }

      if (query.isGlobal !== undefined) {
        // Override the OR clause if filtering specifically for global or company prizes
        if (query.isGlobal) {
          delete where.OR
          where.companyId = null
        } else {
          delete where.OR
          where.companyId = companyId
        }
      }

      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { brand: { contains: query.search, mode: 'insensitive' } },
        ]
      }

      // Build orderBy clause
      const orderBy: Prisma.PrizeOrderByWithRelationInput = {}
      const sortBy = query.orderBy ?? 'createdAt'
      const order = query.order ?? 'desc'
      orderBy[sortBy] = order

      // Execute queries
      const [prizes, total] = await Promise.all([
        prisma.prize.findMany({
          where,
          include: {
            variants: true,
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.prize.count({ where }),
      ])

      const totalPages = Math.ceil(total / limit)

      logger.info('Prizes listed successfully', {
        total,
        page,
        limit,
        totalPages,
        count: prizes.length,
      })

      return {
        prizes,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      }
    } catch (error) {
      logger.error('Error listing prizes', { error, query })
      throw error
    }
  }

  /**
   * Get a single prize by ID
   * @param prizeId - Prize ID
   * @param companyId - Company ID of the requesting user
   */
  async getPrizeById(prizeId: string, companyId: string): Promise<PrizeWithRelations> {
    try {
      logger.info('Getting prize by ID', { prizeId, companyId })

      const prize = await prisma.prize.findFirst({
        where: {
          id: prizeId,
          OR: [
            { companyId: companyId }, // Prizes from user's company
            { companyId: null }, // Global prizes
          ],
        },
        include: {
          variants: true,
        },
      })

      if (!prize) {
        throw new Error('Prize not found or you do not have access to it')
      }

      logger.info('Prize retrieved successfully', { prizeId: prize.id })
      return prize
    } catch (error) {
      logger.error('Error getting prize', { error, prizeId })
      throw error
    }
  }

  /**
   * Update a prize
   * Only allows updating prizes from the user's company (not global prizes)
   * @param prizeId - Prize ID
   * @param companyId - Company ID of the requesting user
   * @param data - Update data
   */
  async updatePrize(
    prizeId: string,
    companyId: string,
    data: UpdatePrizeRequest,
  ): Promise<PrizeWithRelations> {
    try {
      logger.info('Updating prize', { prizeId, companyId, data })

      // Verify prize exists and belongs to the company
      const existingPrize = await prisma.prize.findFirst({
        where: {
          id: prizeId,
          companyId: companyId, // Only allow updating company-owned prizes
        },
      })

      if (!existingPrize) {
        throw new Error(
          'Prize not found or you do not have permission to update it. Only company-owned prizes can be updated.',
        )
      }

      // Build update data - only include defined fields
      const updateData: Prisma.PrizeUpdateInput = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description
      if (data.type !== undefined) updateData.type = data.type
      if (data.category !== undefined) updateData.category = data.category
      if (data.coinPrice !== undefined) updateData.coinPrice = data.coinPrice
      if (data.brand !== undefined) updateData.brand = data.brand
      if (data.stock !== undefined) updateData.stock = data.stock
      if (data.isActive !== undefined) updateData.isActive = data.isActive
      if (data.specifications !== undefined) updateData.specifications = data.specifications as Prisma.InputJsonValue

      // Update prize
      const prize = await prisma.prize.update({
        where: { id: prizeId },
        data: updateData,
        include: {
          variants: true,
        },
      })

      logger.info('Prize updated successfully', { prizeId })
      return prize
    } catch (error) {
      logger.error('Error updating prize', { error, prizeId })
      throw error
    }
  }

  /**
   * Soft delete a prize (set isActive to false)
   * Only allows deleting prizes from the user's company (not global prizes)
   * @param prizeId - Prize ID
   * @param companyId - Company ID of the requesting user
   */
  async deletePrize(prizeId: string, companyId: string): Promise<void> {
    try {
      logger.info('Soft deleting prize', { prizeId, companyId })

      // Verify prize exists and belongs to the company
      const existingPrize = await prisma.prize.findFirst({
        where: {
          id: prizeId,
          companyId: companyId, // Only allow deleting company-owned prizes
        },
      })

      if (!existingPrize) {
        throw new Error(
          'Prize not found or you do not have permission to delete it. Only company-owned prizes can be deleted.',
        )
      }

      // Soft delete
      await prisma.prize.update({
        where: { id: prizeId },
        data: { isActive: false },
      })

      logger.info('Prize soft deleted successfully', { prizeId })
    } catch (error) {
      logger.error('Error deleting prize', { error, prizeId })
      throw error
    }
  }

  /**
   * Add images to a prize
   * @param prizeId - Prize ID
   * @param companyId - Company ID of the requesting user
   * @param imageUrls - Array of uploaded image URLs
   */
  async addImages(prizeId: string, companyId: string, imageUrls: string[]): Promise<string[]> {
    try {
      logger.info('Adding images to prize', { prizeId, companyId, count: imageUrls.length })

      // Verify prize exists and belongs to the company
      const existingPrize = await prisma.prize.findFirst({
        where: {
          id: prizeId,
          companyId: companyId, // Only allow updating company-owned prizes
        },
      })

      if (!existingPrize) {
        throw new Error(
          'Prize not found or you do not have permission to update it. Only company-owned prizes can have images added.',
        )
      }

      // Check total images count (max 4)
      const currentImagesCount = existingPrize.images.length
      const totalImages = currentImagesCount + imageUrls.length

      if (totalImages > 4) {
        throw new Error(
          `Maximum 4 images allowed per prize. Current: ${currentImagesCount}, Attempting to add: ${imageUrls.length}`,
        )
      }

      // Update prize with new images
      const updatedImages = [...existingPrize.images, ...imageUrls]
      await prisma.prize.update({
        where: { id: prizeId },
        data: { images: updatedImages },
      })

      logger.info('Images added successfully', { prizeId, totalImages: updatedImages.length })
      return updatedImages
    } catch (error) {
      logger.error('Error adding images to prize', { error, prizeId })
      throw error
    }
  }

  /**
   * Remove an image from a prize by index
   * @param prizeId - Prize ID
   * @param companyId - Company ID of the requesting user
   * @param imageIndex - Index of the image to remove (0-based)
   */
  async removeImage(prizeId: string, companyId: string, imageIndex: number): Promise<string[]> {
    try {
      logger.info('Removing image from prize', { prizeId, companyId, imageIndex })

      // Verify prize exists and belongs to the company
      const existingPrize = await prisma.prize.findFirst({
        where: {
          id: prizeId,
          companyId: companyId, // Only allow updating company-owned prizes
        },
      })

      if (!existingPrize) {
        throw new Error(
          'Prize not found or you do not have permission to update it. Only company-owned prizes can have images removed.',
        )
      }

      // Validate index
      if (imageIndex < 0 || imageIndex >= existingPrize.images.length) {
        throw new Error(
          `Invalid image index: ${imageIndex}. Prize has ${existingPrize.images.length} images.`,
        )
      }

      const imageUrl = existingPrize.images[imageIndex]

      // Delete from Supabase Storage
      try {
        const storagePath = supabaseStorageService.extractPathFromUrl(imageUrl)
        await supabaseStorageService.deletePrizeImage(storagePath)
      } catch (storageError) {
        logger.warn('Failed to delete image from storage, continuing with database update', {
          storageError,
          imageUrl,
        })
        // Continue even if storage deletion fails
      }

      // Remove image from array
      const updatedImages = existingPrize.images.filter((_: string, index: number) => index !== imageIndex)

      // Update prize
      await prisma.prize.update({
        where: { id: prizeId },
        data: { images: updatedImages },
      })

      logger.info('Image removed successfully', { prizeId, remainingImages: updatedImages.length })
      return updatedImages
    } catch (error) {
      logger.error('Error removing image from prize', { error, prizeId, imageIndex })
      throw error
    }
  }
}

export const prizesService = new PrizesService()
