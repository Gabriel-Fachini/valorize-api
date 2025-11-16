import prisma from '@/lib/database'
import type { Prisma, PlanType } from '@prisma/client'
import type {
  CompanyFilters,
  PaginationParams,
  SortingParams,
  CompanyListItem,
} from './companies.types'

/**
 * Backoffice Company Model
 * Cross-company queries for Super Admins (no multi-tenant isolation)
 */
export class BackofficeCompany {
  /**
   * Find companies with filters, pagination and sorting
   */
  static async findWithFilters(
    filters: CompanyFilters,
    pagination: PaginationParams,
    sorting: SortingParams
  ): Promise<{ companies: CompanyListItem[]; total: number }> {
    const { search, status, planType, country, createdAfter, createdBefore } =
      filters
    const { page, limit } = pagination
    const { sortBy, sortOrder } = sorting

    // Build where clause
    const where: Prisma.CompanyWhereInput = {}

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    if (country) {
      where.country = country
    }

    if (createdAfter || createdBefore) {
      where.createdAt = {}
      if (createdAfter) {
        where.createdAt.gte = createdAfter
      }
      if (createdBefore) {
        where.createdAt.lte = createdBefore
      }
    }

    // Search in name, domain, or CNPJ
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } },
        {
          companyBrazil: {
            cnpj: { contains: search, mode: 'insensitive' },
          },
        },
      ]
    }

    // Filter by plan type
    if (planType) {
      where.plan = {
        planType,
        isActive: true,
      }
    }

    // Build orderBy clause
    const orderBy: Prisma.CompanyOrderByWithRelationInput = {}

    if (sortBy === 'name') {
      orderBy.name = sortOrder
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder
    } else if (sortBy === 'updatedAt') {
      orderBy.updatedAt = sortOrder
    }
    // Note: MRR sorting requires more complex logic (see findWithMRR method)

    // Execute query
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: {
          plan: {
            where: { isActive: true },
          },
          users: {
            select: {
              id: true,
              isActive: true,
            },
          },
          companyBrazil: {
            select: {
              cnpj: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.company.count({ where }),
    ])

    // Transform to CompanyListItem
    const companyListItems: CompanyListItem[] = companies.map((company) => {
      const totalUsers = company.users.length
      const activeUsers = company.users.filter((u) => u.isActive).length
      const pricePerUser = company.plan?.pricePerUser
        ? Number(company.plan.pricePerUser)
        : 0
      const currentMRR = activeUsers * pricePerUser

      return {
        id: company.id,
        name: company.name,
        domain: company.domain,
        country: company.country,
        logoUrl: company.logoUrl,
        planType: company.plan?.planType || null,
        isActive: company.isActive,
        totalUsers,
        activeUsers,
        currentMRR,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      }
    })

    return {
      companies: companyListItems,
      total,
    }
  }

  /**
   * Count companies by status
   */
  static async countByStatus(): Promise<{
    active: number
    inactive: number
  }> {
    const [active, inactive] = await Promise.all([
      prisma.company.count({ where: { isActive: true } }),
      prisma.company.count({ where: { isActive: false } }),
    ])

    return { active, inactive }
  }

  /**
   * Calculate total MRR across all companies
   */
  static async calculateTotalMRR(): Promise<number> {
    const companies = await prisma.company.findMany({
      where: {
        isActive: true,
      },
      include: {
        plan: {
          where: { isActive: true },
        },
        users: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    })

    let totalMRR = 0

    for (const company of companies) {
      if (company.plan) {
        const activeUsers = company.users.length
        const pricePerUser = Number(company.plan.pricePerUser)
        totalMRR += activeUsers * pricePerUser
      }
    }

    return totalMRR
  }

  /**
   * Find company by ID with full details (cross-company)
   */
  static async findByIdWithDetails(id: string) {
    return prisma.company.findUnique({
      where: { id },
      include: {
        companyBrazil: true,
        contacts: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        settings: true,
        wallet: true,
        plan: {
          where: { isActive: true },
        },
        allowedDomains: true,
        values: {
          where: { isActive: true },
        },
        users: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
    })
  }

  /**
   * Check if domain is already in use
   */
  static async isDomainTaken(domain: string, excludeCompanyId?: string): Promise<boolean> {
    const where: Prisma.CompanyWhereInput = { domain }

    if (excludeCompanyId) {
      where.id = { not: excludeCompanyId }
    }

    const count = await prisma.company.count({ where })
    return count > 0
  }

  /**
   * Check if CNPJ is already in use (Brazil only)
   */
  static async isCNPJTaken(cnpj: string, excludeCompanyId?: string): Promise<boolean> {
    const where: Prisma.CompanyBrazilWhereInput = { cnpj }

    if (excludeCompanyId) {
      where.company = { id: { not: excludeCompanyId } }
    }

    const count = await prisma.companyBrazil.count({ where })
    return count > 0
  }

  /**
   * Get company wallet status with metrics
   */
  static async getWalletStatus(companyId: string) {
    const wallet = await prisma.companyWallet.findUnique({
      where: { companyId },
      include: {
        deposits: {
          orderBy: { depositedAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!wallet) return null

    // Calculate burn rate (last 30 days average)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const redemptions = await prisma.redemption.findMany({
      where: {
        companyId,
        redeemedAt: { gte: thirtyDaysAgo },
      },
      select: {
        coinsSpent: true,
        redeemedAt: true,
      },
    })

    const totalSpent30Days = redemptions.reduce(
      (sum, r) => sum + r.coinsSpent,
      0
    )
    const dailyBurnRate = totalSpent30Days / 30
    const monthlyBurnRate = dailyBurnRate * 30

    // Calculate coverage index (months of coverage)
    const balance = Number(wallet.balance)
    const coverageMonths =
      monthlyBurnRate > 0 ? balance / monthlyBurnRate : null

    // Calculate projected depletion date
    let projectedDepletion: Date | null = null
    if (coverageMonths && coverageMonths > 0) {
      projectedDepletion = new Date()
      projectedDepletion.setDate(
        projectedDepletion.getDate() + Math.floor(coverageMonths * 30)
      )
    }

    // Get redemption totals by type
    const totalRedemptions = await prisma.redemption.groupBy({
      by: ['status'],
      where: {
        companyId,
      },
      _count: true,
    })

    return {
      id: wallet.id,
      balance: Number(wallet.balance),
      totalDeposited: Number(wallet.totalDeposited),
      totalSpent: Number(wallet.totalSpent),
      overdraftLimit: Number(wallet.overdraftLimit),
      isFrozen: wallet.isFrozen,
      burnRate: monthlyBurnRate,
      coverageIndex: coverageMonths,
      totalRedemptions: {
        vouchers: totalRedemptions.find((r) => r.status === 'SENT')?._count || 0,
        products:
          totalRedemptions.find((r) => r.status === 'DELIVERED')?._count || 0,
      },
      projectedDepletion,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    }
  }

  /**
   * Get company metrics
   */
  static async getMetrics(companyId: string, startDate?: Date, endDate?: Date) {
    const [users, compliments, redemptions, values] = await Promise.all([
      // Users metrics
      prisma.user.groupBy({
        by: ['isActive'],
        where: { companyId },
        _count: true,
      }),

      // Compliments metrics
      prisma.compliment.aggregate({
        where: {
          companyId,
          ...(startDate && endDate
            ? { createdAt: { gte: startDate, lte: endDate } }
            : {}),
        },
        _count: true,
      }),

      // Redemptions metrics
      prisma.redemption.aggregate({
        where: { companyId },
        _count: true,
        _avg: { coinsSpent: true },
      }),

      // Company values
      prisma.companyValue.groupBy({
        by: ['isActive'],
        where: { companyId },
        _count: true,
      }),
    ])

    const totalUsers =
      users.reduce((sum, u) => sum + u._count, 0) || 0
    const activeUsers =
      users.find((u) => u.isActive)?._count || 0
    const inactiveUsers =
      users.find((u) => !u.isActive)?._count || 0

    const totalValues =
      values.reduce((sum, v) => sum + v._count, 0) || 0
    const activeValues =
      values.find((v) => v.isActive)?._count || 0

    // Calculate WAU (Weekly Active Users) - users who sent compliments in last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const weeklyActiveUsersCount = await prisma.user.count({
      where: {
        companyId,
        isActive: true,
        complimentsSent: {
          some: {
            createdAt: { gte: sevenDaysAgo },
          },
        },
      },
    })

    const WAUPercentage = activeUsers > 0 ? (weeklyActiveUsersCount / activeUsers) * 100 : 0

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
      },
      compliments: {
        sent: compliments._count || 0,
        received: compliments._count || 0,
      },
      engagement: {
        WAU: Math.round(WAUPercentage),
        complimentUsageRate: WAUPercentage,
      },
      redemptions: {
        total: redemptions._count || 0,
        vouchers: 0, // Could be calculated if needed
        products: 0, // Could be calculated if needed
        averageTicket: Number(redemptions._avg.coinsSpent) || 0,
      },
      values: {
        total: totalValues,
        active: activeValues,
      },
    }
  }

  /**
   * Get billing information
   */
  static async getBillingInfo(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        plan: {
          where: { isActive: true },
        },
        users: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    })

    if (!company) return null

    const activeUsers = company.users.length
    const pricePerUser = company.plan ? Number(company.plan.pricePerUser) : 0
    const currentMRR = activeUsers * pricePerUser

    return {
      currentMRR,
      activeUsers,
      planType: company.plan?.planType || null,
      pricePerUser,
      estimatedMonthlyAmount: currentMRR,
      nextBillingDate: null, // Could be calculated based on plan startDate
      billingEmail: company.billingEmail,
    }
  }
}
