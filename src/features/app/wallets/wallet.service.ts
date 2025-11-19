import { WalletModel } from './wallet.model'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/database'
import { WalletTransactionModel, TransactionType, BalanceType } from './wallet-transaction.model'
import { CoinExpirationModel } from './coin-expiration.model'

export const walletService = {
  async getUserBalance(userId: string) {
    logger.info(`Getting balance for user ${userId}`)
    const wallet = await WalletModel.getOrCreateByUserId(userId)
    logger.info(`Balance found for user ${userId}`)
    return {
      complimentBalance: wallet.complimentBalance,
      redeemableBalance: wallet.redeemableBalance,
    }
  },
}

export async function resetWeeklyBalances(adminUserId?: string) {
  logger.info('Starting manual weekly compliment balance reset')
  
  try {
    // Get all active companies with their settings
    const companies = await prisma.company.findMany({
      where: { isActive: true },
      include: {
        settings: true,
      },
    })

    let totalWalletsUpdated = 0
    let companiesProcessed = 0

    await prisma.$transaction(async (tx) => {
      for (const company of companies) {
        const weeklyLimit = company.settings?.weeklyRenewalAmount ?? 100
        
        // First, get all wallets that will be updated to record their previous balances
        const walletsToUpdate = await tx.wallet.findMany({
          where: {
            user: {
              companyId: company.id,
              isActive: true,
            },
          },
          include: {
            user: true,
          },
        })

        // Bulk update all wallets for this company
        const updateResult = await tx.wallet.updateMany({
          where: {
            user: {
              companyId: company.id,
              isActive: true,
            },
          },
          data: { complimentBalance: weeklyLimit },
        })

        // Record transactions for each wallet that was updated
        for (const wallet of walletsToUpdate) {
          const previousBalance = wallet.complimentBalance
          const amount = weeklyLimit - previousBalance

          // Only create transaction if there was actually a change
          if (amount !== 0) {
            await WalletTransactionModel.create({
              walletId: wallet.id,
              userId: wallet.userId,
              transactionType: TransactionType.RESET,
              balanceType: BalanceType.COMPLIMENT,
              amount,
              previousBalance,
              newBalance: weeklyLimit,
              reason: 'Weekly balance reset',
              metadata: {
                adminUserId,
                companyId: company.id,
                weeklyLimit,
              },
            }, tx)
          }
        }
        
        totalWalletsUpdated += updateResult.count
        companiesProcessed++
        logger.info(`Reset compliment balance for company ${company.id}: ${updateResult.count} wallets updated to ${weeklyLimit} coins`)
      }
    })

    logger.info(`Weekly compliment balance reset completed: ${companiesProcessed} companies, ${totalWalletsUpdated} wallets`)
    
    return {
      companiesProcessed,
      totalWalletsUpdated,
    }
  } catch (error) {
    logger.error('Error during weekly compliment balance reset:', error)
    throw error
  }
}

export async function resetWeeklyBalancesForCompany(companyId: string, adminUserId?: string) {
  logger.info(`Starting manual weekly compliment balance reset for company ${companyId}`)
  
  try {
    // Get the specific company with its settings
    const company = await prisma.company.findUnique({
      where: { 
        id: companyId,
        isActive: true,
      },
      include: {
        settings: true,
      },
    })

    if (!company) {
      throw new Error(`Company with ID ${companyId} not found or is inactive`)
    }

    const weeklyLimit = company.settings?.weeklyRenewalAmount ?? 100

    const result = await prisma.$transaction(async (tx) => {
      // First, get all wallets that will be updated to record their previous balances
      const walletsToUpdate = await tx.wallet.findMany({
        where: {
          user: {
            companyId: companyId,
            isActive: true,
          },
        },
        include: {
          user: true,
        },
      })

      // Bulk update all wallets for the company
      const updateResult = await tx.wallet.updateMany({
        where: {
          user: {
            companyId: companyId,
            isActive: true,
          },
        },
        data: { complimentBalance: weeklyLimit },
      })

      // Record transactions for each wallet that was updated
      for (const wallet of walletsToUpdate) {
        const previousBalance = wallet.complimentBalance
        const amount = weeklyLimit - previousBalance

        // Only create transaction if there was actually a change
        if (amount !== 0) {
          await WalletTransactionModel.create({
            walletId: wallet.id,
            userId: wallet.userId,
            transactionType: TransactionType.RESET,
            balanceType: BalanceType.COMPLIMENT,
            amount,
            previousBalance,
            newBalance: weeklyLimit,
            reason: 'Weekly balance reset for specific company',
            metadata: {
              adminUserId,
              companyId: company.id,
              weeklyLimit,
            },
          }, tx)
        }
      }

      logger.info(`Weekly compliment balance reset completed for company ${company.id}: ${updateResult.count} wallets updated to ${weeklyLimit} coins`)
      
      return {
        companyId: company.id,
        companyName: company.name,
        totalWalletsUpdated: updateResult.count,
        weeklyLimit,
      }
    })

    return result
  } catch (error) {
    logger.error(`Error during weekly compliment balance reset for company ${companyId}:`, error)
    throw error
  }
}

