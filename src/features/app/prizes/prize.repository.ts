import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import { Prisma } from '@prisma/client'
import { PrizeModel, CreatePrizeData } from './prize.model'

const PRIZE_INCLUDES = {
  variants: {
    where: { isActive: true, stock: { gt: 0 } },
  },
}

export const prizeRepository = {
  async create(data: CreatePrizeData): Promise<PrizeModel> {
    try {
      const prize = await prisma.prize.create({
        data: {
          ...data,
          specifications: data.specifications ?? undefined,
        },
      })

      logger.info('Prize created successfully', { prizeId: prize.id })
      return new PrizeModel(prize)
    } catch (error) {
      logger.error('Error creating prize', { error, data })
      throw new Error('Failed to create prize')
    }
  },

  async findById(id: string): Promise<PrizeModel | null> {
    try {
      const prize = await prisma.prize.findUnique({
        where: { id },
        include: PRIZE_INCLUDES,
      })

      return prize ? new PrizeModel(prize) : null
    } catch (error) {
      logger.error('Error finding prize by ID', { error, id })
      throw new Error('Failed to find prize')
    }
  },

  async findAvailable(
    companyId: string,
    filters?: {
      type?: string
      category?: string
      minPrice?: number
      maxPrice?: number
    },
  ): Promise<PrizeModel[]> {
    try {
      const where: Prisma.PrizeWhereInput = {
        isActive: true,
        stock: { gt: 0 },
        OR: [{ companyId }, { companyId: null }],
      }

      if (filters?.type) {
        where.type = filters.type
      }

      if (filters?.category) {
        where.category = filters.category
      }

      if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
        where.coinPrice = {}
        if (filters?.minPrice !== undefined) {
          where.coinPrice.gte = filters.minPrice
        }
        if (filters?.maxPrice !== undefined) {
          where.coinPrice.lte = filters.maxPrice
        }
      }

      const prizes = await prisma.prize.findMany({
        where,
        include: PRIZE_INCLUDES,
        orderBy: { createdAt: 'desc' },
      })

      return prizes.map((prize) => new PrizeModel(prize))
    } catch (error) {
      logger.error('Error finding available prizes', { error, companyId })
      throw new Error('Failed to find available prizes')
    }
  },

  async getAvailableCategories(companyId: string): Promise<string[]> {
    try {
      const categories = await prisma.prize.findMany({
        where: {
          isActive: true,
          stock: { gt: 0 },
          OR: [{ companyId }, { companyId: null }],
        },
        select: {
          category: true,
        },
        distinct: ['category'],
      })

      return categories
        .filter((c) => c.category !== null)
        .map((c) => c.category as string)
    } catch (error) {
      logger.error('Error getting available categories', { error, companyId })
      throw new Error('Failed to get categories')
    }
  },

  async update(id: string, data: Partial<CreatePrizeData>): Promise<PrizeModel> {
    try {
      const updated = await prisma.prize.update({
        where: { id },
        data: {
          ...data,
          specifications: data.specifications ?? undefined,
        },
      })

      logger.info('Prize updated successfully', { prizeId: id })
      return new PrizeModel(updated)
    } catch (error) {
      logger.error('Error updating prize', { error, prizeId: id })
      throw new Error('Failed to update prize')
    }
  },

  async softDelete(id: string): Promise<void> {
    try {
      await prisma.prize.update({
        where: { id },
        data: { isActive: false },
      })

      logger.info('Prize soft deleted successfully', { prizeId: id })
    } catch (error) {
      logger.error('Error deleting prize', { error, prizeId: id })
      throw new Error('Failed to delete prize')
    }
  },

  async updateStock(id: string, quantity: number): Promise<PrizeModel> {
    try {
      const updated = await prisma.prize.update({
        where: { id },
        data: { stock: quantity },
      })

      logger.info('Prize stock updated', {
        prizeId: id,
        newStock: quantity,
      })
      return new PrizeModel(updated)
    } catch (error) {
      logger.error('Error updating prize stock', {
        error,
        prizeId: id,
      })
      throw new Error('Failed to update stock')
    }
  },

  async getPrizeWithVariants(id: string): Promise<PrizeModel> {
    const prize = await prisma.prize.findUniqueOrThrow({
      where: { id },
      include: PRIZE_INCLUDES,
    })
    return new PrizeModel(prize)
  },
}

