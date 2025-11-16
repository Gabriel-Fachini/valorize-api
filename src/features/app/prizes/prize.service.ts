import { logger } from '@/lib/logger'
import { prizeRepository } from './prize.repository'

export const prizeService = {
  async listAvailablePrizes(
    companyId: string,
    filters?: {
      category?: string
      type?: string
      search?: string
      sortBy?: 'popular' | 'most_redeemed' | 'price_asc' | 'price_desc'
      minPrice?: number
      maxPrice?: number
    },
  ) {
    try {
      const prizes = await prizeRepository.findAvailable(companyId, filters)

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
      const prize = await prizeRepository.getPrizeWithVariants(prizeId)

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
      const categories = await prizeRepository.getAvailableCategories(companyId)

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
}

