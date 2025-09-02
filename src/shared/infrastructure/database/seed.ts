import { PrismaClient } from '@prisma/client'
import { logger } from '../logger/Logger'

const prisma = new PrismaClient()

async function seed() {
  try {
    logger.info('Starting database seed...')

    // Example: Create initial data here
    // await prisma.user.createMany({
    //   data: [
    //     {
    //       auth0Id: 'auth0|example1',
    //       email: 'user1@example.com',
    //       name: 'John Doe',
    //     },
    //     {
    //       auth0Id: 'auth0|example2',
    //       email: 'user2@example.com',
    //       name: 'Jane Smith',
    //     },
    //   ],
    //   skipDuplicates: true,
    // })

    logger.info('Database seed completed successfully')
  } catch (error) {
    logger.error('Database seed failed', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
seed()
  .catch((error) => {
    logger.error('Seed script failed', error)
    process.exit(1)
  }) 