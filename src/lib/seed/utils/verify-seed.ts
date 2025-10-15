/**
 * Verification utility for seeded data
 */

import { PrismaClient } from '@prisma/client'
import { logger } from '../../logger'

export class SeedVerifier {
  constructor(private prisma: PrismaClient) {}

  async verify(): Promise<void> {
    logger.info('🔍 Verifying seeded data...')
    
    const counts = {
      companies: await this.prisma.company.count(),
      companiesBrazil: await this.prisma.companyBrazil.count(),
      companyContacts: await this.prisma.companyContact.count(),
      permissions: await this.prisma.permission.count(),
      roles: await this.prisma.role.count(),
      users: await this.prisma.user.count(),
      userRoles: await this.prisma.userRole.count(),
      rolePermissions: await this.prisma.rolePermission.count(),
      wallets: await this.prisma.wallet.count(),
      compliments: await this.prisma.compliment.count(),
      companyValues: await this.prisma.companyValue.count(),
      companySettings: await this.prisma.companySettings.count(),
      walletTransactions: await this.prisma.walletTransaction.count(),
      prizes: await this.prisma.prize.count(),
      prizeVariants: await this.prisma.prizeVariant.count(),
      addresses: await this.prisma.address.count(),
      redemptions: await this.prisma.redemption.count(),
      redemptionTrackings: await this.prisma.redemptionTracking.count(),
    }
    
    logger.info('📊 Database summary:', counts)
    
    await this.showCompanySummary()
    await this.showRolePermissionMapping()
    await this.showUserRoleMapping()
    await this.showTransactionSummary()
    await this.showPrizeSummary()
    await this.showRedemptionSummary()
  }

  private async showCompanySummary(): Promise<void> {
    const companies = await this.prisma.company.findMany({
      include: {
        companyBrazil: true,
        _count: {
          select: {
            users: true,
            roles: true,
            contacts: true,
          },
        },
      },
    })
    
    logger.info('🏢 Companies summary:')
    for (const company of companies) {
      const brazilInfo = company.companyBrazil ? ` (CNPJ: ${company.companyBrazil.cnpj})` : ''
      logger.info(`  ${company.name} (${company.country})${brazilInfo}: ${company._count.users} users, ${company._count.roles} roles, ${company._count.contacts} contacts`)
    }
  }

  private async showRolePermissionMapping(): Promise<void> {
    const rolesWithPermissions = await this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })
    
    logger.info('🔗 Role-Permission mapping:')
    for (const role of rolesWithPermissions) {
      logger.info(`  ${role.name}: ${role.permissions.length} permissions`)
    }
  }

  private async showUserRoleMapping(): Promise<void> {
    const usersWithRoles = await this.prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })
    
    logger.info('👥 User-Role mapping:')
    for (const user of usersWithRoles) {
      const roleNames = user.roles.map(ur => ur.role.name).join(', ')
      logger.info(`  ${user.name} (${user.email}): ${roleNames}`)
    }
  }

  private async showTransactionSummary(): Promise<void> {
    const transactionStats = await this.prisma.walletTransaction.groupBy({
      by: ['transactionType', 'balanceType'],
      _count: true,
      _sum: {
        amount: true,
      },
    })
    
    logger.info('💰 Transaction summary:')
    for (const stat of transactionStats) {
      logger.info(`  ${stat.transactionType} - ${stat.balanceType}: ${stat._count} transactions, ${stat._sum.amount ?? 0} total coins`)
    }
    
    const usersWithTransactions = await this.prisma.user.findMany({
      include: {
        _count: {
          select: {
            walletTransactions: true,
          },
        },
      },
      where: {
        walletTransactions: {
          some: {},
        },
      },
      orderBy: {
        walletTransactions: {
          _count: 'desc',
        },
      },
      take: 5,
    })
    
    if (usersWithTransactions.length > 0) {
      logger.info('  Top users by transaction count:')
      for (const user of usersWithTransactions) {
        logger.info(`    ${user.name}: ${user._count.walletTransactions} transactions`)
      }
    }
  }

  private async showPrizeSummary(): Promise<void> {
    const prizeStats = await this.prisma.prize.groupBy({
      by: ['category'],
      _count: true,
      _sum: {
        stock: true,
      },
    })
    
    logger.info('🎁 Prize summary:')
    for (const stat of prizeStats) {
      logger.info(`  ${stat.category}: ${stat._count} prizes, ${stat._sum.stock ?? 0} total stock`)
    }
    
    const globalPrizes = await this.prisma.prize.count({
      where: { companyId: null },
    })
    
    const companyPrizes = await this.prisma.prize.count({
      where: { companyId: { not: null } },
    })
    
    logger.info(`  Global prizes: ${globalPrizes}`)
    logger.info(`  Company-specific prizes: ${companyPrizes}`)
    
    const totalVariants = await this.prisma.prizeVariant.count()
    logger.info(`  Total prize variants: ${totalVariants}`)
  }

  private async showRedemptionSummary(): Promise<void> {
    const redemptionStats = await this.prisma.redemption.groupBy({
      by: ['status'],
      _count: true,
      _sum: {
        coinsSpent: true,
      },
    })
    
    logger.info('🎉 Redemption summary:')
    for (const stat of redemptionStats) {
      logger.info(`  ${stat.status}: ${stat._count} redemptions, ${stat._sum.coinsSpent ?? 0} total coins spent`)
    }
    
    const totalTrackingEntries = await this.prisma.redemptionTracking.count()
    logger.info(`  Total tracking entries: ${totalTrackingEntries}`)
    
    const usersWithRedemptions = await this.prisma.user.findMany({
      include: {
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
      where: {
        redemptions: {
          some: {},
        },
      },
      orderBy: {
        redemptions: {
          _count: 'desc',
        },
      },
      take: 5,
    })
    
    if (usersWithRedemptions.length > 0) {
      logger.info('  Top users by redemption count:')
      for (const user of usersWithRedemptions) {
        logger.info(`    ${user.name}: ${user._count.redemptions} redemptions`)
      }
    }
  }
}
