import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import { Prisma } from '@prisma/client'
import {
  ComplimentsDashboard,
  DashboardFilters,
  DashboardPeriod,
  OverviewMetrics,
  ValueDistribution,
  TopSender,
  TopReceiver,
  BalancedUser,
  DepartmentStat,
  CrossDepartmentFlow,
  WeeklyTrend,
  DayOfWeekDistribution,
  HourlyDistribution,
  MonthlyGrowth,
  Insight,
  RecentCompliment,
  EngagementMetrics,
  InactiveUser,
  DashboardMetadata
} from './compliments-dashboard.types'

class ComplimentsDashboardService {
  /**
   * Get complete dashboard data for compliments
   */
  async getCompleteDashboard(
    companyId: string,
    startDate: Date,
    endDate: Date,
    filters?: Omit<DashboardFilters, 'startDate' | 'endDate'>
  ): Promise<ComplimentsDashboard> {
    const startTime = Date.now()

    try {
      // Calculate previous period for comparisons
      const periodLength = endDate.getTime() - startDate.getTime()
      const previousEndDate = new Date(startDate.getTime() - 1)
      const previousStartDate = new Date(previousEndDate.getTime() - periodLength)

      const period: DashboardPeriod = {
        startDate,
        endDate,
        previousPeriod: {
          startDate: previousStartDate,
          endDate: previousEndDate
        }
      }

      // Execute all queries in parallel for maximum performance
      const [
        overview,
        valuesDistribution,
        topSenders,
        topReceivers,
        balancedUsers,
        departmentStats,
        crossDepartmentFlow,
        weeklyTrend,
        dayOfWeekDistribution,
        hourlyDistribution,
        monthlyGrowth,
        recentActivity,
        engagementMetrics,
        companyInfo
      ] = await Promise.all([
        this.getOverviewMetrics(companyId, startDate, endDate, previousStartDate, previousEndDate, filters),
        this.getValuesDistribution(companyId, startDate, endDate, previousStartDate, previousEndDate),
        this.getTopSenders(companyId, startDate, endDate, filters),
        this.getTopReceivers(companyId, startDate, endDate, filters),
        this.getBalancedUsers(companyId, startDate, endDate, filters),
        this.getDepartmentStats(companyId, startDate, endDate),
        this.getCrossDepartmentFlow(companyId, startDate, endDate),
        this.getWeeklyTrend(companyId, startDate, endDate),
        this.getDayOfWeekDistribution(companyId, startDate, endDate),
        this.getHourlyDistribution(companyId, startDate, endDate),
        this.getMonthlyGrowth(companyId),
        this.getRecentActivity(companyId, filters),
        this.getEngagementMetrics(companyId, startDate, endDate),
        this.getCompanyInfo(companyId)
      ])

      // Generate insights based on collected data
      const insights = this.generateInsights({
        overview,
        valuesDistribution,
        departmentStats,
        engagementMetrics
      })

      const executionTime = Date.now() - startTime

      return {
        period,
        overview,
        valuesDistribution,
        topUsers: {
          senders: topSenders,
          receivers: topReceivers,
          balanced: balancedUsers
        },
        departmentAnalytics: {
          departments: departmentStats,
          crossDepartmentFlow
        },
        temporalPatterns: {
          weeklyTrend,
          dayOfWeekDistribution,
          hourlyDistribution,
          monthlyGrowth
        },
        insights,
        recentActivity,
        engagementMetrics,
        metadata: {
          generatedAt: new Date().toISOString(),
          executionTime,
          filters: {
            departmentId: filters?.departmentId || null,
            jobTitleId: filters?.jobTitleId || null
          },
          companyInfo
        }
      }
    } catch (error) {
      logger.error('Error generating compliments dashboard', { error, companyId })
      throw error
    }
  }

