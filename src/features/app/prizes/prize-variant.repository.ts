import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import { PrizeVariantModel, CreatePrizeVariantData } from './prize-variant.model'

export const prizeVariantRepository = {
  async create(data: CreatePrizeVariantData): Promise<PrizeVariantModel> {
    try {
      const variant = await prisma.prizeVariant.create({
        data,
      })

      logger.info('Prize variant created successfully', {
        variantId: variant.id,
        prizeId: data.prizeId,
      })
      return new PrizeVariantModel(variant)
    } catch (error) {
      logger.error('Error creating prize variant', { error, data })
      throw new Error('Failed to create prize variant')
    }
  },

  async findById(id: string): Promise<PrizeVariantModel | null> {
    try {
      const variant = await prisma.prizeVariant.findUnique({
        where: { id },
      })

      return variant ? new PrizeVariantModel(variant) : null
    } catch (error) {
      logger.error('Error finding prize variant by ID', { error, id })
      throw new Error('Failed to find prize variant')
    }
  },

  async findByPrizeId(prizeId: string): Promise<PrizeVariantModel[]> {
    try {
      const variants = await prisma.prizeVariant.findMany({
        where: { prizeId, isActive: true },
      })

      return variants.map((variant) => new PrizeVariantModel(variant))
    } catch (error) {
      logger.error('Error finding prize variants', { error, prizeId })
      throw new Error('Failed to find prize variants')
    }
  },

  async update(id: string, data: Partial<Omit<CreatePrizeVariantData, 'prizeId'>>): Promise<PrizeVariantModel> {
    try {
      const updated = await prisma.prizeVariant.update({
        where: { id },
        data,
      })

      logger.info('Prize variant updated successfully', {
        variantId: id,
      })
      return new PrizeVariantModel(updated)
    } catch (error) {
      logger.error('Error updating prize variant', {
        error,
        variantId: id,
      })
      throw new Error('Failed to update prize variant')
    }
  },

  async softDelete(id: string): Promise<void> {
    try {
      await prisma.prizeVariant.update({
        where: { id },
        data: { isActive: false },
      })

      logger.info('Prize variant soft deleted successfully', {
        variantId: id,
      })
    } catch (error) {
      logger.error('Error deleting prize variant', {
        error,
        variantId: id,
      })
      throw new Error('Failed to delete prize variant')
    }
  },
}

