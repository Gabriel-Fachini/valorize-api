import { WalletModel } from './wallet.model'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/database'
import { WalletTransactionModel, TransactionType, BalanceType } from './wallet-transaction.model'

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
