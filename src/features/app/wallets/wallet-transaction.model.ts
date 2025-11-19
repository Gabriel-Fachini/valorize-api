import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import { WalletTransaction, Prisma } from '@prisma/client'

export type WalletTransactionData = WalletTransaction
export type CreateWalletTransactionData = Omit<
  WalletTransaction,
  'id' | 'createdAt' | 'expiresAt' | 'isExpired' | 'expiredAt' | 'remainingAmount'
> & {
  expiresAt?: Date | null
  isExpired?: boolean
  expiredAt?: Date | null
  remainingAmount?: number | null
}

export enum TransactionType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
  RESET = 'RESET',
  EXPIRED = 'EXPIRED',
}

export enum BalanceType {
  COMPLIMENT = 'COMPLIMENT',
  REDEEMABLE = 'REDEEMABLE',
}

export class WalletTransactionModel {
  constructor(private data: WalletTransactionData) {}

  static async create(
    data: CreateWalletTransactionData,
    tx?: Prisma.TransactionClient,
  ): Promise<WalletTransactionModel> {
    const db = tx ?? prisma
    try {
      const transaction = await db.walletTransaction.create({
        data: data as unknown as Prisma.WalletTransactionUncheckedCreateInput,
      })
      return new WalletTransactionModel(transaction)
    } catch (error) {
      logger.error('Error creating wallet transaction', { error, data })
      throw new Error('Failed to create wallet transaction.')
    }
  }

  static async findByUserId(
    userId: string,
    options?: {
      limit?: number
      offset?: number
      balanceType?: BalanceType
      transactionType?: TransactionType
      fromDate?: Date
      toDate?: Date
    },
  ): Promise<WalletTransactionModel[]> {
    try {
      const where: Prisma.WalletTransactionWhereInput = {
        userId,
        ...(options?.balanceType && { balanceType: options.balanceType }),
        ...(options?.transactionType && { transactionType: options.transactionType }),
        ...(options?.fromDate ?? options?.toDate) && {
          createdAt: {
            ...(options?.fromDate && { gte: options.fromDate }),
            ...(options?.toDate && { lte: options.toDate }),
          },
        },
      }

      const transactions = await prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
        include: {
          wallet: true,
        },
      })

      return transactions.map(t => new WalletTransactionModel(t))
    } catch (error) {
      logger.error('Error finding wallet transactions by userId', {
        error,
        userId,
        options,
      })
      throw new Error('Failed to retrieve wallet transactions.')
    }
  }

  static async findByWalletId(
    walletId: string,
    limit = 50,
    offset = 0,
  ): Promise<WalletTransactionModel[]> {
    try {
      const transactions = await prisma.walletTransaction.findMany({
        where: { walletId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      })

      return transactions.map(t => new WalletTransactionModel(t))
    } catch (error) {
      logger.error('Error finding wallet transactions by walletId', {
        error,
        walletId,
      })
      throw new Error('Failed to retrieve wallet transactions.')
    }
  }

  static async countByUserId(
    userId: string,
    filters?: {
      balanceType?: BalanceType
      transactionType?: TransactionType
      fromDate?: Date
      toDate?: Date
    },
  ): Promise<number> {
    try {
      const where: Prisma.WalletTransactionWhereInput = {
        userId,
        ...(filters?.balanceType && { balanceType: filters.balanceType }),
        ...(filters?.transactionType && { transactionType: filters.transactionType }),
        ...(filters?.fromDate ?? filters?.toDate) && {
          createdAt: {
            ...(filters?.fromDate && { gte: filters.fromDate }),
            ...(filters?.toDate && { lte: filters.toDate }),
          },
        },
      }

      return await prisma.walletTransaction.count({ where })
    } catch (error) {
      logger.error('Error counting wallet transactions', { error, userId, filters })
      throw new Error('Failed to count wallet transactions.')
    }
  }

  // Getters for accessing data
  get id() { return this.data.id }
  get walletId() { return this.data.walletId }
  get userId() { return this.data.userId }
  get transactionType() { return this.data.transactionType }
  get balanceType() { return this.data.balanceType }
  get amount() { return this.data.amount }
  get previousBalance() { return this.data.previousBalance }
  get newBalance() { return this.data.newBalance }
  get reason() { return this.data.reason }
  get metadata() { return this.data.metadata }
  get createdAt() {
    return this.data.createdAt
  }
}
