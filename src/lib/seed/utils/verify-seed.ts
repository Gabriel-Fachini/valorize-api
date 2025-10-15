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
    }
    
    logger.info('📊 Database summary:', counts)
    
    await this.showCompanySummary()
    await this.showRolePermissionMapping()
    await this.showUserRoleMapping()
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
}
