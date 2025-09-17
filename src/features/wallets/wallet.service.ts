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
        users: {
          where: { isActive: true },
          include: { wallet: true },
        },
      },
    })

    let totalWalletsUpdated = 0
    let companiesProcessed = 0

    await prisma.$transaction(async (tx) => {
      for (const company of companies) {
        const weeklyLimit = company.settings?.weeklyComplimentCoinLimit ?? 100
        
        // Reset each wallet individually to record transactions
        for (const user of company.users) {
          if (user.wallet) {
            const previousBalance = user.wallet.complimentBalance
            
            // Update wallet balance
            await tx.wallet.update({
              where: { id: user.wallet.id },
              data: { complimentBalance: weeklyLimit },
            })

            // Record the transaction
            await WalletTransactionModel.create({
              walletId: user.wallet.id,
              userId: user.id,
              transactionType: TransactionType.RESET,
              balanceType: BalanceType.COMPLIMENT,
              amount: weeklyLimit - previousBalance,
              previousBalance,
              newBalance: weeklyLimit,
              reason: 'Weekly balance reset',
              metadata: {
                adminUserId,
                companyId: company.id,
                weeklyLimit,
              },
            }, tx)

            totalWalletsUpdated++
          }
        }
        
        companiesProcessed++
        logger.info(`Reset compliment balance for company ${company.id}: ${company.users.length} wallets updated to ${weeklyLimit} coins`)
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