  /**
   * Get overview metrics with period comparison
   */
  private async getOverviewMetrics(
    companyId: string,
    startDate: Date,
    endDate: Date,
    previousStartDate: Date,
    previousEndDate: Date,
    filters?: Omit<DashboardFilters, 'startDate' | 'endDate'>
  ): Promise<OverviewMetrics> {
    // Build where clause with optional filters
    const whereClause: Prisma.ComplimentWhereInput = {
      companyId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }

    if (filters?.departmentId) {
      whereClause.OR = [
        { sender: { departmentId: filters.departmentId } },
        { receiver: { departmentId: filters.departmentId } }
      ]
    }

    if (filters?.jobTitleId) {
      if (!whereClause.OR) {
        whereClause.OR = []
      }
      whereClause.OR.push(
        { sender: { jobTitleId: filters.jobTitleId } },
        { receiver: { jobTitleId: filters.jobTitleId } }
      )
    }

    // Current period metrics
    const [currentCount, currentSum, uniqueSenders, totalUsers] = await Promise.all([
      prisma.compliment.count({ where: whereClause }),
      prisma.compliment.aggregate({
        where: whereClause,
        _sum: { coins: true }
      }),
      prisma.compliment.findMany({
        where: whereClause,
        select: { senderId: true },
        distinct: ['senderId']
      }),
      prisma.user.count({
        where: {
          companyId,
          isActive: true,
          ...(filters?.departmentId && { departmentId: filters.departmentId }),
          ...(filters?.jobTitleId && { jobTitleId: filters.jobTitleId })
        }
      })
    ])

    // Previous period metrics for comparison
    const previousWhereClause = {
      ...whereClause,
      createdAt: {
        gte: previousStartDate,
        lte: previousEndDate
      }
    }

    const [previousCount, previousSum, previousUniqueSenders] = await Promise.all([
      prisma.compliment.count({ where: previousWhereClause }),
      prisma.compliment.aggregate({
        where: previousWhereClause,
        _sum: { coins: true }
      }),
      prisma.compliment.findMany({
        where: previousWhereClause,
        select: { senderId: true },
        distinct: ['senderId']
      })
    ])

    const totalCoinsDistributed = currentSum._sum.coins || 0
    const previousCoinsDistributed = previousSum._sum.coins || 0
    const activeUsersCount = uniqueSenders.length
    const previousActiveUsersCount = previousUniqueSenders.length

    // Calculate changes
    const complimentsChange = previousCount === 0
      ? (currentCount > 0 ? 100 : 0)
      : ((currentCount - previousCount) / previousCount) * 100

    const coinsChange = previousCoinsDistributed === 0
      ? (totalCoinsDistributed > 0 ? 100 : 0)
      : ((totalCoinsDistributed - previousCoinsDistributed) / previousCoinsDistributed) * 100

    const usersChange = previousActiveUsersCount === 0
      ? (activeUsersCount > 0 ? 100 : 0)
      : ((activeUsersCount - previousActiveUsersCount) / previousActiveUsersCount) * 100

    return {
      totalCompliments: currentCount,
      totalCoinsDistributed,
      activeUsers: {
        count: activeUsersCount,
        percentage: totalUsers > 0 ? (activeUsersCount / totalUsers) * 100 : 0,
        total: totalUsers
      },
      avgCoinsPerCompliment: currentCount > 0 ? totalCoinsDistributed / currentCount : 0,
      engagementRate: activeUsersCount > 0 ? currentCount / activeUsersCount : 0,
      comparison: {
        complimentsChange: Math.round(complimentsChange * 100) / 100,
        complimentsChangeLabel: `${complimentsChange >= 0 ? '+' : ''}${Math.round(complimentsChange)}%`,
        coinsChange: Math.round(coinsChange * 100) / 100,
        coinsChangeLabel: `${coinsChange >= 0 ? '+' : ''}${Math.round(coinsChange)}%`,
        usersChange: Math.round(usersChange * 100) / 100,
        usersChangeLabel: `${usersChange >= 0 ? '+' : ''}${Math.round(usersChange)}%`
      }
    }
  }

