import { logger } from '@/lib/logger'
import { PrizeModel, CreatePrizeData } from './prize.model'
import {
  PrizeVariantModel,
  CreatePrizeVariantData,
} from './prize-variant.model'

export const prizeService = {
  async listAvailablePrizes(
    companyId: string,
    filters?: {
      category?: string
      minPrice?: number
      maxPrice?: number
    },
  ) {
    try {
      const prizes = await PrizeModel.findAvailable(companyId, filters)

      logger.info('Available prizes listed', {
        companyId,
        count: prizes.length,
        filters,
      })

      return prizes.map((prize) => prize.toJSON())
    } catch (error) {
      logger.error('Error listing available prizes', { error, companyId })
      throw new Error('Failed to list prizes')
    }
  },

  async getPrizeDetails(prizeId: string, companyId: string) {
    try {
      const prize = await PrizeModel.findById(prizeId)

      if (!prize) {
        throw new Error('Prize not found')
      }

      // Verificar se o prêmio é global ou da empresa
      if (prize.companyId && prize.companyId !== companyId) {
        throw new Error('Prize does not belong to this company')
      }

      logger.info('Prize details retrieved', { prizeId, companyId })

      return prize.toJSON()
    } catch (error) {
      logger.error('Error getting prize details', { error, prizeId })
      throw error
    }
  },

  async getAvailableCategories(companyId: string) {
    try {
      const categories = await PrizeModel.getAvailableCategories(companyId)

      logger.info('Available categories retrieved', {
        companyId,
        count: categories.length,
      })

      return categories
    } catch (error) {
      logger.error('Error getting categories', { error, companyId })
      throw new Error('Failed to get categories')
    }
  },

  async createPrize(companyId: string | null, data: CreatePrizeData) {
    try {
      // Validações de negócio
      if (data.coinPrice <= 0) {
        throw new Error('Coin price must be greater than 0')
      }

      if (data.stock < 0) {
        throw new Error('Stock cannot be negative')
      }

      if (!data.images || data.images.length === 0) {
        throw new Error('At least one image is required')
      }

      const prizeData: CreatePrizeData = {
        ...data,
        companyId,
      }

      const prize = await PrizeModel.create(prizeData)

      logger.info('Prize created successfully', {
        prizeId: prize.id,
        companyId,
        name: data.name,
      })

      return prize.toJSON()
    } catch (error) {
      logger.error('Error creating prize', { error, data })
      throw error
    }
  },

  async addVariant(prizeId: string, companyId: string, data: CreatePrizeVariantData) {
    try {
      // Verificar se o prêmio existe e pertence à empresa
      const prize = await PrizeModel.findById(prizeId)

      if (!prize) {
        throw new Error('Prize not found')
      }

      if (prize.companyId !== companyId) {
        throw new Error('Prize does not belong to this company')
      }

      // Validações de negócio
      if (data.stock < 0) {
        throw new Error('Stock cannot be negative')
      }

      const variantData: CreatePrizeVariantData = {
        ...data,
        prizeId,
      }

      const variant = await PrizeVariantModel.create(variantData)

      logger.info('Prize variant added successfully', {
        variantId: variant.id,
        prizeId,
        name: data.name,
        value: data.value,
      })

      return variant.toJSON()
    } catch (error) {
      logger.error('Error adding prize variant', { error, prizeId, data })
      throw error
    }
  },
}

