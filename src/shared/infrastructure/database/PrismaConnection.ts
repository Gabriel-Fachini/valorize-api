import { PrismaClient } from '@prisma/client'
import { logger } from '../logger/Logger'

export class PrismaConnection {
  private static instance: PrismaConnection
  private prisma: PrismaClient | null = null

  private constructor() {}

  public static getInstance(): PrismaConnection {
    if (!PrismaConnection.instance) {
      PrismaConnection.instance = new PrismaConnection()
    }
    return PrismaConnection.instance
  }

  public async connect(): Promise<void> {
    try {
      if (this.prisma) {
        logger.warn('Prisma client already connected')
        return
      }

      this.prisma = new PrismaClient({
        log: [
          {
            emit: 'event',
            level: 'query',
          },
          {
            emit: 'event',
            level: 'error',
          },
          {
            emit: 'event',
            level: 'info',
          },
          {
            emit: 'event',
            level: 'warn',
          },
        ],
        errorFormat: 'pretty',
      })

      // Set up logging events
      this.prisma.$on('query', (e) => {
        logger.debug('Prisma Query', {
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
          target: e.target
        })
      })

      this.prisma.$on('error', (e) => {
        logger.error('Prisma Error', {
          message: e.message,
          target: e.target
        })
      })

      this.prisma.$on('info', (e) => {
        logger.info('Prisma Info', {
          message: e.message,
          target: e.target
        })
      })

      this.prisma.$on('warn', (e) => {
        logger.warn('Prisma Warning', {
          message: e.message,
          target: e.target
        })
      })

      // Test the connection
      await this.prisma.$connect()
      logger.info('Prisma client connected successfully')

    } catch (error) {
      logger.error('Failed to connect Prisma client', error)
      throw error
    }
  }

  public async disconnect(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect()
      this.prisma = null
      logger.info('Prisma client disconnected')
    }
  }

  public getClient(): PrismaClient {
    if (!this.prisma) {
      throw new Error('Prisma client not initialized. Call connect() first.')
    }
    return this.prisma
  }

  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.prisma) {
        return false
      }
      
      // Simple query to test connection
      await this.prisma.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      logger.error('Prisma health check failed', error)
      return false
    }
  }

  public isConnected(): boolean {
    return this.prisma !== null
  }

  // Transaction helper
  public async transaction<T>(
    callback: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    if (!this.prisma) {
      throw new Error('Prisma client not initialized. Call connect() first.')
    }

    return this.prisma.$transaction(async (tx) => {
      return await callback(tx as PrismaClient)
    })
  }
} 