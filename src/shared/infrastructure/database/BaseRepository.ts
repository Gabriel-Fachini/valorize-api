import { PrismaClient } from '@prisma/client'
import { PrismaConnection } from './PrismaConnection'
import { logger } from '../logger/Logger'

export abstract class BaseRepository {
  protected readonly prisma: PrismaClient

  constructor() {
    this.prisma = PrismaConnection.getInstance().getClient()
  }

  /**
   * Execute a function within a database transaction
   */
  protected async withTransaction<T>(
    callback: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    try {
      return await PrismaConnection.getInstance().transaction(callback)
    } catch (error) {
      logger.error('Transaction failed', error)
      throw error
    }
  }

  /**
   * Health check for repository
   */
  public async healthCheck(): Promise<boolean> {
    return PrismaConnection.getInstance().healthCheck()
  }

  /**
   * Get the raw Prisma client for advanced queries
   */
  protected getClient(): PrismaClient {
    return this.prisma
  }
} 