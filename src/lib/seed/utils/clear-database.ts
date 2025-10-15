/**
 * Database cleanup utility for seeding
 */

import { PrismaClient } from '@prisma/client'
import { logger } from '../../logger'

export class DatabaseCleaner {
  constructor(private prisma: PrismaClient) {}

  async clear(): Promise<void> {
    logger.info('🧹 Clearing existing data...')
    
    // Delete in correct order to respect foreign key constraints
    await this.prisma.companyContact.deleteMany()
    await this.prisma.userRole.deleteMany()
    await this.prisma.rolePermission.deleteMany()
    await this.prisma.compliment.deleteMany()
    await this.prisma.wallet.deleteMany()
    await this.prisma.companyValue.deleteMany()
    await this.prisma.companySettings.deleteMany()
    await this.prisma.user.deleteMany()
    await this.prisma.role.deleteMany()
    await this.prisma.permission.deleteMany()
    await this.prisma.companyBrazil.deleteMany()
    await this.prisma.company.deleteMany()
    
    logger.info('✅ Database cleared')
  }
}
