/**
 * Base seeder class with common functionality
 */

import { PrismaClient } from '@prisma/client'
import { logger } from '../../logger'

export abstract class BaseSeeder {
  constructor(protected prisma: PrismaClient) {}

  /**
   * Execute the seeding logic
   */
  abstract seed(): Promise<void>

  /**
   * Get the name of this seeder for logging
   */
  protected abstract get name(): string

  /**
   * Log the start of seeding
   */
  protected logStart(): void {
    logger.info(`🌱 Seeding ${this.name}...`)
  }

  /**
   * Log the completion of seeding with count
   */
  protected logComplete(count: number, itemName: string = 'items'): void {
    logger.info(`✅ Created ${count} ${itemName}`)
  }

  /**
   * Log a warning message
   */
  protected logWarning(message: string): void {
    logger.warn(`⚠️  ${message}`)
  }

  /**
   * Log an info message with context
   */
  protected logInfo(message: string): void {
    logger.info(`   ${message}`)
  }
}