/**
 * Types for coin expiration functionality
 */
export interface ExpiringCoinBatch {
  transactionId: string
  amount: number
  expiresAt: Date
  daysUntilExpiration: number
  isUrgent: boolean // < 30 days
}

export interface ExpiringCoinsData {
  userId: string
  totalExpiringNext30Days: number
  totalExpiringNext90Days: number
  urgentExpiration: boolean
  batches: ExpiringCoinBatch[]
}

export interface ExpirationReport {
  usersAffected: number
  totalCoinsExpired: number
  expirationsByUser: Array<{
    userId: string
    userName: string
    coinsExpired: number
    transactions: number
  }>
  dryRun: boolean
}

/**
 * Expire coins that have reached their 18-month expiration date
 * @param dryRun - If true, simulates the expiration without actually updating the database
 * @returns Report of expired coins and affected users
 */
export async function expireCoins(dryRun = false): Promise<ExpirationReport> {
  logger.info('Starting coin expiration process', { dryRun })

  try {
    const now = new Date()

    // Find all CREDIT REDEEMABLE transactions that are expired and not yet marked as such
    // Only consider transactions that still have remaining coins (remainingAmount > 0)
    const expiredTransactions = await prisma.walletTransaction.findMany({
      where: {
        transactionType: TransactionType.CREDIT,
        balanceType: BalanceType.REDEEMABLE,
        isExpired: false,
        remainingAmount: {
          gt: 0, // Only expire credits that still have coins remaining
        },
        expiresAt: {
          lte: now,
        },
      },
      include: {
        wallet: true,
        user: true,
      },
      orderBy: {
        userId: 'asc',
      },
    })

    if (expiredTransactions.length === 0) {
      logger.info('No coins to expire')
      return {
        usersAffected: 0,
        totalCoinsExpired: 0,
        expirationsByUser: [],
        dryRun,
      }
    }

    // Group transactions by user
    const expirationsByUserId = new Map<string, typeof expiredTransactions>()
    for (const transaction of expiredTransactions) {
      const existing = expirationsByUserId.get(transaction.userId) ?? []
      expirationsByUserId.set(transaction.userId, [...existing, transaction])
    }

    const expirationsByUser: ExpirationReport['expirationsByUser'] = []
    let totalCoinsExpired = 0

    if (dryRun) {
      // Dry run: just calculate what would be expired
      for (const [userId, transactions] of expirationsByUserId.entries()) {
        // Use remainingAmount instead of amount (only expire what's left, not what was consumed)
        const userTotalExpired = transactions.reduce(
          (sum, tx) => sum + (tx.remainingAmount ?? 0),
          0,
        )
        totalCoinsExpired += userTotalExpired

        expirationsByUser.push({
          userId,
          userName: transactions[0].user.name,
          coinsExpired: userTotalExpired,
          transactions: transactions.length,
        })
      }

      logger.info('Dry run completed', {
        usersAffected: expirationsByUserId.size,
        totalCoinsExpired,
      })
    } else {
      // Real execution: process expirations in transaction
      await prisma.$transaction(async (tx) => {
        for (const [userId, transactions] of expirationsByUserId.entries()) {
          // Use remainingAmount instead of amount (only expire what's left, not what was consumed)
          const userTotalExpired = transactions.reduce(
            (sum, tx) => sum + (tx.remainingAmount ?? 0),
            0,
          )
          totalCoinsExpired += userTotalExpired

          // Get current wallet
          const currentWallet = await tx.wallet.findUnique({
            where: { userId },
          })

          if (!currentWallet) {
            logger.warn('Wallet not found for user during expiration', { userId })
            continue
          }

          const previousBalance = currentWallet.redeemableBalance
          const newBalance = Math.max(0, previousBalance - userTotalExpired) // Prevent negative

          // Update wallet balance
          await tx.wallet.update({
            where: { userId },
            data: { redeemableBalance: newBalance },
          })

          // Create EXPIRED transaction
          await tx.walletTransaction.create({
            data: {
              walletId: currentWallet.id,
              userId,
              transactionType: TransactionType.EXPIRED,
              balanceType: BalanceType.REDEEMABLE,
              amount: userTotalExpired,
              previousBalance,
              newBalance,
              reason: 'Coins expired after 18 months',
              metadata: {
                expiredTransactionIds: transactions.map(t => t.id),
                expirationDate: now.toISOString(),
              },
            },
          })

          // Mark original transactions as expired and set remainingAmount to 0
          await tx.walletTransaction.updateMany({
            where: {
              id: {
                in: transactions.map(t => t.id),
              },
            },
            data: {
              isExpired: true,
              expiredAt: now,
              remainingAmount: 0, // Set to 0 after expiration
            },
          })

          // Create CoinExpiration records for audit (using remainingAmount)
          for (const transaction of transactions) {
            await tx.coinExpiration.create({
              data: {
                userId,
                walletId: currentWallet.id,
                originalTransactionId: transaction.id,
                coinsExpired: transaction.remainingAmount ?? 0, // Use remaining, not original amount
                expirationDate: transaction.expiresAt!,
              },
            })
          }

          expirationsByUser.push({
            userId,
            userName: transactions[0].user.name,
            coinsExpired: userTotalExpired,
            transactions: transactions.length,
          })

          logger.info('Expired coins for user', {
            userId,
            userName: transactions[0].user.name,
            coinsExpired: userTotalExpired,
            transactions: transactions.length,
          })
        }
      })

      logger.info('Coin expiration process completed', {
        usersAffected: expirationsByUserId.size,
        totalCoinsExpired,
      })
    }

    return {
      usersAffected: expirationsByUserId.size,
      totalCoinsExpired,
      expirationsByUser,
      dryRun,
    }
  } catch (error) {
    logger.error('Error during coin expiration process', { error })
    throw new Error('Failed to expire coins.')
  }
}

