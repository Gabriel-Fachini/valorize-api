import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import { Wallet, Prisma } from '@prisma/client'
import { WalletTransactionModel, TransactionType, BalanceType } from './wallet-transaction.model'

export type WalletData = Omit<Wallet, 'createdAt' | 'updatedAt'>
export type CreateWalletData = Omit<WalletData, 'id'>

/**
 * Calculate expiration date for redeemable coins (18 months from credit date)
 */
export function calculateCoinExpirationDate(creditedAt: Date = new Date()): Date {
  const expiresAt = new Date(creditedAt)
  expiresAt.setMonth(expiresAt.getMonth() + 18)
  return expiresAt
}

export class WalletModel {
  public complimentBalance: number
  public redeemableBalance: number

  constructor(private data: WalletData) {
    this.complimentBalance = data.complimentBalance
    this.redeemableBalance = data.redeemableBalance
  }

  static async findByUserId(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<WalletModel | null> {
    const db = tx ?? prisma
    try {
      const wallet = await db.wallet.findUnique({
        where: { userId },
      })
      if (!wallet) return null
      return new WalletModel(wallet)
    } catch (error) {
      logger.error('Error finding wallet by userId', { error, userId })
      throw new Error('Failed to retrieve wallet.')
    }
  }

  static async getOrCreateByUserId(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<WalletModel> {
    const db = tx ?? prisma
    const existingWallet = await this.findByUserId(userId, db)
    if (existingWallet) {
      return existingWallet
    }

    try {
      const newWallet = await db.wallet.create({
        data: { userId },
      })
      return new WalletModel(newWallet)
    } catch (error) {
      logger.error('Error creating wallet for user', { error, userId })
      throw new Error('Failed to create wallet.')
    }
  }

  static async debitComplimentBalance(
    userId: string,
    amount: number,
    tx: Prisma.TransactionClient,
    reason = 'Compliment sent',
    metadata?: Prisma.JsonObject,
  ): Promise<WalletModel> {
    try {
      // Get current balance first
      const currentWallet = await tx.wallet.findUnique({
        where: { userId },
      })
      
      if (!currentWallet) {
        throw new Error('Wallet not found')
      }

      const previousBalance = currentWallet.complimentBalance
      const newBalance = previousBalance - amount

      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: {
          complimentBalance: newBalance,
        },
      })

      // Record the transaction
      await WalletTransactionModel.create({
        walletId: updatedWallet.id,
        userId,
        transactionType: TransactionType.DEBIT,
        balanceType: BalanceType.COMPLIMENT,
        amount,
        previousBalance,
        newBalance,
        reason,
        metadata: metadata ?? null,
      }, tx)

      return new WalletModel(updatedWallet)
    } catch (error) {
      logger.error('Error debiting compliment balance', {
        error,
        userId,
        amount,
      })
      throw new Error('Failed to debit compliment balance.')
    }
  }

  static async creditRedeemableBalance(
    userId: string,
    amount: number,
    tx: Prisma.TransactionClient,
    reason = 'Compliment received',
    metadata?: Prisma.JsonObject,
  ): Promise<WalletModel> {
    try {
      // Ensure wallet exists before crediting
      await this.getOrCreateByUserId(userId, tx)

      // Get current balance
      const currentWallet = await tx.wallet.findUnique({
        where: { userId },
      })
      
      if (!currentWallet) {
        throw new Error('Wallet not found')
      }

      const previousBalance = currentWallet.redeemableBalance
      const newBalance = previousBalance + amount

      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: {
          redeemableBalance: newBalance,
        },
      })

      // Calculate expiration date (18 months from now)
      const expiresAt = calculateCoinExpirationDate()

      // Record the transaction with expiration date
      await WalletTransactionModel.create({
        walletId: updatedWallet.id,
        userId,
        transactionType: TransactionType.CREDIT,
        balanceType: BalanceType.REDEEMABLE,
        amount,
        remainingAmount: amount, // Initialize with full amount for FIFO tracking
        previousBalance,
        newBalance,
        reason,
        metadata: metadata ?? null,
        expiresAt, // Track when these coins will expire
        isExpired: false,
        expiredAt: null,
      }, tx)

      return new WalletModel(updatedWallet)
    } catch (error) {
      logger.error('Error crediting redeemable balance', {
        error,
        userId,
        amount,
      })
      throw new Error('Failed to credit redeemable balance.')
    }
  }

  static async debitRedeemableBalance(
    userId: string,
    amount: number,
    tx: Prisma.TransactionClient,
    reason = 'Prize redemption',
    metadata?: Prisma.JsonObject,
  ): Promise<WalletModel> {
    try {
      // Get current balance first
      const currentWallet = await tx.wallet.findUnique({
        where: { userId },
      })

      if (!currentWallet) {
        throw new Error('Wallet not found')
      }

      const previousBalance = currentWallet.redeemableBalance
      const newBalance = previousBalance - amount

      if (newBalance < 0) {
        throw new Error('Insufficient redeemable balance')
      }

      // FIFO: Get all available credit transactions ordered by creation date (oldest first)
      const availableCredits = await tx.walletTransaction.findMany({
        where: {
          userId,
          transactionType: TransactionType.CREDIT,
          balanceType: BalanceType.REDEEMABLE,
          isExpired: false,
          remainingAmount: {
            gt: 0, // Only credits that still have balance
          },
        },
        orderBy: {
          createdAt: 'asc', // FIFO: oldest first
        },
      })

      // Consume credits from oldest to newest (FIFO)
      let remainingToDebit = amount
      const consumedCredits: Array<{ transactionId: string; amountConsumed: number }> = []

      for (const credit of availableCredits) {
        if (remainingToDebit <= 0) break

        const availableInThisCredit = credit.remainingAmount ?? 0
        const toConsume = Math.min(availableInThisCredit, remainingToDebit)

        // Update the credit's remaining amount
        await tx.walletTransaction.update({
          where: { id: credit.id },
          data: {
            remainingAmount: availableInThisCredit - toConsume,
          },
        })

        consumedCredits.push({
          transactionId: credit.id,
          amountConsumed: toConsume,
        })

        remainingToDebit -= toConsume

        logger.debug('Consumed coins from credit transaction', {
          creditId: credit.id,
          amountConsumed: toConsume,
          remainingInCredit: availableInThisCredit - toConsume,
          stillToDebit: remainingToDebit,
        })
      }

      // Sanity check: ensure we consumed exactly the requested amount
      if (remainingToDebit > 0) {
        throw new Error(
          `Failed to consume all coins. Missing ${remainingToDebit} coins. This should not happen.`,
        )
      }

      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: {
          redeemableBalance: newBalance,
        },
      })

      // Record the debit transaction with FIFO tracking metadata
      await WalletTransactionModel.create({
        walletId: updatedWallet.id,
        userId,
        transactionType: TransactionType.DEBIT,
        balanceType: BalanceType.REDEEMABLE,
        amount,
        previousBalance,
        newBalance,
        reason,
        metadata: {
          ...(metadata ?? {}),
          consumedCredits, // Track which credits were consumed (audit trail)
        } as Prisma.JsonObject,
      }, tx)

      logger.info('Debited redeemable balance using FIFO', {
        userId,
        amount,
        creditsConsumed: consumedCredits.length,
      })

      return new WalletModel(updatedWallet)
    } catch (error) {
      logger.error('Error debiting redeemable balance', {
        error,
        userId,
        amount,
      })
      throw new Error('Failed to debit redeemable balance.')
    }
  }
}
