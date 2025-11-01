import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import { Prisma } from '@prisma/client'

export interface DashboardFilters {
  startDate?: string
  endDate?: string
  departmentId?: string
  jobTitleId?: string
}

/**
 * Dashboard service for calculating company-wide statistics and metrics
 */
export const dashboardService = {
  /**
   * Build user filters for compliments queries
   * Filters by sender OR receiver matching the criteria
   */
  buildUserFilters(
    departmentId?: string,
    jobTitleId?: string,
  ): Prisma.ComplimentWhereInput | undefined {
    if (!departmentId && !jobTitleId) {
      return undefined
    }

    // If both filters are provided
    if (departmentId && jobTitleId) {
      return {
        OR: [
          {
            sender: {
              departmentId,
              jobTitleId,
            },
          },
          {
            receiver: {
              departmentId,
              jobTitleId,
            },
          },
        ],
      }
    }

    // If only department filter
    if (departmentId) {
      return {
        OR: [
          { sender: { departmentId } },
          { receiver: { departmentId } },
        ],
      }
    }

    // If only job title filter
    return {
      OR: [
        { sender: { jobTitleId } },
        { receiver: { jobTitleId } },
      ],
    }
  },

  /**
   * Build user count filters
   */
  buildUserCountFilters(
    departmentId?: string,
    jobTitleId?: string,
  ): Prisma.UserWhereInput {
    const filters: Prisma.UserWhereInput = {
      isActive: true,
    }

    if (departmentId) {
      filters.departmentId = departmentId
    }

    if (jobTitleId) {
      filters.jobTitleId = jobTitleId
    }

    return filters
  },

  /**
   * Get comprehensive dashboard statistics for a company
   *
   * @param companyId - The company ID to get statistics for
   * @param filters - Optional filters (startDate, endDate, departmentId, jobTitleId)
   * @returns Dashboard statistics including metrics, top values, and weekly trends
   */
  async getCompanyStats(companyId: string, filters: DashboardFilters = {}) {
    logger.info('Fetching dashboard statistics', { companyId, filters })

    // Parse dates or use defaults
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date()
    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : (() => {
          const date = new Date()
          date.setDate(date.getDate() - 30)
          return date
        })()

    // Build filters
    const userFilters = this.buildUserFilters(filters.departmentId, filters.jobTitleId)
    const userCountFilters = this.buildUserCountFilters(
      filters.departmentId,
      filters.jobTitleId,
    )

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
            ...userFilters,
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
            ...userFilters,
          },
          _sum: {
            coins: true,
          },
        }),

        // Active users - users who either SENT compliments OR REDEEMED prizes
        // This gives us the count of unique users who engaged with the platform
        this.getActiveUsersCount(
          companyId,
          startDate,
          endDate,
          filters.departmentId,
          filters.jobTitleId,
        ),

        // Total active users in the company (filtered by department/job title if provided)
        prisma.user.count({
          where: {
            companyId,
            ...userCountFilters,
          },
        }),

        // Total prizes redeemed in the period (filtered by department/job title)
        prisma.redemption.count({
          where: {
            companyId,
            redeemedAt: {
              gte: startDate,
              lte: endDate,
            },
            user: {
              ...(filters.departmentId && { departmentId: filters.departmentId }),
              ...(filters.jobTitleId && { jobTitleId: filters.jobTitleId }),
            },
          },
        }),

        // Top company values by compliment count
        this.getTopValues(
          companyId,
          startDate,
          endDate,
          filters.departmentId,
          filters.jobTitleId,
        ),

        // Weekly compliment trends
        this.getWeeklyCompliments(
          companyId,
          startDate,
          endDate,
          filters.departmentId,
          filters.jobTitleId,
        ),
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
   * @param departmentId - Optional department filter
   * @param jobTitleId - Optional job title filter
   * @returns Object with count of active users
   */
  async getActiveUsersCount(
    companyId: string,
    startDate: Date,
    endDate: Date,
    departmentId?: string,
    jobTitleId?: string,
  ) {
    const userFilters = this.buildUserFilters(departmentId, jobTitleId)

    // Get distinct users who sent compliments
    const complimentSenders = await prisma.compliment.findMany({
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...userFilters,
      },
      select: {
        senderId: true,
        receiverId: true,
      },
    })

    // Get distinct users who redeemed prizes
    const prizeRedeemers = await prisma.redemption.findMany({
      where: {
        companyId,
        redeemedAt: {
          gte: startDate,
          lte: endDate,
        },
        user: {
          ...(departmentId && { departmentId }),
          ...(jobTitleId && { jobTitleId }),
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    })

    // Extract user IDs from compliments (both senders and receivers that match filters)
    const complimentUserIds = new Set<string>()

    for (const compliment of complimentSenders) {
      // We need to check which users match the filters
      // Since the query already filtered by sender OR receiver,
      // we need to verify which specific users match
      const [sender, receiver] = await Promise.all([
        prisma.user.findUnique({
          where: { id: compliment.senderId },
          select: { departmentId: true, jobTitleId: true },
        }),
        prisma.user.findUnique({
          where: { id: compliment.receiverId },
          select: { departmentId: true, jobTitleId: true },
        }),
      ])

      // Check if sender matches filters
      if (sender) {
        const senderMatches =
          (!departmentId || sender.departmentId === departmentId) &&
          (!jobTitleId || sender.jobTitleId === jobTitleId)
        if (senderMatches) {
          complimentUserIds.add(compliment.senderId)
        }
      }

      // Check if receiver matches filters
      if (receiver) {
        const receiverMatches =
          (!departmentId || receiver.departmentId === departmentId) &&
          (!jobTitleId || receiver.jobTitleId === jobTitleId)
        if (receiverMatches) {
          complimentUserIds.add(compliment.receiverId)
        }
      }
    }

    // Combine all active user IDs
    const activeUserIds = new Set([
      ...complimentUserIds,
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
   * @param departmentId - Optional department filter
   * @param jobTitleId - Optional job title filter
   * @returns Array of all company values with count and percentage, ordered by count descending
   */
  async getTopValues(
    companyId: string,
    startDate: Date,
    endDate: Date,
    departmentId?: string,
    jobTitleId?: string,
  ) {
    const userFilters = this.buildUserFilters(departmentId, jobTitleId)

    // Get compliment counts grouped by value
    const valueCounts = await prisma.compliment.groupBy({
      by: ['valueId'],
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...userFilters,
      },
      _count: {
        valueId: true,
      },
      orderBy: {
        _count: {
          valueId: 'desc',
        },
      },
    })

    if (valueCounts.length === 0) {
      return []
    }

    // Calculate total compliments for percentage calculation
    const totalCount = valueCounts.reduce(
      (sum, item) => sum + item._count.valueId,
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
        iconName: true,
        iconColor: true,
      },
    })

    // Create a map for quick lookup
    const valueMap = new Map(values.map((v) => [v.id, v]))

    // Combine data
    return valueCounts.map((item) => {
      const value = valueMap.get(item.valueId)
      const percentage = (item._count.valueId / totalCount) * 100

      return {
        valueId: item.valueId,
        valueName: value?.title ?? 'Unknown Value',
        count: item._count.valueId,
        percentage: parseFloat(percentage.toFixed(2)),
      }
    })
  },

  /**
   * Get compliment counts grouped by week
   *
   * @param companyId - The company ID
   * @param startDate - Start date of the period
   * @param endDate - End date of the period
   * @param departmentId - Optional department filter
   * @param jobTitleId - Optional job title filter
   * @returns Array of weekly compliment counts
   */
  async getWeeklyCompliments(
    companyId: string,
    startDate: Date,
    endDate: Date,
    departmentId?: string,
    jobTitleId?: string,
  ) {
    // Build query based on which filters are provided
    // This avoids Prisma tagged template literal issues with undefined values
    let weeklyData: Array<{ week_start: Date; count: bigint }>

    if (departmentId && jobTitleId) {
      // Both filters provided
      weeklyData = await prisma.$queryRaw<Array<{ week_start: Date; count: bigint }>>`
        SELECT
          DATE_TRUNC('week', c.created_at) as week_start,
          COUNT(*) as count
        FROM compliments c
        INNER JOIN users sender ON c.sender_id = sender.id
        INNER JOIN users receiver ON c.receiver_id = receiver.id
        WHERE c.company_id = ${companyId}
          AND c.created_at >= ${startDate}
          AND c.created_at <= ${endDate}
          AND (sender.department_id = ${departmentId} OR receiver.department_id = ${departmentId})
          AND (sender.job_title_id = ${jobTitleId} OR receiver.job_title_id = ${jobTitleId})
        GROUP BY week_start
        ORDER BY week_start ASC
      `
    } else if (departmentId) {
      // Only department filter
      weeklyData = await prisma.$queryRaw<Array<{ week_start: Date; count: bigint }>>`
        SELECT
          DATE_TRUNC('week', c.created_at) as week_start,
          COUNT(*) as count
        FROM compliments c
        INNER JOIN users sender ON c.sender_id = sender.id
        INNER JOIN users receiver ON c.receiver_id = receiver.id
        WHERE c.company_id = ${companyId}
          AND c.created_at >= ${startDate}
          AND c.created_at <= ${endDate}
          AND (sender.department_id = ${departmentId} OR receiver.department_id = ${departmentId})
        GROUP BY week_start
        ORDER BY week_start ASC
      `
    } else if (jobTitleId) {
      // Only job title filter
      weeklyData = await prisma.$queryRaw<Array<{ week_start: Date; count: bigint }>>`
        SELECT
          DATE_TRUNC('week', c.created_at) as week_start,
          COUNT(*) as count
        FROM compliments c
        INNER JOIN users sender ON c.sender_id = sender.id
        INNER JOIN users receiver ON c.receiver_id = receiver.id
        WHERE c.company_id = ${companyId}
          AND c.created_at >= ${startDate}
          AND c.created_at <= ${endDate}
          AND (sender.job_title_id = ${jobTitleId} OR receiver.job_title_id = ${jobTitleId})
        GROUP BY week_start
        ORDER BY week_start ASC
      `
    } else {
      // No user filters
      weeklyData = await prisma.$queryRaw<Array<{ week_start: Date; count: bigint }>>`
        SELECT
          DATE_TRUNC('week', c.created_at) as week_start,
          COUNT(*) as count
        FROM compliments c
        WHERE c.company_id = ${companyId}
          AND c.created_at >= ${startDate}
          AND c.created_at <= ${endDate}
        GROUP BY week_start
        ORDER BY week_start ASC
      `
    }

    return weeklyData.map((item) => ({
      weekStart: item.week_start.toISOString().split('T')[0],
      count: Number(item.count),
    }))
  },
}
