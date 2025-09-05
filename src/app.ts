import 'dotenv/config'
import { buildApp } from '@config/app'
import { logger } from '@/lib/logger'
import { connectDB, disconnectDB } from '@/lib/database'

const start = async () => {
  try {
    // Initialize Prisma connection
    await connectDB()
    logger.info('Prisma connected successfully')

    // Build and start the application
    const app = await buildApp()
    
    const port = parseInt(process.env.PORT ?? '3000')
    const host = process.env.HOST ?? '0.0.0.0'
    
    await app.listen({ port, host })
    
    logger.info(`Server listening on ${host}:${port}`)
    logger.info(`API Documentation available at http://localhost:${port}/docs`)
    
  } catch (err) {
    logger.error('Error starting server:', err)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...')
  
  try {
    await disconnectDB()
    logger.info('Connections closed successfully')
    process.exit(0)
  } catch (error) {
    logger.error('Error during shutdown:', error)
    process.exit(1)
  }
})

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...')
  
  try {
    await disconnectDB()
    logger.info('Connections closed successfully')
    process.exit(0)
  } catch (error) {
    logger.error('Error during shutdown:', error)
    process.exit(1)
  }
})

start() 