  /**
   * Get company values distribution
   */
  private async getValuesDistribution(
    companyId: string,
    startDate: Date,
    endDate: Date,
    previousStartDate: Date,
    previousEndDate: Date
  ): Promise<ValueDistribution[]> {
    // Get current period distribution
    const currentDistribution = await prisma.compliment.groupBy({
      by: ['valueId'],
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: true,
      _sum: {
        coins: true
      }
    })

    // Get previous period distribution for trend calculation
    const previousDistribution = await prisma.compliment.groupBy({
      by: ['valueId'],
      where: {
        companyId,
        createdAt: {
          gte: previousStartDate,
          lte: previousEndDate
        }
      },
      _count: true
    })

    // Get all company values info
    const companyValues = await prisma.companyValue.findMany({
      where: {
        companyId,
        id: {
          in: currentDistribution.map(d => d.valueId)
        }
      }
    })

    // Create lookup maps
    const valueMap = new Map(companyValues.map((v: any) => [v.id, v]))
    const previousMap = new Map(previousDistribution.map((p: any) => [p.valueId, p._count]))

    // Calculate total for percentages
    const total = currentDistribution.reduce((sum: number, d: any) => sum + d._count, 0)

    // Build distribution with trends
    return currentDistribution
      .map((dist: any) => {
        const value = valueMap.get(dist.valueId)
        const previousCount = previousMap.get(dist.valueId) || 0
        const currentCount = dist._count

        let trend: 'up' | 'down' | 'stable' = 'stable'
        let trendPercentage = 0

        if (previousCount === 0) {
          trend = currentCount > 0 ? 'up' : 'stable'
          trendPercentage = currentCount > 0 ? 100 : 0
        } else {
          trendPercentage = ((currentCount - previousCount) / previousCount) * 100
          if (trendPercentage > 5) trend = 'up'
          else if (trendPercentage < -5) trend = 'down'
        }

        return {
          valueId: dist.valueId,
          valueName: (value as any)?.title || 'Unknown Value',
          description: (value as any)?.description || null,
          iconName: (value as any)?.iconName || null,
          iconColor: (value as any)?.iconColor || null,
          count: currentCount,
          percentage: total > 0 ? (currentCount / total) * 100 : 0,
          totalCoins: dist._sum.coins || 0,
          trend,
          trendPercentage: Math.round(trendPercentage * 100) / 100
        }
      })
      .sort((a: any, b: any) => b.count - a.count)
  }

