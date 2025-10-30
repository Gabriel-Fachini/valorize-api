import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

/**
 * Dashboard service for calculating company-wide statistics and metrics
 */
export const dashboardService = {
  /**
   * Get comprehensive dashboard statistics for a company
   *
   * @param companyId - The company ID to get statistics for
   * @param days - Number of days to look back (default: 30)
   * @returns Dashboard statistics including metrics, top values, and weekly trends
   */
  async getCompanyStats(companyId: string, days: number = 30) {
    logger.info('Fetching dashboard statistics', { companyId, days })

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    try {
      // Execute all queries in parallel for better performance
      const [
        totalCompliments,
        coinsStats,
        activeUsersData,
        totalUsers,
        prizesRedeemed,
        topValuesData,
        weeklyData,
      ] = await Promise.all([
        // Total compliments sent in the period
        prisma.compliment.count({
          where: {
            companyId,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),

        // Total coins distributed
        prisma.compliment.aggregate({
          where: {
            companyId,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: {
            coins: true,
          },
        }),

        // Active users - users who either SENT compliments OR REDEEMED prizes
        // This gives us the count of unique users who engaged with the platform
        this.getActiveUsersCount(companyId, startDate, endDate),

        // Total active users in the company
        prisma.user.count({
          where: {
            companyId,
            isActive: true,
          },
        }),

        // Total prizes redeemed in the period
        prisma.redemption.count({
          where: {
            companyId,
            redeemedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),

        // Top company values by compliment count
        this.getTopValues(companyId, startDate, endDate),

        // Weekly compliment trends for the last 8 weeks
        this.getWeeklyCompliments(companyId),
      ])

      const coinsDistributed = coinsStats._sum.coins ?? 0
      const activeUsersCount = activeUsersData.count
      const activeUsersPercentage =
        totalUsers > 0 ? (activeUsersCount / totalUsers) * 100 : 0

      // Engagement rate: average number of compliments per active user
      // This shows how engaged the active users are with the platform
      const engagementRate =
        activeUsersCount > 0 ? totalCompliments / activeUsersCount : 0

      logger.info('Dashboard statistics calculated successfully', {
        companyId,
        totalCompliments,
        activeUsersCount,
        engagementRate,
      })

      return {
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        metrics: {
          totalCompliments,
          coinsDistributed,
          activeUsers: {
            count: activeUsersCount,
            percentage: parseFloat(activeUsersPercentage.toFixed(2)),
          },
          prizesRedeemed,
          engagementRate: parseFloat(engagementRate.toFixed(2)),
        },
        topValues: topValuesData,
        weeklyCompliments: weeklyData,
        generatedAt: new Date().toISOString(),
      }
    } catch (error) {
      logger.error('Error fetching dashboard statistics', { error, companyId })
      throw new Error('Failed to retrieve dashboard statistics')
    }
  },

  /**
   * Calculate active users count
   *
   * Active users are defined as users who have:
   * 1. Sent at least one compliment in the period, OR
   * 2. Redeemed at least one prize in the period
   *
   * This approach counts users who actively engaged with the platform,
   * not just those who received compliments passively.
   *
   * @param companyId - The company ID
   * @param startDate - Start date of the period
   * @param endDate - End date of the period
   * @returns Object with count of active users
   */
  async getActiveUsersCount(
    companyId: string,
    startDate: Date,
    endDate: Date,
  ) {
    // Get distinct users who sent compliments
    const complimentSenders = await prisma.compliment.findMany({
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        senderId: true,
      },
      distinct: ['senderId'],
    })

    // Get distinct users who redeemed prizes
    const prizeRedeemers = await prisma.redemption.findMany({
      where: {
        companyId,
        redeemedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    })

    // Combine and deduplicate user IDs using a Set
    const activeUserIds = new Set([
      ...complimentSenders.map((c) => c.senderId),
      ...prizeRedeemers.map((r) => r.userId),
    ])

    return {
      count: activeUserIds.size,
    }
  },

  /**
   * Get most practiced company values ordered by usage
   *
   * @param companyId - The company ID
   * @param startDate - Start date of the period
   * @param endDate - End date of the period
   * @returns Array of all company values with count and percentage, ordered by count descending
   */
  async getTopValues(companyId: string, startDate: Date, endDate: Date) {
    // Get compliment counts grouped by value
    const valueCounts = await prisma.compliment.groupBy({
      by: ['valueId'],
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    })

    if (valueCounts.length === 0) {
      return []
    }

    // Calculate total compliments for percentage calculation
    const totalCount = valueCounts.reduce(
      (sum, item) => sum + item._count.id,
      0,
    )

    // Get value details
    const valueIds = valueCounts.map((v) => v.valueId)
    const values = await prisma.companyValue.findMany({
      where: {
        id: {
          in: valueIds,
        },
        companyId,
      },
      select: {
        id: true,
        title: true,
        icon: true,
      },
    })

    // Create a map for quick lookup
    const valueMap = new Map(values.map((v) => [v.id, v]))

    // Combine data
    return valueCounts.map((item) => {
      const value = valueMap.get(item.valueId)
      const percentage = (item._count.id / totalCount) * 100

      return {
        valueId: item.valueId,
        valueName: value?.title ?? 'Unknown Value',
        count: item._count.id,
        percentage: parseFloat(percentage.toFixed(2)),
      }
    })
  },

  /**
   * Get compliment counts grouped by week for the last 8 weeks
   *
   * @param companyId - The company ID
   * @returns Array of weekly compliment counts
   */
  async getWeeklyCompliments(companyId: string) {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 56) // 8 weeks = 56 days

    // Use raw SQL for date truncation as Prisma doesn't have native support
    // for DATE_TRUNC across all databases in the same way
    const weeklyData = await prisma.$queryRaw<
      Array<{ week_start: Date; count: bigint }>
    >`
      SELECT
        DATE_TRUNC('week', created_at) as week_start,
        COUNT(*) as count
      FROM compliments
      WHERE company_id = ${companyId}
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
      GROUP BY week_start
      ORDER BY week_start ASC
    `

    return weeklyData.map((item) => ({
      weekStart: item.week_start.toISOString().split('T')[0],
      count: Number(item.count),
    }))
  },
}
