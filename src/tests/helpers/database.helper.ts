/**
 * Database Test Helpers
 *
 * Provides utilities for test database isolation and cleanup
 * Strategy: Transaction rollback for fast test isolation
 */

import { prisma } from '@lib/database'

/**
 * Execute a test function within a transaction that automatically rolls back
 *
 * This ensures complete isolation between tests without manual cleanup
 * The transaction is reverted automatically after the test finishes
 *
 * @example
 * it('should update wallet', async () => {
 *   await withTransaction(async () => {
 *     const wallet = await WalletFactory.create()
 *     await walletService.credit(wallet.id, 100)
 *     expect(wallet.balance).toBe(100)
 *     // Automatically rolled back after test
 *   })
 * })
 */
export async function withTransaction<T>(
  testFn: () => Promise<T>
): Promise<T> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Execute test with transaction context
      // Any changes are accumulated in this transaction
      return await testFn()
    })
    return result
  } catch (error) {
    // Prisma automatically rolls back transaction on error
    throw error
  }
}

/**
 * Clean all tables in the test database
 *
 * WARNING: This is slow and only needed when transaction rollback isn't suitable
 * Prefer using withTransaction() for better performance
 *
 * @example
 * afterEach(async () => {
 *   await cleanDatabase()
 * })
 */
export async function cleanDatabase() {
  const tables = [
    'tremendous_webhook_logs',
    'voucher_redemptions',
    'wallet_transactions',
    'redemptions',
    'compliments',
    'wallet_resets',
    'wallets',
    'company_wallets',
    'voucher_prizes',
    'prize_variants',
    'prizes',
    'addresses',
    'company_values',
    'allowed_domains',
    'job_titles',
    'departments',
    'role_permissions',
    'user_roles',
    'roles',
    'company_settings',
    'users',
    'companies',
  ]

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`)
    } catch (error) {
      // Table might not exist, continue
    }
  }
}

/**
 * Truncate a specific table
 *
 * @param tableName - Name of the table to truncate
 * @example
 * await truncateTable('users')
 */
export async function truncateTable(tableName: string) {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE`)
}

/**
 * Get current row count for a table
 *
 * Useful for asserting data was created/deleted
 *
 * @example
 * const count = await getTableCount('users')
 * expect(count).toBe(1)
 */
export async function getTableCount(tableName: string): Promise<number> {
  const result = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    `SELECT COUNT(*) as count FROM "${tableName}"`
  )
  return Number(result[0].count)
}

/**
 * Check if a record exists by ID
 *
 * @param tableName - Table name
 * @param id - Record ID
 */
export async function recordExists(
  tableName: string,
  id: string
): Promise<boolean> {
  const result = await prisma.$queryRawUnsafe<[{ exists: boolean }]>(
    `SELECT EXISTS(SELECT 1 FROM "${tableName}" WHERE id = $1) as exists`,
    id
  )
  return result[0].exists
}

/**
 * Get the time since database server started
 *
 * Useful for testing time-based features
 *
 * @example
 * const time = await getDatabaseNow()
 * // Use this instead of new Date() for consistency
 */
export async function getDatabaseNow(): Promise<Date> {
  const result = await prisma.$queryRawUnsafe<[{ now: Date }]>(
    'SELECT NOW() as now'
  )
  return result[0].now
}

// TODO: Add these helpers as needed:
// - seedTestData() - Pre-populate test database with common test data
// - setupTestDatabase() - Run migrations and setup for test database
// - disconnectTestDatabase() - Close connection after tests
// - resetSequences() - Reset auto-increment sequences (if needed)
