import { logger } from '@/lib/logger'
import { PrizeVariant } from '@prisma/client'
import { prisma } from '@/lib/database'

export type PrizeVariantData = PrizeVariant
export type CreatePrizeVariantData = Omit<PrizeVariantData, 'id'>
export type UpdatePrizeVariantData = Partial<
  Omit<PrizeVariantData, 'id' | 'prizeId'>
>

export class PrizeVariantModel {
  constructor(private data: PrizeVariant) {}

  get id() {
    return this.data.id
  }

  get prizeId() {
    return this.data.prizeId
  }

  get name() {
    return this.data.name
  }

  get value() {
    return this.data.value
  }

  get stock() {
    return this.data.stock
  }

  get isActive() {
    return this.data.isActive
  }

  toJSON() {
    return {
      id: this.data.id,
      prizeId: this.data.prizeId,
      name: this.data.name,
      value: this.data.value,
      stock: this.data.stock,
      isActive: this.data.isActive,
    }
  }

  static async create(
    data: CreatePrizeVariantData,
  ): Promise<PrizeVariantModel> {
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
  }

  static async findById(id: string): Promise<PrizeVariantModel | null> {
    try {
      const variant = await prisma.prizeVariant.findUnique({
        where: { id },
      })

      return variant ? new PrizeVariantModel(variant) : null
    } catch (error) {
      logger.error('Error finding prize variant by ID', { error, id })
      throw new Error('Failed to find prize variant')
    }
  }

  static async findByPrizeId(prizeId: string): Promise<PrizeVariantModel[]> {
    try {
      const variants = await prisma.prizeVariant.findMany({
        where: { prizeId, isActive: true },
      })

      return variants.map((variant) => new PrizeVariantModel(variant))
    } catch (error) {
      logger.error('Error finding prize variants', { error, prizeId })
      throw new Error('Failed to find prize variants')
    }
  }

  async update(data: UpdatePrizeVariantData): Promise<PrizeVariantModel> {
    try {
      const updated = await prisma.prizeVariant.update({
        where: { id: this.data.id },
        data,
      })

      this.data = updated
      logger.info('Prize variant updated successfully', {
        variantId: this.data.id,
      })
      return this
    } catch (error) {
      logger.error('Error updating prize variant', {
        error,
        variantId: this.data.id,
      })
      throw new Error('Failed to update prize variant')
    }
  }

  async delete(): Promise<void> {
    try {
      await prisma.prizeVariant.update({
        where: { id: this.data.id },
        data: { isActive: false },
      })

      this.data.isActive = false
      logger.info('Prize variant soft deleted successfully', {
        variantId: this.data.id,
      })
    } catch (error) {
      logger.error('Error deleting prize variant', {
        error,
        variantId: this.data.id,
      })
      throw new Error('Failed to delete prize variant')
    }
  }
}

