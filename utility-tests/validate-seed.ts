/**
 * Seed Data Validation Script
 * Run after seeding: npx tsx utility-tests/validate-seed.ts
 *
 * Validates:
 * - Data completeness (user count, compliment count)
 * - Pareto distribution accuracy
 * - Balance consistency
 * - Temporal distribution patterns
 * - Data integrity
 */

import { PrismaClient } from '@prisma/client'
import { SeedValidator } from '../src/lib/seed/validators/seed-validator'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Initializing seed data validator...\n')

    const validator = new SeedValidator(prisma)
    const result = await validator.validate()

    // Print formatted report
    validator.printReport(result)

    // Exit with appropriate code
    process.exit(result.isValid ? 0 : 1)
  } catch (error) {
    console.error('❌ Validation failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
