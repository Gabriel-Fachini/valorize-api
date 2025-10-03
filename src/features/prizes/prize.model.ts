import { logger } from '@/lib/logger'
import { Prize, Prisma } from '@prisma/client'
import { prisma } from '@/lib/database'

export type PrizeData = Omit<Prize, 'createdAt' | 'updatedAt'>
export type CreatePrizeData = Omit<PrizeData, 'id'>
export type UpdatePrizeData = Partial<Omit<PrizeData, 'id' | 'companyId'>>

export class PrizeModel {
  constructor(private data: Prize) {}

  get id() {
    return this.data.id
  }

  get name() {
    return this.data.name
  }

  get description() {
    return this.data.description
  }

  get category() {
    return this.data.category
  }

  get images() {
    return this.data.images
  }

  get coinPrice() {
    return this.data.coinPrice
  }

  get brand() {
    return this.data.brand
  }

  get specifications() {
    return this.data.specifications
  }

  get stock() {
    return this.data.stock
  }

  get isActive() {
    return this.data.isActive
  }

  get companyId() {
    return this.data.companyId
  }

  toJSON() {
    return {
      id: this.data.id,
      companyId: this.data.companyId,
      name: this.data.name,
      description: this.data.description,
      category: this.data.category,
      images: this.data.images,
      coinPrice: this.data.coinPrice,
      brand: this.data.brand,
      specifications: this.data.specifications,
      stock: this.data.stock,
      isActive: this.data.isActive,
      createdAt: this.data.createdAt,
      updatedAt: this.data.updatedAt,
    }
  }

  static async create(data: CreatePrizeData): Promise<PrizeModel> {
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
  }

  static async findById(id: string): Promise<PrizeModel | null> {
    try {
      const prize = await prisma.prize.findUnique({
        where: { id },
        include: {
          variants: true,
        },
      })

      return prize ? new PrizeModel(prize) : null
    } catch (error) {
      logger.error('Error finding prize by ID', { error, id })
      throw new Error('Failed to find prize')
    }
  }

  static async findAvailable(
    companyId: string,
    filters?: {
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
        include: {
          variants: {
            where: { isActive: true, stock: { gt: 0 } },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return prizes.map((prize) => new PrizeModel(prize))
    } catch (error) {
      logger.error('Error finding available prizes', { error, companyId })
      throw new Error('Failed to find available prizes')
    }
  }

  static async getAvailableCategories(
    companyId: string,
  ): Promise<string[]> {
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

      return categories.map((c) => c.category)
    } catch (error) {
      logger.error('Error getting available categories', { error, companyId })
      throw new Error('Failed to get categories')
    }
  }

  async update(data: UpdatePrizeData): Promise<PrizeModel> {
    try {
      const updated = await prisma.prize.update({
        where: { id: this.data.id },
        data: {
          ...data,
          specifications: data.specifications ?? undefined,
        },
      })

      this.data = updated
      logger.info('Prize updated successfully', { prizeId: this.data.id })
      return this
    } catch (error) {
      logger.error('Error updating prize', { error, prizeId: this.data.id })
      throw new Error('Failed to update prize')
    }
  }

  async delete(): Promise<void> {
    try {
      await prisma.prize.update({
        where: { id: this.data.id },
        data: { isActive: false },
      })

      this.data.isActive = false
      logger.info('Prize soft deleted successfully', { prizeId: this.data.id })
    } catch (error) {
      logger.error('Error deleting prize', { error, prizeId: this.data.id })
      throw new Error('Failed to delete prize')
    }
  }

  async updateStock(quantity: number): Promise<PrizeModel> {
    try {
      const updated = await prisma.prize.update({
        where: { id: this.data.id },
        data: { stock: quantity },
      })

      this.data = updated
      logger.info('Prize stock updated', {
        prizeId: this.data.id,
        newStock: quantity,
      })
      return this
    } catch (error) {
      logger.error('Error updating prize stock', {
        error,
        prizeId: this.data.id,
      })
      throw new Error('Failed to update stock')
    }
  }
}

