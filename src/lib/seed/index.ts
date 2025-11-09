/**
 * Main seed orchestrator
 * Coordinates all seeders in the correct order with progress tracking and validation
 */

import { PrismaClient } from '@prisma/client'
import { logger } from '../logger'
import { progressReporter } from './utils/progress-reporter'
import { DatabaseCleaner } from './utils/clear-database'
import { SeedVerifier } from './utils/verify-seed'
import { SeedValidator } from './validators/seed-validator'
import { CompanySeeder } from './seeders/company.seeder'
import { PermissionSeeder } from './seeders/permission.seeder'
import { RoleSeeder } from './seeders/role.seeder'
import { DepartmentSeeder } from './seeders/department.seeder'
import { JobTitleSeeder } from './seeders/jobTitle.seeder'
import { UserSeeder } from './seeders/user.seeder'
import { WalletSeeder } from './seeders/wallet.seeder'
import { ValueSeeder } from './seeders/value.seeder'
import { ContactSeeder } from './seeders/contact.seeder'
import { ComplimentSeeder } from './seeders/compliment.seeder'
import { TransactionSeeder } from './seeders/transaction.seeder'
import { PrizeSeeder } from './seeders/prize.seeder'
import { RedemptionSeeder } from './seeders/redemption.seeder'
import { CompanyWalletSeeder } from './seeders/company-wallet.seeder'
import { WalletDepositSeeder } from './seeders/wallet-deposit.seeder'
import { BalanceAdjusterSeeder } from './seeders/balance-adjuster.seeder'

const prisma = new PrismaClient()

interface SeederStep {
  name: string
  run: () => Promise<void>
}

/**
 * Main seeding function
 * Executes all seeders in the correct order with progress tracking
 */
export async function seed(validateAfter: boolean = true): Promise<void> {
  const startTime = Date.now()

  try {
    progressReporter.printHeader('🌱 STARTING DATABASE SEEDING')

    // Step 1: Clear existing data
    progressReporter.printInfo('Clearing existing data...')
    const cleaner = new DatabaseCleaner(prisma)
    await cleaner.clear()
    progressReporter.printSuccess('Database cleared')

    // Step 2: Define and execute seeders in dependency order
    const seeders: SeederStep[] = [
      { name: 'Companies', run: () => new CompanySeeder(prisma).seed() },
      { name: 'Permissions', run: () => new PermissionSeeder(prisma).seed() },
      { name: 'Roles', run: () => new RoleSeeder(prisma).seed() },
      { name: 'Departments', run: () => new DepartmentSeeder(prisma).seed() },
      { name: 'Job Titles', run: () => new JobTitleSeeder(prisma).seed() },
      { name: 'Users', run: () => new UserSeeder(prisma).seed() },
      { name: 'Wallets', run: () => new WalletSeeder(prisma).seed() },
      { name: 'Company Wallets', run: () => new CompanyWalletSeeder(prisma).seed() },
      { name: 'Wallet Deposits', run: () => new WalletDepositSeeder(prisma).seed() },
      { name: 'Company Values', run: () => new ValueSeeder(prisma).seed() },
      { name: 'Contacts', run: () => new ContactSeeder(prisma).seed() },
      { name: 'Prizes', run: () => new PrizeSeeder(prisma).seed() },
      { name: 'Compliments', run: () => new ComplimentSeeder(prisma).seed() },
      { name: 'Transactions', run: () => new TransactionSeeder(prisma).seed() },
      { name: 'Redemptions', run: () => new RedemptionSeeder(prisma).seed() },
      { name: 'Balance Adjustments', run: () => new BalanceAdjusterSeeder(prisma).seed() },
    ]

    progressReporter.printInfo(`\nRunning ${seeders.length} seeders in dependency order...\n`)

    for (const seeder of seeders) {
      const seederStartTime = Date.now()
      try {
        await seeder.run()
        const elapsedMs = Date.now() - seederStartTime
        progressReporter.printCompleted(seeder.name, 1, elapsedMs)
      } catch (error) {
        progressReporter.printError(`${seeder.name} failed: ${error instanceof Error ? error.message : String(error)}`)
        throw error
      }
    }

    // Step 3: Legacy verification
    progressReporter.printHeader('Running Legacy Verification')
    const verifier = new SeedVerifier(prisma)
    await verifier.verify()

    // Step 4: Comprehensive validation (if enabled)
    if (validateAfter) {
      progressReporter.printHeader('🔍 RUNNING COMPREHENSIVE VALIDATION')
      const validator = new SeedValidator(prisma)
      const validationResult = await validator.validate()
      validator.printReport(validationResult)

      if (!validationResult.isValid) {
        progressReporter.printError('Validation failed - data has errors')
        process.exit(1)
      }
    }

    // Final summary
    const totalElapsedMs = Date.now() - startTime
    const totalSeconds = Math.floor(totalElapsedMs / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    progressReporter.printSummary('🎉 SEEDING COMPLETED SUCCESSFULLY', {
      'Total Seeders': seeders.length,
      'Total Time': `${minutes}m ${seconds}s`,
      'Status': '✅ All data seeded and validated',
    })
  } catch (error) {
    progressReporter.printError(`Fatal error: ${error instanceof Error ? error.message : String(error)}`)
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