  /**
   * Get top senders
   */
  private async getTopSenders(
    companyId: string,
    startDate: Date,
    endDate: Date,
    filters?: Omit<DashboardFilters, 'startDate' | 'endDate'>,
    limit: number = 10
  ): Promise<TopSender[]> {
    const whereClause: Prisma.ComplimentWhereInput = {
      companyId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }

    if (filters?.departmentId) {
      whereClause.sender = { departmentId: filters.departmentId }
    }

    if (filters?.jobTitleId) {
      if (!whereClause.sender) {
        whereClause.sender = {}
      }
      whereClause.sender = {
        ...(whereClause.sender as any),
        jobTitleId: filters.jobTitleId
      }
    }

    const topSenders = await prisma.compliment.groupBy({
      by: ['senderId'],
      where: whereClause,
      _count: true,
      _sum: {
        coins: true
      },
      orderBy: {
        _count: {
          senderId: 'desc'
        }
      },
      take: limit
    })

    // Get user details
    const userIds = topSenders.map((s: any) => s.senderId)
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds }
      },
      include: {
        department: true,
        jobTitle: true
      }
    })

    const userMap = new Map(users.map((u: any) => [u.id, u]))

    return topSenders.map((sender: any) => {
      const user = userMap.get(sender.senderId) as any
      const totalCoins = sender._sum.coins || 0
      const count = sender._count

      return {
        userId: sender.senderId,
        name: user?.name || 'Unknown User',
        email: user?.email || '',
        avatar: user?.avatar || null,
        department: user?.department?.name || null,
        jobTitle: user?.jobTitle?.name || null,
        sentCount: count,
        totalCoinsSent: totalCoins,
        avgCoinsPerCompliment: count > 0 ? totalCoins / count : 0
      }
    })
  }

  /**
   * Get top receivers
   */
  private async getTopReceivers(
    companyId: string,
    startDate: Date,
    endDate: Date,
    filters?: Omit<DashboardFilters, 'startDate' | 'endDate'>,
    limit: number = 10
  ): Promise<TopReceiver[]> {
    const whereClause: Prisma.ComplimentWhereInput = {
      companyId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }

    if (filters?.departmentId) {
      whereClause.receiver = { departmentId: filters.departmentId }
    }

    if (filters?.jobTitleId) {
      if (!whereClause.receiver) {
        whereClause.receiver = {}
      }
      whereClause.receiver = {
        ...(whereClause.receiver as any),
        jobTitleId: filters.jobTitleId
      }
    }

    const topReceivers = await prisma.compliment.groupBy({
      by: ['receiverId'],
      where: whereClause,
      _count: true,
      _sum: {
        coins: true
      },
      orderBy: {
        _count: {
          receiverId: 'desc'
        }
      },
      take: limit
    })

    // Get user details
    const userIds = topReceivers.map((r: any) => r.receiverId)
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds }
      },
      include: {
        department: true,
        jobTitle: true
      }
    })

    const userMap = new Map(users.map((u: any) => [u.id, u]))

    return topReceivers.map((receiver: any) => {
      const user = userMap.get(receiver.receiverId) as any
      const totalCoins = receiver._sum.coins || 0
      const count = receiver._count

      return {
        userId: receiver.receiverId,
        name: user?.name || 'Unknown User',
        email: user?.email || '',
        avatar: user?.avatar || null,
        department: user?.department?.name || null,
        jobTitle: user?.jobTitle?.name || null,
        receivedCount: count,
        totalCoinsReceived: totalCoins,
        avgCoinsPerCompliment: count > 0 ? totalCoins / count : 0
      }
    })
  }

  /**
   * Get balanced users (who both send and receive)
   */
  private async getBalancedUsers(
    companyId: string,
    startDate: Date,
    endDate: Date,
    filters?: Omit<DashboardFilters, 'startDate' | 'endDate'>,
    limit: number = 5
  ): Promise<BalancedUser[]> {
    const whereClause: any = {
      companyId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }

    // Get sent counts
    const sentCounts = await prisma.compliment.groupBy({
      by: ['senderId'],
      where: whereClause,
      _count: true
    })

    // Get received counts
    const receivedCounts = await prisma.compliment.groupBy({
      by: ['receiverId'],
      where: whereClause,
      _count: true
    })

    // Create maps for easy lookup
    const sentMap = new Map(sentCounts.map((s: any) => [s.senderId, s._count]))
    const receivedMap = new Map(receivedCounts.map((r: any) => [r.receiverId, r._count]))

    // Get all unique user IDs
    const allUserIds = new Set([
      ...sentCounts.map((s: any) => s.senderId),
      ...receivedCounts.map((r: any) => r.receiverId)
    ])

    // Calculate balance scores
    const userScores = Array.from(allUserIds).map((userId: any) => {
      const sent = sentMap.get(userId) as number || 0
      const received = receivedMap.get(userId) as number || 0

      // Only include users who both send and receive
      if (sent === 0 || received === 0) return null

      // Balance score: closer to 1 means more balanced
      const balanceScore = Math.min(sent, received) / Math.max(sent, received)

      return {
        userId,
        sent,
        received,
        balanceScore
      }
    }).filter(Boolean)

    // Sort by balance score (most balanced first)
    userScores.sort((a: any, b: any) => b!.balanceScore - a!.balanceScore)

    // Get top balanced users
    const topBalanced = userScores.slice(0, limit)

    // Get user details
    const userIds = topBalanced.map((u: any) => u!.userId)
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds }
      },
      include: {
        department: true
      }
    })

    const userMap = new Map(users.map((u: any) => [u.id, u]))

    return topBalanced.map((score: any) => {
      const user = userMap.get(score!.userId) as any

      return {
        userId: score!.userId,
        name: user?.name || 'Unknown User',
        email: user?.email || '',
        avatar: user?.avatar || null,
        department: user?.department?.name || null,
        sentCount: score!.sent,
        receivedCount: score!.received,
        balanceScore: Math.round(score!.balanceScore * 100) / 100
      }
    })
  }

  /**
   * Get department statistics
   */
  private async getDepartmentStats(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DepartmentStat[]> {
    // Get all departments with user counts
    const departments = await prisma.department.findMany({
      where: {
        companyId
      },
      include: {
        _count: {
          select: {
            users: {
              where: {
                isActive: true
              }
            }
          }
        }
      }
    })

    // Get compliments by department (senders)
    const complimentsByDept = await prisma.$queryRaw<Array<{
      department_id: string
      total_compliments: bigint
      total_coins: bigint
      unique_senders: bigint
    }>>`
      SELECT
        u.department_id,
        COUNT(c.id) as total_compliments,
        SUM(c.coins) as total_coins,
        COUNT(DISTINCT c.sender_id) as unique_senders
      FROM compliments c
      JOIN users u ON c.sender_id = u.id
      WHERE c.company_id = ${companyId}
        AND c.created_at >= ${startDate}
        AND c.created_at <= ${endDate}
        AND u.department_id IS NOT NULL
      GROUP BY u.department_id
    `

    // Get top value per department
    const topValuesByDept = await prisma.$queryRaw<Array<{
      department_id: string
      value_id: number
      value_count: bigint
    }>>`
      WITH dept_values AS (
        SELECT
          u.department_id,
          c.value_id,
          COUNT(*) as value_count,
          ROW_NUMBER() OVER (PARTITION BY u.department_id ORDER BY COUNT(*) DESC) as rn
        FROM compliments c
        JOIN users u ON c.sender_id = u.id
        WHERE c.company_id = ${companyId}
          AND c.created_at >= ${startDate}
          AND c.created_at <= ${endDate}
          AND u.department_id IS NOT NULL
        GROUP BY u.department_id, c.value_id
      )
      SELECT department_id, value_id, value_count
      FROM dept_values
      WHERE rn = 1
    `

    // Get company values for names
    const valueIds = topValuesByDept.map((v: any) => v.value_id)
    const companyValues = await prisma.companyValue.findMany({
      where: {
        id: { in: valueIds }
      }
    })
    const valueMap = new Map(companyValues.map((v: any) => [v.id, v.title]))

    // Create lookup maps
    const statsMap = new Map(complimentsByDept.map((d: any) => [d.department_id, d]))
    const topValuesMap = new Map(topValuesByDept.map((v: any) => [v.department_id, v]))

    return departments.map((dept: any) => {
      const stats = statsMap.get(dept.id) as any
      const topValue = topValuesMap.get(dept.id) as any
      const totalUsers = dept._count.users
      const activeUsers = Number(stats?.unique_senders || 0)
      const totalCompliments = Number(stats?.total_compliments || 0)

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        totalUsers,
        activeUsers,
        totalCompliments,
        avgPerUser: totalUsers > 0 ? totalCompliments / totalUsers : 0,
        engagementRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
        topValue: topValue ? {
          valueName: valueMap.get(topValue.value_id) || 'Unknown',
          count: Number(topValue.value_count)
        } : null
      }
    }).sort((a: any, b: any) => b.totalCompliments - a.totalCompliments)
  }

  /**
   * Get cross-department flow
   */
  private async getCrossDepartmentFlow(
    companyId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 20
  ): Promise<CrossDepartmentFlow[]> {
    const flows = await prisma.$queryRaw<Array<{
      from_dept_id: string | null
      from_dept_name: string | null
      to_dept_id: string | null
      to_dept_name: string | null
      compliment_count: bigint
      coin_amount: bigint
    }>>`
      SELECT
        sender_u.department_id as from_dept_id,
        sender_d.name as from_dept_name,
        receiver_u.department_id as to_dept_id,
        receiver_d.name as to_dept_name,
        COUNT(*) as compliment_count,
        SUM(c.coins) as coin_amount
      FROM compliments c
      JOIN users sender_u ON c.sender_id = sender_u.id
      JOIN users receiver_u ON c.receiver_id = receiver_u.id
      LEFT JOIN departments sender_d ON sender_u.department_id = sender_d.id
      LEFT JOIN departments receiver_d ON receiver_u.department_id = receiver_d.id
      WHERE c.company_id = ${companyId}
        AND c.created_at >= ${startDate}
        AND c.created_at <= ${endDate}
      GROUP BY
        sender_u.department_id,
        sender_d.name,
        receiver_u.department_id,
        receiver_d.name
      ORDER BY compliment_count DESC
      LIMIT ${limit}
    `

    return flows.map((flow: any) => ({
      fromDepartmentId: flow.from_dept_id,
      fromDepartmentName: flow.from_dept_name || 'No Department',
      toDepartmentId: flow.to_dept_id,
      toDepartmentName: flow.to_dept_name || 'No Department',
      complimentCount: Number(flow.compliment_count),
      coinAmount: Number(flow.coin_amount)
    }))
  }

  /**
   * Get weekly trend
   */
  private async getWeeklyTrend(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WeeklyTrend[]> {
    const trends = await prisma.$queryRaw<Array<{
      week_start: Date
      count: bigint
      coins: bigint
    }>>`
      SELECT
        DATE_TRUNC('week', created_at) as week_start,
        COUNT(*) as count,
        SUM(coins) as coins
      FROM compliments
      WHERE company_id = ${companyId}
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
      GROUP BY week_start
      ORDER BY week_start DESC
    `

    return trends.map((trend: any) => {
      const weekStart = new Date(trend.week_start)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      return {
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        count: Number(trend.count),
        coins: Number(trend.coins)
      }
    })
  }

  /**
   * Get day of week distribution
   */
  private async getDayOfWeekDistribution(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DayOfWeekDistribution[]> {
    const distribution = await prisma.$queryRaw<Array<{
      day_of_week: number
      count: bigint
    }>>`
      SELECT
        EXTRACT(DOW FROM created_at) as day_of_week,
        COUNT(*) as count
      FROM compliments
      WHERE company_id = ${companyId}
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
      GROUP BY day_of_week
      ORDER BY day_of_week
    `

    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    const total = distribution.reduce((sum: number, d: any) => sum + Number(d.count), 0)

    return distribution.map((d: any) => ({
      dayOfWeek: Number(d.day_of_week),
      dayName: dayNames[Number(d.day_of_week)],
      count: Number(d.count),
      percentage: total > 0 ? (Number(d.count) / total) * 100 : 0
    }))
  }

  /**
   * Get hourly distribution
   */
  private async getHourlyDistribution(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<HourlyDistribution[]> {
    const distribution = await prisma.$queryRaw<Array<{
      hour: number
      count: bigint
    }>>`
      SELECT
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as count
      FROM compliments
      WHERE company_id = ${companyId}
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
      GROUP BY hour
      ORDER BY hour
    `

    const total = distribution.reduce((sum: number, d: any) => sum + Number(d.count), 0)

    // Fill in missing hours with 0
    const hourMap = new Map(distribution.map((d: any) => [Number(d.hour), Number(d.count)]))
    const fullDistribution: HourlyDistribution[] = []

    for (let hour = 0; hour < 24; hour++) {
      const count = hourMap.get(hour) || 0
      fullDistribution.push({
        hour,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      })
    }

    return fullDistribution
  }

  /**
   * Get monthly growth
   */
  private async getMonthlyGrowth(companyId: string): Promise<MonthlyGrowth> {
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    const [currentMonth, previousMonth] = await Promise.all([
      prisma.compliment.aggregate({
        where: {
          companyId,
          createdAt: {
            gte: currentMonthStart,
            lte: currentMonthEnd
          }
        },
        _count: true,
        _sum: { coins: true }
      }),
      prisma.compliment.aggregate({
        where: {
          companyId,
          createdAt: {
            gte: previousMonthStart,
            lte: previousMonthEnd
          }
        },
        _count: true,
        _sum: { coins: true }
      })
    ])

    const currentCount = currentMonth._count
    const previousCount = previousMonth._count
    const growthRate = previousCount === 0
      ? (currentCount > 0 ? 100 : 0)
      : ((currentCount - previousCount) / previousCount) * 100

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]

    return {
      currentMonth: {
        month: monthNames[now.getMonth()],
        count: currentCount,
        coins: currentMonth._sum.coins || 0
      },
      previousMonth: {
        month: monthNames[now.getMonth() - 1] || monthNames[11],
        count: previousCount,
        coins: previousMonth._sum.coins || 0
      },
      growthRate: Math.round(growthRate * 100) / 100
    }
  }

  /**
   * Get recent activity
   */
  private async getRecentActivity(
    companyId: string,
    filters?: Omit<DashboardFilters, 'startDate' | 'endDate'>,
    limit: number = 20
  ): Promise<RecentCompliment[]> {
    const whereClause: Prisma.ComplimentWhereInput = {
      companyId
    }

    if (filters?.departmentId) {
      whereClause.OR = [
        { sender: { departmentId: filters.departmentId } },
        { receiver: { departmentId: filters.departmentId } }
      ]
    }

    const compliments = await prisma.compliment.findMany({
      where: whereClause,
      include: {
        sender: {
          include: {
            department: true
          }
        },
        receiver: {
          include: {
            department: true
          }
        },
        companyValue: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return compliments.map((c: any) => ({
      id: c.id,
      sender: {
        id: c.sender.id,
        name: c.sender.name,
        avatar: c.sender.avatar,
        department: c.sender.department?.name || null
      },
      receiver: {
        id: c.receiver.id,
        name: c.receiver.name,
        avatar: c.receiver.avatar,
        department: c.receiver.department?.name || null
      },
      companyValue: {
        id: c.companyValue.id,
        title: c.companyValue.title,
        iconName: c.companyValue.iconName,
        iconColor: c.companyValue.iconColor
      },
      coins: c.coins,
      message: c.message,
      createdAt: c.createdAt.toISOString(),
      timeAgo: this.getTimeAgo(c.createdAt)
    }))
  }

  /**
   * Get engagement metrics
   */
  private async getEngagementMetrics(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<EngagementMetrics> {
    // Get total users
    const totalUsers = await prisma.user.count({
      where: {
        companyId,
        isActive: true
      }
    })

    // Get users who sent compliments
    const activeSenders = await prisma.compliment.findMany({
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: { senderId: true },
      distinct: ['senderId']
    })

    const participationRate = totalUsers > 0
      ? (activeSenders.length / totalUsers) * 100
      : 0

    // Get total compliments for average calculation
    const totalCompliments = await prisma.compliment.count({
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const averageComplimentsPerUser = activeSenders.length > 0
      ? totalCompliments / activeSenders.length
      : 0

    // Get median coins per compliment
    const allCoins = await prisma.compliment.findMany({
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: { coins: true },
      orderBy: { coins: 'asc' }
    })

    const medianCoins = allCoins.length > 0
      ? allCoins[Math.floor(allCoins.length / 2)].coins
      : 0

    // Get inactive users (never sent a compliment)
    const inactiveUsers = await prisma.user.findMany({
      where: {
        companyId,
        isActive: true,
        complimentsSent: {
          none: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      },
      include: {
        department: true
      },
      take: 10
    })

    const inactiveList: InactiveUser[] = inactiveUsers.slice(0, 5).map((u: any) => ({
      userId: u.id,
      name: u.name,
      department: u.department?.name || null,
      lastActivity: null // Could be enhanced with last login data
    }))

    return {
      participationRate: Math.round(participationRate * 100) / 100,
      averageComplimentsPerUser: Math.round(averageComplimentsPerUser * 100) / 100,
      medianCoinsPerCompliment: medianCoins,
      inactiveUsers: {
        count: inactiveUsers.length,
        percentage: totalUsers > 0 ? (inactiveUsers.length / totalUsers) * 100 : 0,
        list: inactiveList
      }
    }
  }

  /**
   * Get company info
   */
  private async getCompanyInfo(companyId: string): Promise<{
    totalEmployees: number
    activeEmployees: number
    totalValues: number
    activeValues: number
  }> {
    const [totalEmployees, activeEmployees, totalValues, activeValues] = await Promise.all([
      prisma.user.count({
        where: { companyId }
      }),
      prisma.user.count({
        where: {
          companyId,
          isActive: true
        }
      }),
      prisma.companyValue.count({
        where: { companyId }
      }),
      prisma.companyValue.count({
        where: {
          companyId,
          isActive: true
        }
      })
    ])

    return {
      totalEmployees,
      activeEmployees,
      totalValues,
      activeValues
    }
  }

  /**
   * Generate insights based on dashboard data
   */
  private generateInsights(data: {
    overview: OverviewMetrics
    valuesDistribution: ValueDistribution[]
    departmentStats: DepartmentStat[]
    engagementMetrics: EngagementMetrics
  }): Insight[] {
    const insights: Insight[] = []

    // Low engagement warning
    if (data.engagementMetrics.participationRate < 30) {
      insights.push({
        type: 'warning',
        category: 'engagement',
        title: 'Baixo Engajamento Detectado',
        description: `Apenas ${Math.round(data.engagementMetrics.participationRate)}% dos colaboradores enviaram elogios neste período`,
        metric: data.engagementMetrics.participationRate,
        actionable: true,
        priority: 'high'
      })
    }

    // Success story - high engagement
    if (data.engagementMetrics.participationRate > 70) {
      insights.push({
        type: 'success',
        category: 'engagement',
        title: 'Excelente Engajamento!',
        description: `${Math.round(data.engagementMetrics.participationRate)}% dos colaboradores estão ativamente reconhecendo colegas`,
        metric: data.engagementMetrics.participationRate,
        actionable: false,
        priority: 'low'
      })
    }

    // Underutilized values
    const underutilizedValues = data.valuesDistribution.filter(v => v.percentage < 10)
    if (underutilizedValues.length > 0) {
      insights.push({
        type: 'info',
        category: 'values',
        title: 'Valores Subutilizados',
        description: `${underutilizedValues.length} valor(es) representam menos de 10% dos elogios. Considere promover: ${underutilizedValues.map(v => v.valueName).join(', ')}`,
        metric: underutilizedValues.length,
        actionable: true,
        priority: 'medium'
      })
    }

    // Department silos
    const lowEngagementDepts = data.departmentStats.filter(d => d.engagementRate < 20 && d.totalUsers > 5)
    if (lowEngagementDepts.length > 0) {
      insights.push({
        type: 'warning',
        category: 'departments',
        title: 'Departamentos com Baixa Participação',
        description: `${lowEngagementDepts.map(d => d.departmentName).join(', ')} têm menos de 20% de participação`,
        metric: lowEngagementDepts.length,
        actionable: true,
        priority: 'high'
      })
    }

    // Growth trend
    if (data.overview.comparison.complimentsChange > 20) {
      insights.push({
        type: 'success',
        category: 'engagement',
        title: 'Crescimento Positivo',
        description: `Elogios aumentaram ${data.overview.comparison.complimentsChangeLabel} em relação ao período anterior`,
        metric: data.overview.comparison.complimentsChange,
        actionable: false,
        priority: 'low'
      })
    } else if (data.overview.comparison.complimentsChange < -20) {
      insights.push({
        type: 'warning',
        category: 'engagement',
        title: 'Queda no Engajamento',
        description: `Elogios diminuíram ${Math.abs(data.overview.comparison.complimentsChange)}% em relação ao período anterior`,
        metric: data.overview.comparison.complimentsChange,
        actionable: true,
        priority: 'high'
      })
    }

    // Inactive users alert
    if (data.engagementMetrics.inactiveUsers.percentage > 40) {
      insights.push({
        type: 'warning',
        category: 'users',
        title: 'Alta Taxa de Inativos',
        description: `${data.engagementMetrics.inactiveUsers.count} colaboradores (${Math.round(data.engagementMetrics.inactiveUsers.percentage)}%) nunca enviaram elogios`,
        metric: data.engagementMetrics.inactiveUsers.percentage,
        actionable: true,
        priority: 'high'
      })
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

    return insights
  }

  /**
   * Calculate relative time
   */
  private getTimeAgo(date: Date): string {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `há ${days} dia${days > 1 ? 's' : ''}`
    if (hours > 0) return `há ${hours} hora${hours > 1 ? 's' : ''}`
    if (minutes > 0) return `há ${minutes} minuto${minutes > 1 ? 's' : ''}`
    return 'agora mesmo'
  }

  /**
   * Get network graph data for visualization
   *
   * Returns nodes (users) and links (compliment relationships)
   * formatted for graph visualization.
   */
  async getNetworkGraph(
    companyId: string,
    filters: {
      startDate?: Date
      endDate?: Date
      department?: string
      minConnections?: number
      limit?: number
      userIds?: string[]
    }
  ) {
    const now = new Date()

    // Default dates: last 30 days
    const endDate =
      filters.endDate || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    const startDate =
      filters.startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

    const minConnections = filters.minConnections || 1
    const limit = Math.min(filters.limit || 50, 100) // Max 100 nodes

    // Import model functions
    const { getNetworkNodes, getNetworkLinks, getConnectedUserIds } = await import(
      './compliments-dashboard.model'
    )

    let nodes: any[]

    // If filtering by specific users, get their full network
    if (filters.userIds && filters.userIds.length > 0) {
      // First, get all users connected to the filtered users
      const connectedUserIds = await getConnectedUserIds(
        companyId,
        filters.userIds,
        startDate,
        endDate
      )

      // Then get nodes for all these users (filtered + connected)
      const allUserIds = [...new Set([...filters.userIds, ...connectedUserIds])]

      nodes = await getNetworkNodes(
        companyId,
        startDate,
        endDate,
        filters.department,
        minConnections,
        limit,
        allUserIds
      )
    } else {
      // Normal flow: get nodes based on other filters
      nodes = await getNetworkNodes(
        companyId,
        startDate,
        endDate,
        filters.department,
        minConnections,
        limit
      )
    }

    // If no nodes, return empty graph
    if (nodes.length === 0) {
      return { nodes: [], links: [] }
    }

    // Get links for these users
    const userIds = nodes.map((n) => n.id)
    const links = await getNetworkLinks(companyId, userIds, startDate, endDate)

    return { nodes, links }
  }
}

export const complimentsDashboardService = new ComplimentsDashboardService()