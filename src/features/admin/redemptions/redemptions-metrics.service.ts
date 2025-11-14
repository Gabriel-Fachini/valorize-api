import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import type {
  RedemptionMetricsFilters,
  RedemptionMetrics,
  VolumeMetrics,
  StatusMetrics,
  TypeMetrics,
  PrizeMetrics,
  EngagementMetrics,
  FinancialMetrics,
} from './types'

const COIN_TO_BRL_RATE = 0.06

export const redemptionsMetricsService = {
  /**
   * Get comprehensive redemption metrics for a company
   * Returns aggregated data for the specified period
   */
  async getRedemptionMetrics(
    companyId: string,
    filters: RedemptionMetricsFilters,
  ): Promise<RedemptionMetrics> {
    try {
      // Set default date range (last 30 days)
      const endDate = filters.endDate ? new Date(filters.endDate) : new Date()
      const startDate = filters.startDate
        ? new Date(filters.startDate)
        : new Date()
      startDate.setDate(startDate.getDate() - 30)

      logger.info('[RedemptionsMetrics] Calculating metrics', {
        companyId,
        startDate,
        endDate,
      })

      // Calculate all metrics in parallel
      const [volume, statusBreakdown, typeBreakdown, topPrizes, userEngagement, financialImpact] =
        await Promise.all([
          this.calculateVolumeMetrics(companyId, startDate, endDate),
          this.calculateStatusBreakdown(companyId, startDate, endDate),
          this.calculateTypeBreakdown(companyId, startDate, endDate),
          this.getTopPrizes(companyId, startDate, endDate),
          this.calculateUserEngagement(companyId, startDate, endDate),
          this.calculateFinancialImpact(companyId, startDate, endDate),
        ])

      const metrics: RedemptionMetrics = {
        period: { startDate, endDate },
        volume,
        statusBreakdown,
        typeBreakdown,
        topPrizes,
        userEngagement,
        financialImpact,
      }

      logger.info('[RedemptionsMetrics] Metrics calculated successfully', {
        companyId,
        totalRedemptions: volume.totalRedemptions,
      })

      return metrics
    } catch (error) {
      logger.error('[RedemptionsMetrics] Error calculating metrics', {
        error,
        companyId,
      })
      throw new Error('Failed to calculate redemption metrics')
    }
  },

  /**
   * Calculate volume metrics: total redemptions, coins spent, value in BRL
   */
  async calculateVolumeMetrics(
    companyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<VolumeMetrics> {
    // Current period data
    const currentData = await prisma.redemption.aggregate({
      where: {
        companyId,
        redeemedAt: { gte: startDate, lte: endDate },
      },
      _count: { id: true },
      _sum: { coinsSpent: true },
      _avg: { coinsSpent: true },
    })

    // Previous period data for comparison
    const periodLength = endDate.getTime() - startDate.getTime()
    const previousEndDate = startDate
    const previousStartDate = new Date(startDate.getTime() - periodLength)

    const previousData = await prisma.redemption.aggregate({
      where: {
        companyId,
        redeemedAt: { gte: previousStartDate, lte: previousEndDate },
      },
      _count: { id: true },
      _sum: { coinsSpent: true },
    })

    const totalRedemptions = currentData._count.id
    const totalCoinsSpent = currentData._sum.coinsSpent ?? 0
    const totalValueBRL = totalCoinsSpent * COIN_TO_BRL_RATE
    const avgCoinsPerRedemption = currentData._avg.coinsSpent ?? 0

    // Calculate comparisons
    const prevTotalRedemptions = previousData._count.id || 1 // Prevent division by zero
    const redemptionsChange = this.calculatePercentageChange(
      prevTotalRedemptions,
      totalRedemptions,
    )

    const prevTotalValue = (previousData._sum.coinsSpent ?? 0) * COIN_TO_BRL_RATE
    const valueChange = totalValueBRL - prevTotalValue

    return {
      totalRedemptions,
      totalCoinsSpent,
      totalValueBRL: Math.round(totalValueBRL * 100) / 100, // Round to 2 decimals
      avgCoinsPerRedemption: Math.round(avgCoinsPerRedemption * 100) / 100,
      periodComparison: {
        redemptionsChange: `${redemptionsChange > 0 ? '+' : ''}${redemptionsChange}%`,
        valueChange: `${valueChange > 0 ? '+' : ''} R$ ${Math.abs(valueChange).toFixed(2)}`,
      },
    }
  },

  /**
   * Calculate status breakdown for all redemptions
   */
  async calculateStatusBreakdown(
    companyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<StatusMetrics[]> {
    const statusData = await prisma.redemption.groupBy({
      by: ['status'],
      where: {
        companyId,
        redeemedAt: { gte: startDate, lte: endDate },
      },
      _count: { id: true },
    })

    const total = statusData.reduce((sum, item) => sum + item._count.id, 0)

    const breakdown = statusData.map(item => ({
      status: item.status,
      count: item._count.id,
      percentage: Math.round((item._count.id / total) * 10000) / 100, // 2 decimal places
    }))

    return breakdown.sort((a, b) => b.count - a.count) // Sort by count descending
  },

  /**
   * Calculate redemptions breakdown by prize type
   */
  async calculateTypeBreakdown(
    companyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TypeMetrics[]> {
    // Get all redemptions with prize type and status info
    const redemptions = await prisma.redemption.findMany({
      where: {
        companyId,
        redeemedAt: { gte: startDate, lte: endDate },
      },
      include: {
        prize: {
          select: {
            type: true,
            coinPrice: true,
          },
        },
      },
    })

    const total = redemptions.length

    // Group by type
    const typeMap = new Map<string, { redemptions: any[]; totalCoins: number }>()

    for (const redemption of redemptions) {
      const type = redemption.prize.type
      if (!typeMap.has(type)) {
        typeMap.set(type, { redemptions: [], totalCoins: 0 })
      }
      const data = typeMap.get(type)!
      data.redemptions.push(redemption)
      data.totalCoins += redemption.coinsSpent
    }

    // Convert to TypeMetrics
    const breakdown: TypeMetrics[] = Array.from(typeMap.entries()).map(
      ([type, data]) => {
        const count = data.redemptions.length
        const statusMap = new Map<string, number>()

        // Count status for this type
        for (const r of data.redemptions) {
          const status = r.status
          statusMap.set(status, (statusMap.get(status) ?? 0) + 1)
        }

        const statusBreakdown = Object.fromEntries(statusMap)

        return {
          type: type as 'voucher' | 'product',
          count,
          percentage: Math.round((count / total) * 10000) / 100,
          totalValueBRL: Math.round(data.totalCoins * COIN_TO_BRL_RATE * 100) / 100,
          statusBreakdown,
        }
      },
    )

    return breakdown.sort((a, b) => b.count - a.count)
  },

  /**
   * Get top 5 most redeemed prizes
   */
  async getTopPrizes(
    companyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<PrizeMetrics[]> {
    // Group by prize to find top ones
    const prizeData = await prisma.redemption.groupBy({
      by: ['prizeId'],
      where: {
        companyId,
        redeemedAt: { gte: startDate, lte: endDate },
      },
      _count: { id: true },
      _sum: { coinsSpent: true },
      orderBy: {
        _count: { id: 'desc' },
      },
      take: 5,
    })

    // Get prize details
    const prizeIds = prizeData.map(p => p.prizeId)
    const prizes = await prisma.prize.findMany({
      where: {
        id: { in: prizeIds },
      },
      select: {
        id: true,
        name: true,
        type: true,
      },
    })

    // Merge data
    const topPrizes: PrizeMetrics[] = prizeData.map(data => {
      const prize = prizes.find(p => p.id === data.prizeId)!
      const totalCoins = data._sum.coinsSpent ?? 0

      return {
        prizeId: data.prizeId,
        prizeName: prize.name,
        prizeType: prize.type as 'voucher' | 'product',
        redemptionCount: data._count.id,
        totalCoinsSpent: totalCoins,
        totalValueBRL: Math.round(totalCoins * COIN_TO_BRL_RATE * 100) / 100,
      }
    })

    return topPrizes
  },

  /**
   * Calculate user engagement metrics
   */
  async calculateUserEngagement(
    companyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<EngagementMetrics> {
    // Get unique users who redeemed
    const uniqueRedeemersData = await prisma.redemption.findMany({
      where: {
        companyId,
        redeemedAt: { gte: startDate, lte: endDate },
      },
      distinct: ['userId'],
      select: { userId: true },
    })

    const uniqueRedeemers = uniqueRedeemersData.length

    // Get total active users
    const totalActiveUsers = await prisma.user.count({
      where: {
        companyId,
        isActive: true,
      },
    })

    // Get user redemption counts to calculate repeat rate
    const userRedemptionCounts = await prisma.redemption.groupBy({
      by: ['userId'],
      where: {
        companyId,
        redeemedAt: { gte: startDate, lte: endDate },
      },
      _count: { id: true },
    })

    const repeatRedeemers = userRedemptionCounts.filter(u => u._count.id >= 2).length
    const totalRedemptionsByUsers = userRedemptionCounts.reduce(
      (sum, u) => sum + u._count.id,
      0,
    )

    const percentageOfActive =
      totalActiveUsers > 0
        ? Math.round((uniqueRedeemers / totalActiveUsers) * 10000) / 100
        : 0

    const repeatRate =
      uniqueRedeemers > 0
        ? Math.round((repeatRedeemers / uniqueRedeemers) * 10000) / 100
        : 0

    const avgRedemptionsPerUser =
      uniqueRedeemers > 0
        ? Math.round((totalRedemptionsByUsers / uniqueRedeemers) * 100) / 100
        : 0

    return {
      uniqueRedeemers,
      totalActiveUsers,
      percentageOfActive,
      repeatRedeemers,
      repeatRate,
      avgRedemptionsPerUser,
    }
  },

  /**
   * Calculate financial impact metrics
   */
  async calculateFinancialImpact(
    companyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<FinancialMetrics> {
    // Get redemptions with prize data
    const redemptions = await prisma.redemption.findMany({
      where: {
        companyId,
        redeemedAt: { gte: startDate, lte: endDate },
      },
      include: {
        prize: {
          select: {
            type: true,
          },
        },
      },
    })

    let voucherCost = 0
    let productCost = 0
    let totalCoins = 0

    for (const redemption of redemptions) {
      const cost = redemption.coinsSpent * COIN_TO_BRL_RATE

      if (redemption.prize.type === 'voucher') {
        voucherCost += cost
      } else if (redemption.prize.type === 'product') {
        productCost += cost
      }

      totalCoins += redemption.coinsSpent
    }

    const totalCost = voucherCost + productCost
    const avgCostPerRedemption =
      redemptions.length > 0
        ? Math.round((totalCost / redemptions.length) * 100) / 100
        : 0

    // Project monthly cost
    const daysDiff = Math.max(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      1,
    )
    const projectedMonthlyCost =
      Math.round((totalCost * (30 / daysDiff)) * 100) / 100

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      voucherCost: Math.round(voucherCost * 100) / 100,
      productCost: Math.round(productCost * 100) / 100,
      avgCostPerRedemption,
      projectedMonthlyCost,
    }
  },

  /**
   * Calculate percentage change between two values
   */
  calculatePercentageChange(previous: number, current: number): number {
    if (previous === 0) {
      return current === 0 ? 0 : 100
    }

    const change = ((current - previous) / previous) * 100
    return Math.round(change * 100) / 100 // 2 decimal places
  },
}
