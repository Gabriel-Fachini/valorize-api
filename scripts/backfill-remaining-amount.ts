/**
 * Backfill script for remainingAmount field in WalletTransaction
 *
 * This script calculates the remainingAmount for all existing CREDIT REDEEMABLE transactions
 * by simulating FIFO consumption retroactively.
 *
 * Run with: npx tsx scripts/backfill-remaining-amount.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface CreditTransaction {
  id: string
  userId: string
  amount: number
  remainingAmount: number
  createdAt: Date
  isExpired: boolean
}

interface DebitTransaction {
  id: string
  userId: string
  amount: number
  createdAt: Date
}

async function backfillRemainingAmount() {
  console.log('🚀 Starting remainingAmount backfill...\n')

  try {
    // Get all users who have wallet transactions
    const usersWithTransactions = await prisma.walletTransaction.findMany({
      where: {
        balanceType: 'REDEEMABLE',
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    })

    console.log(`📊 Found ${usersWithTransactions.length} users with redeemable transactions\n`)

    let totalUsersProcessed = 0
    let totalCreditsUpdated = 0

    for (const { userId } of usersWithTransactions) {
      console.log(`\n👤 Processing user: ${userId}`)

      // Get all CREDIT transactions for this user (ordered by creation date - FIFO)
      const credits = await prisma.walletTransaction.findMany({
        where: {
          userId,
          transactionType: 'CREDIT',
          balanceType: 'REDEEMABLE',
        },
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          id: true,
          userId: true,
          amount: true,
          remainingAmount: true,
          createdAt: true,
          isExpired: true,
        },
      })

      // Get all DEBIT transactions for this user (ordered by creation date)
      const debits = await prisma.walletTransaction.findMany({
        where: {
          userId,
          transactionType: 'DEBIT',
          balanceType: 'REDEEMABLE',
        },
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          id: true,
          userId: true,
          amount: true,
          createdAt: true,
        },
      })

      console.log(`  📥 Credits: ${credits.length}`)
      console.log(`  📤 Debits: ${debits.length}`)

      // Initialize remainingAmount for all credits with their full amount
      const creditBalances: Map<string, CreditTransaction> = new Map()
      for (const credit of credits) {
        creditBalances.set(credit.id, {
          ...credit,
          remainingAmount: credit.amount, // Start with full amount
        })
      }

      // Simulate FIFO consumption by processing debits chronologically
      for (const debit of debits) {
        let remainingToDebit = debit.amount

        // Find credits created before or at the same time as this debit
        const availableCredits = Array.from(creditBalances.values())
          .filter(c => c.createdAt <= debit.createdAt && c.remainingAmount > 0)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) // FIFO

        for (const credit of availableCredits) {
          if (remainingToDebit <= 0) break

          const toConsume = Math.min(credit.remainingAmount, remainingToDebit)
          credit.remainingAmount -= toConsume
          remainingToDebit -= toConsume

          creditBalances.set(credit.id, credit)
        }

        if (remainingToDebit > 0) {
          console.warn(`  ⚠️  Warning: Debit ${debit.id} couldn't be fully consumed. Missing ${remainingToDebit} coins.`)
        }
      }

      // Update database with calculated remainingAmount
      let creditsUpdatedForUser = 0
      for (const [creditId, credit] of creditBalances.entries()) {
        // If credit is expired, remainingAmount should be 0
        const finalRemainingAmount = credit.isExpired ? 0 : credit.remainingAmount

        await prisma.walletTransaction.update({
          where: { id: creditId },
          data: { remainingAmount: finalRemainingAmount },
        })

        creditsUpdatedForUser++
      }

      totalCreditsUpdated += creditsUpdatedForUser
      totalUsersProcessed++
      console.log(`  ✅ Updated ${creditsUpdatedForUser} credits for this user`)
    }

    console.log('\n\n✨ Backfill completed successfully!')
    console.log(`📊 Summary:`)
    console.log(`   - Users processed: ${totalUsersProcessed}`)
    console.log(`   - Credits updated: ${totalCreditsUpdated}`)

  } catch (error) {
    console.error('\n❌ Error during backfill:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
backfillRemainingAmount()
  .then(() => {
    console.log('\n🎉 Script finished successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error)
    process.exit(1)
  })