/**
 * Get coins that are expiring soon for a user (within 90 days)
 * @param userId - User ID
 * @returns Data about coins expiring in next 30 and 90 days
 */
export async function getExpiringCoins(userId: string): Promise<ExpiringCoinsData> {
  try {
    const now = new Date()
    const in30Days = new Date(now)
    in30Days.setDate(in30Days.getDate() + 30)
    const in90Days = new Date(now)
    in90Days.setDate(in90Days.getDate() + 90)

    // Get all non-expired CREDIT REDEEMABLE transactions expiring within 90 days
    // Only consider transactions that still have remaining coins
    const expiringTransactions = await prisma.walletTransaction.findMany({
      where: {
        userId,
        transactionType: TransactionType.CREDIT,
        balanceType: BalanceType.REDEEMABLE,
        isExpired: false,
        remainingAmount: {
          gt: 0, // Only credits that still have balance
        },
        expiresAt: {
          gte: now,
          lte: in90Days,
        },
      },
      orderBy: {
        expiresAt: 'asc',
      },
    })

    // Calculate totals
    let totalExpiringNext30Days = 0
    let totalExpiringNext90Days = 0

    const batches: ExpiringCoinBatch[] = expiringTransactions.map(tx => {
      const daysUntilExpiration = Math.ceil(
        (tx.expiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      )
      const isUrgent = daysUntilExpiration <= 30

      // Use remainingAmount instead of original amount
      const remainingCoins = tx.remainingAmount ?? 0

      if (isUrgent) {
        totalExpiringNext30Days += remainingCoins
      }
      totalExpiringNext90Days += remainingCoins

      return {
        transactionId: tx.id,
        amount: remainingCoins, // Show how many will actually expire, not the original amount
        expiresAt: tx.expiresAt!,
        daysUntilExpiration,
        isUrgent,
      }
    })

    return {
      userId,
      totalExpiringNext30Days,
      totalExpiringNext90Days,
      urgentExpiration: totalExpiringNext30Days > 0,
      batches,
    }
  } catch (error) {
    logger.error('Error getting expiring coins for user', { error, userId })
    throw new Error('Failed to get expiring coins.')
  }
}

/**
 * Get expiration report for next N days (admin functionality)
 * @param days - Number of days to look ahead (default 90)
 * @returns Aggregated report of upcoming expirations
 */
export async function getExpirationReport(days = 90): Promise<{
  next30Days: { users: number; coins: number }
  next90Days: { users: number; coins: number }
  details: Array<{
    userId: string
    userName: string
    coinsExpiring: number
    earliestExpiration: Date
  }>
}> {
  try {
    const now = new Date()
    const in30Days = new Date(now)
    in30Days.setDate(in30Days.getDate() + 30)
    const in90Days = new Date(now)
    in90Days.setDate(in90Days.getDate() + Math.min(days, 90))

    // Get all non-expired transactions expiring within the period
    // Only consider transactions that still have remaining coins
    const expiringTransactions = await prisma.walletTransaction.findMany({
      where: {
        transactionType: TransactionType.CREDIT,
        balanceType: BalanceType.REDEEMABLE,
        isExpired: false,
        remainingAmount: {
          gt: 0, // Only credits that still have balance
        },
        expiresAt: {
          gte: now,
          lte: in90Days,
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        expiresAt: 'asc',
      },
    })

    // Group by user
    const byUser = new Map<string, {
      userName: string
      coins30Days: number
      coins90Days: number
      earliestExpiration: Date | null
    }>()

    for (const tx of expiringTransactions) {
      const existing = byUser.get(tx.userId) ?? {
        userName: tx.user.name,
        coins30Days: 0,
        coins90Days: 0,
        earliestExpiration: null,
      }

      // Use remainingAmount instead of original amount
      const remainingCoins = tx.remainingAmount ?? 0

      existing.coins90Days += remainingCoins

      if (tx.expiresAt! <= in30Days) {
        existing.coins30Days += remainingCoins
      }

      if (!existing.earliestExpiration || tx.expiresAt! < existing.earliestExpiration) {
        existing.earliestExpiration = tx.expiresAt!
      }

      byUser.set(tx.userId, existing)
    }

    // Calculate totals
    const next30Days = {
      users: Array.from(byUser.values()).filter(u => u.coins30Days > 0).length,
      coins: Array.from(byUser.values()).reduce((sum, u) => sum + u.coins30Days, 0),
    }

    const next90Days = {
      users: byUser.size,
      coins: Array.from(byUser.values()).reduce((sum, u) => sum + u.coins90Days, 0),
    }

    const details = Array.from(byUser.entries())
      .map(([userId, data]) => ({
        userId,
        userName: data.userName,
        coinsExpiring: data.coins90Days,
        earliestExpiration: data.earliestExpiration!,
      }))
      .sort((a, b) => b.coinsExpiring - a.coinsExpiring) // Sort by most coins expiring

    logger.info('Expiration report generated', {
      next30Days,
      next90Days,
      totalUsers: details.length,
    })

    return {
      next30Days,
      next90Days,
      details,
    }
  } catch (error) {
    logger.error('Error generating expiration report', { error, days })
    throw new Error('Failed to generate expiration report.')
  }
}
