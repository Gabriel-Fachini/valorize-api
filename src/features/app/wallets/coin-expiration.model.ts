import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'
import { CoinExpiration, Prisma } from '@prisma/client'

export type CoinExpirationData = CoinExpiration
export type CreateCoinExpirationData = Omit<
  CoinExpiration,
  'id' | 'createdAt' | 'processedAt'
>

export class CoinExpirationModel {
  constructor(private data: CoinExpirationData) {}

  get id() {
    return this.data.id
  }

  get userId() {
    return this.data.userId
  }

  get walletId() {
    return this.data.walletId
  }

  get originalTransactionId() {
    return this.data.originalTransactionId
  }

  get coinsExpired() {
    return this.data.coinsExpired
  }

  get expirationDate() {
    return this.data.expirationDate
  }

  get notified90Days() {
    return this.data.notified90Days
  }

  get notified30Days() {
    return this.data.notified30Days
  }

  get processedAt() {
    return this.data.processedAt
  }

  get createdAt() {
    return this.data.createdAt
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      walletId: this.walletId,
      originalTransactionId: this.originalTransactionId,
      coinsExpired: this.coinsExpired,
      expirationDate: this.expirationDate,
      notified90Days: this.notified90Days,
      notified30Days: this.notified30Days,
      processedAt: this.processedAt,
      createdAt: this.createdAt,
    }
  }

  /**
   * Create a new coin expiration record
   */
  static async create(
    data: CreateCoinExpirationData,
    tx?: Prisma.TransactionClient,
  ): Promise<CoinExpirationModel> {
    const db = tx ?? prisma
    try {
      const expiration = await db.coinExpiration.create({
        data: data as unknown as Prisma.CoinExpirationUncheckedCreateInput,
      })
      logger.info('Coin expiration record created', {
        userId: expiration.userId,
        coinsExpired: expiration.coinsExpired,
      })
      return new CoinExpirationModel(expiration)
    } catch (error) {
      logger.error('Error creating coin expiration', { error, data })
      throw new Error('Failed to create coin expiration record.')
    }
  }

  /**
   * Find all coin expirations for a user
   */
  static async findByUserId(
    userId: string,
    options?: {
      limit?: number
      offset?: number
      fromDate?: Date
      toDate?: Date
    },
  ): Promise<CoinExpirationModel[]> {
    try {
      const where: Prisma.CoinExpirationWhereInput = {
        userId,
        ...(options?.fromDate ?? options?.toDate) && {
          expirationDate: {
            ...(options?.fromDate && { gte: options.fromDate }),
            ...(options?.toDate && { lte: options.toDate }),
          },
        },
      }

      const expirations = await prisma.coinExpiration.findMany({
        where,
        orderBy: { expirationDate: 'desc' },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      })

      return expirations.map(e => new CoinExpirationModel(e))
    } catch (error) {
      logger.error('Error finding coin expirations by userId', {
        error,
        userId,
        options,
      })
      throw new Error('Failed to find coin expirations.')
    }
  }

  /**
   * Find coin expirations within a date range (for reports)
   */
  static async findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: {
      limit?: number
      offset?: number
    },
  ): Promise<CoinExpirationModel[]> {
    try {
      const expirations = await prisma.coinExpiration.findMany({
        where: {
          expirationDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { expirationDate: 'asc' },
        take: options?.limit ?? 100,
        skip: options?.offset ?? 0,
      })

      return expirations.map(e => new CoinExpirationModel(e))
    } catch (error) {
      logger.error('Error finding coin expirations by date range', {
        error,
        startDate,
        endDate,
        options,
      })
      throw new Error('Failed to find coin expirations.')
    }
  }

  /**
   * Mark a coin expiration as notified (90 or 30 days)
   */
  static async markNotified(
    id: string,
    type: '90days' | '30days',
    tx?: Prisma.TransactionClient,
  ): Promise<CoinExpirationModel> {
    const db = tx ?? prisma
    try {
      const field = type === '90days' ? 'notified90Days' : 'notified30Days'
      const expiration = await db.coinExpiration.update({
        where: { id },
        data: { [field]: true },
      })
      logger.info('Coin expiration marked as notified', { id, type })
      return new CoinExpirationModel(expiration)
    } catch (error) {
      logger.error('Error marking coin expiration as notified', {
        error,
        id,
        type,
      })
      throw new Error('Failed to mark coin expiration as notified.')
    }
  }

  /**
   * Get expiration statistics for a date range
   */
  static async getStatistics(
    startDate: Date,
    endDate: Date,
    companyId?: string,
  ): Promise<{
    totalCoinsExpired: number
    totalUsersAffected: number
    totalExpirations: number
  }> {
    try {
      const where: Prisma.CoinExpirationWhereInput = {
        expirationDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(companyId && {
          user: {
            companyId,
          },
        }),
      }

      const [stats, totalExpirations] = await Promise.all([
        prisma.coinExpiration.aggregate({
          where,
          _sum: {
            coinsExpired: true,
          },
          _count: {
            userId: true,
          },
        }),
        prisma.coinExpiration.count({ where }),
      ])

      return {
        totalCoinsExpired: stats._sum.coinsExpired ?? 0,
        totalUsersAffected: stats._count.userId,
        totalExpirations,
      }
    } catch (error) {
      logger.error('Error getting coin expiration statistics', {
        error,
        startDate,
        endDate,
        companyId,
      })
      throw new Error('Failed to get coin expiration statistics.')
    }
  }
}
