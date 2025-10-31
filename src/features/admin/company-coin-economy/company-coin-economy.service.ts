/**
 * @fileoverview Company Coin Economy Service
 *
 * Business logic for managing coin economy settings:
 * - Weekly renewal amount
 * - Renewal day of the week
 */

import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

export interface CoinEconomyResponse {
  weekly_renewal_amount: number
  renewal_day: number
  created_at: string
  updated_at: string
}

export interface UpdateCoinEconomyInput {
  weekly_renewal_amount?: number
  renewal_day?: number
}

/**
 * Format coin economy settings for response
 */
function formatCoinEconomy(settings: any): CoinEconomyResponse {
  return {
    weekly_renewal_amount: settings.weeklyRenewalAmount,
    renewal_day: settings.renewalDay,
    created_at: settings.createdAt.toISOString(),
    updated_at: settings.updatedAt.toISOString(),
  }
}

export const companyCoinEconomyService = {
  /**
   * Get coin economy settings for a company
   */
  async getCoinEconomy(companyId: string): Promise<CoinEconomyResponse> {
    logger.info(`Getting coin economy settings for company ${companyId}`)

    let settings = await prisma.companySettings.findUnique({
      where: { companyId },
    })

    // Create default settings if they don't exist
    if (!settings) {
      logger.info(`Creating default coin economy settings for company ${companyId}`)
      settings = await prisma.companySettings.create({
        data: {
          companyId,
          weeklyRenewalAmount: 100,
          renewalDay: 1,
        },
      })
    }

    return formatCoinEconomy(settings)
  },

  /**
   * Update coin economy settings
   */
  async updateCoinEconomy(
    companyId: string,
    data: UpdateCoinEconomyInput,
  ): Promise<CoinEconomyResponse> {
    logger.info(`Updating coin economy settings for company ${companyId}`)

    const updateData: any = {}
    if (data.weekly_renewal_amount !== undefined) {
      updateData.weeklyRenewalAmount = data.weekly_renewal_amount
    }
    if (data.renewal_day !== undefined) {
      updateData.renewalDay = data.renewal_day
    }

    const settings = await prisma.companySettings.upsert({
      where: { companyId },
      update: updateData,
      create: {
        companyId,
        weeklyRenewalAmount: data.weekly_renewal_amount ?? 100,
        renewalDay: data.renewal_day ?? 1,
      },
    })

    logger.info(`Coin economy settings updated successfully for company ${companyId}`)
    return formatCoinEconomy(settings)
  },
}
