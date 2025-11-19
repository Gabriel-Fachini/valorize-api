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

      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: {
          redeemableBalance: newBalance,
        },
      })

      // Record the transaction
      await WalletTransactionModel.create({
        walletId: updatedWallet.id,
        userId,
        transactionType: TransactionType.DEBIT,
        balanceType: BalanceType.REDEEMABLE,
        amount,
        previousBalance,
        newBalance,
        reason,
        metadata: metadata ?? null,
      }, tx)

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
