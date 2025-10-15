/**
 * Main seed orchestrator
 * Coordinates all seeders in the correct order
 */

import { PrismaClient } from '@prisma/client'
import { logger } from '../logger'
import { DatabaseCleaner } from './utils/clear-database'
import { SeedVerifier } from './utils/verify-seed'
import { CompanySeeder } from './seeders/company.seeder'
import { PermissionSeeder } from './seeders/permission.seeder'
import { RoleSeeder } from './seeders/role.seeder'
import { UserSeeder } from './seeders/user.seeder'
import { WalletSeeder } from './seeders/wallet.seeder'
import { ValueSeeder } from './seeders/value.seeder'
import { ContactSeeder } from './seeders/contact.seeder'
import { ComplimentSeeder } from './seeders/compliment.seeder'

const prisma = new PrismaClient()

/**
 * Main seeding function
 * Executes all seeders in the correct order
 */
export async function seed(): Promise<void> {
  try {
    logger.info('🌱 Starting database seeding...')
    
    // Step 1: Clear existing data
    const cleaner = new DatabaseCleaner(prisma)
    await cleaner.clear()
    
    // Step 2: Seed in dependency order
    await new CompanySeeder(prisma).seed()
    await new PermissionSeeder(prisma).seed()
    await new RoleSeeder(prisma).seed()
    await new UserSeeder(prisma).seed()
    await new WalletSeeder(prisma).seed()
    await new ValueSeeder(prisma).seed()
    await new ContactSeeder(prisma).seed()
    await new ComplimentSeeder(prisma).seed()
    
    // Step 3: Verify seeded data
    const verifier = new SeedVerifier(prisma)
    await verifier.verify()
    
    logger.info('🎉 Database seeding completed successfully!')
  } catch (error) {
    logger.error('❌ Error during seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Execute if run directly
 */
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('Fatal error:', error)
      process.exit(1)
    })
}
