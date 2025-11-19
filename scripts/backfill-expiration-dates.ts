/**
 * @fileoverview Backfill script to add expiration dates to existing CREDIT REDEEMABLE transactions
 *
 * This script should be run ONCE before activating the coin expiration cron job.
 * It calculates expiresAt dates for all existing CREDIT REDEEMABLE transactions
 * based on their createdAt date + 18 months.
 *
 * Usage:
 *   npx tsx scripts/backfill-expiration-dates.ts [--dry-run]
 *
 * Options:
 *   --dry-run    Simulate the backfill without updating the database
 *
 * @module scripts/backfill-expiration-dates
 */

import { prisma } from '../src/lib/database'
import { logger } from '../src/lib/logger'
import { calculateCoinExpirationDate } from '../src/features/app/wallets/wallet.model'

interface BackfillStats {
  totalTransactions: number
  updated: number
  skipped: number
  errors: number
}

async function backfillExpirationDates(dryRun = false): Promise<BackfillStats> {
  logger.info('Starting backfill of expiration dates', { dryRun })

  const stats: BackfillStats = {
    totalTransactions: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  }

  try {
    // Find all CREDIT REDEEMABLE transactions that don't have expiresAt set yet
    const transactions = await prisma.walletTransaction.findMany({
      where: {
        transactionType: 'CREDIT',
        balanceType: 'REDEEMABLE',
        expiresAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    stats.totalTransactions = transactions.length

    if (transactions.length === 0) {
      logger.info('No transactions to backfill')
      return stats
    }

    logger.info(`Found ${transactions.length} transactions to backfill`)

    if (dryRun) {
      // Dry run: just log what would be updated
      for (const tx of transactions) {
        const expiresAt = calculateCoinExpirationDate(tx.createdAt)
        const isAlreadyExpired = expiresAt < new Date()

        logger.info('Would update transaction', {
          id: tx.id,
          userId: tx.userId,
          amount: tx.amount,
          createdAt: tx.createdAt,
          expiresAt,
          isAlreadyExpired,
        })

        stats.updated++
      }

      logger.info('Dry run completed', stats)
      return stats
    }

    // Real execution: update in batches of 100
    const batchSize = 100
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize)

      try {
        await prisma.$transaction(
          batch.map(tx => {
            const expiresAt = calculateCoinExpirationDate(tx.createdAt)

            return prisma.walletTransaction.update({
              where: { id: tx.id },
              data: {
                expiresAt,
                isExpired: false, // Ensure it's marked as not expired
              },
            })
          }),
        )

        stats.updated += batch.length

        logger.info('Processed batch', {
          batchNumber: Math.floor(i / batchSize) + 1,
          processed: stats.updated,
          total: stats.totalTransactions,
          progress: `${((stats.updated / stats.totalTransactions) * 100).toFixed(1)}%`,
        })
      } catch (error) {
        logger.error('Error processing batch', {
          batchNumber: Math.floor(i / batchSize) + 1,
          error,
        })
        stats.errors += batch.length
      }
    }

    logger.info('Backfill completed successfully', stats)

    // Additional info: how many are already expired
    const alreadyExpiredCount = await prisma.walletTransaction.count({
      where: {
        transactionType: 'CREDIT',
        balanceType: 'REDEEMABLE',
        expiresAt: {
          lt: new Date(),
        },
        isExpired: false,
      },
    })

    if (alreadyExpiredCount > 0) {
      logger.warn(
        `Found ${alreadyExpiredCount} transactions that are already expired but not marked as such.`,
        {
          recommendation: 'Run the manual coin expiration process to clean these up.',
        },
      )
    }

    return stats
  } catch (error) {
    logger.error('Fatal error during backfill', { error })
    throw error
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')

  console.log('═══════════════════════════════════════════════════════════')
  console.log('  Backfill Expiration Dates for Wallet Transactions')
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`  Mode: ${dryRun ? 'DRY RUN (no changes)' : 'PRODUCTION (will update database)'}`)
  console.log('═══════════════════════════════════════════════════════════\n')

  if (!dryRun) {
    console.log('⚠️  WARNING: This will update the database!')
    console.log('⚠️  Press Ctrl+C within 5 seconds to cancel...\n')
    await new Promise(resolve => setTimeout(resolve, 5000))
  }

  try {
    const stats = await backfillExpirationDates(dryRun)

    console.log('\n═══════════════════════════════════════════════════════════')
    console.log('  Backfill Results')
    console.log('═══════════════════════════════════════════════════════════')
    console.log(`  Total transactions found: ${stats.totalTransactions}`)
    console.log(`  Updated: ${stats.updated}`)
    console.log(`  Skipped: ${stats.skipped}`)
    console.log(`  Errors: ${stats.errors}`)
    console.log('═══════════════════════════════════════════════════════════\n')

    if (dryRun) {
      console.log('✅ Dry run completed successfully!')
      console.log('💡 Run without --dry-run to apply changes.')
    } else {
      console.log('✅ Backfill completed successfully!')
      console.log('💡 Next steps:')
      console.log('   1. Review the logs above')
      console.log('   2. Check if any transactions are already expired')
      console.log('   3. Run manual coin expiration if needed')
      console.log('   4. Activate the cron job for automatic expiration')
    }

    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Backfill failed:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

main()
