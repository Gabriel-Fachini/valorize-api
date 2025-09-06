import { PrismaClient } from '@prisma/client'
import { logger } from './logger'

// Create a global Prisma client instance
const prisma = new PrismaClient({
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
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Set up logging events
// prisma.$on('query', (e) => {
//   logger.debug('Prisma Query', {
//     query: e.query,
//     params: e.params,
//     duration: `${e.duration}ms`,
//     target: e.target,
//   })
// })

prisma.$on('error', (e) => {
  logger.error('Prisma Error', {
    message: e.message,
    target: e.target,
  })
})

prisma.$on('info', (e) => {
  logger.info('Prisma Info', {
    message: e.message,
    target: e.target,
  })
})

prisma.$on('warn', (e) => {
  logger.warn('Prisma Warning', {
    message: e.message,
    target: e.target,
  })
})

// Helper functions
export const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect()
    logger.info('Prisma client connected successfully')
  } catch (error) {
    logger.error('Failed to connect Prisma client', error)
    throw error
  }
}

export const disconnectDB = async (): Promise<void> => {
  try {
    await prisma.$disconnect()
    logger.info('Prisma client disconnected')
  } catch (error) {
    logger.error('Failed to disconnect Prisma client', error)
    throw error
  }
}

export const healthCheck = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    logger.error('Prisma health check failed', error)
    return false
  }
}

// Export the prisma client
export { prisma }
export default prisma
